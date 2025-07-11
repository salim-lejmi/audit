﻿    using Microsoft.AspNetCore.Mvc;
    using Microsoft.AspNetCore.Http;
    using Microsoft.EntityFrameworkCore;
    using server.Data;
    using server.Models;
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Threading.Tasks;

    namespace server.Controllers
    {
        [ApiController]
        [Route("api/texts")]
        public class TextController : ControllerBase
        {
            private readonly AuditDbContext _context;
            private readonly IWebHostEnvironment _environment;

            public TextController(AuditDbContext context, IWebHostEnvironment environment)
            {
                _context = context;
                _environment = environment;
            }

[HttpGet]
public async Task<IActionResult> GetTexts(
    [FromQuery] int? domainId = null,
    [FromQuery] int? themeId = null,
    [FromQuery] int? subThemeId = null,
    [FromQuery] string nature = null,
    [FromQuery] int? publicationYear = null,
    [FromQuery] string keyword = null,
    [FromQuery] string status = null,
    [FromQuery] string textType = null,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10)
{
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");
    var userRole = HttpContext.Session.GetString("UserRole");
    
    if (!userId.HasValue)
    {
        return Unauthorized(new { message = "Not authenticated" });
    }

    IQueryable<Text> query = _context.Texts
        .Include(t => t.CreatedBy)
        .Include(t => t.DomainObject)
        .Include(t => t.ThemeObject)
        .Include(t => t.SubThemeObject)
        .Include(t => t.Company); // Add company include for Super Admin

    // Filter by company only if not Super Admin
    if (userRole != "SuperAdmin")
    {
        if (!companyId.HasValue)
        {
            return Unauthorized(new { message = "Not authenticated" });
        }
        query = query.Where(t => t.CompanyId == companyId.Value);
    }

    // Apply your existing filters...
    if (domainId.HasValue)
        query = query.Where(t => t.DomainId == domainId.Value);

    if (themeId.HasValue)
        query = query.Where(t => t.ThemeId == themeId.Value);

    if (subThemeId.HasValue)
        query = query.Where(t => t.SubThemeId == subThemeId.Value);

    if (!string.IsNullOrEmpty(nature))
        query = query.Where(t => t.Nature.Contains(nature));

    if (publicationYear.HasValue)
        query = query.Where(t => t.PublicationYear == publicationYear.Value);

    if (!string.IsNullOrEmpty(keyword))
        query = query.Where(t => t.Reference.Contains(keyword) ||
                                t.Content.Contains(keyword));

    if (!string.IsNullOrEmpty(status))
        query = query.Where(t => t.Status == status);

    if (!string.IsNullOrEmpty(textType))
        query = query.Where(t => t.Status == textType);

    var totalCount = await query.CountAsync();

    var texts = await query
        .OrderByDescending(t => t.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(t => new
        {
            textId = t.TextId,
            domainId = t.DomainId,
            themeId = t.ThemeId,
            subThemeId = t.SubThemeId,
            domain = t.DomainObject != null ? t.DomainObject.Name : "",
            theme = t.ThemeObject != null ? t.ThemeObject.Name : "",
            subTheme = t.SubThemeObject != null ? t.SubThemeObject.Name : "",
            reference = t.Reference ?? "",
            nature = t.Nature,
            publicationYear = t.PublicationYear,
            status = t.Status,
            isConsulted = t.IsConsulted,
            createdAt = t.CreatedAt,
            createdBy = t.CreatedBy != null ? t.CreatedBy.Name : null,
            // Include company information for Super Admin
            companyId = t.CompanyId,
            companyName = t.Company != null ? t.Company.CompanyName : ""
        })
        .ToListAsync();

    return Ok(new
    {
        texts,
        totalCount,
        totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
        currentPage = page
    });
}            [HttpGet("domains")]
            public async Task<IActionResult> GetDomains()
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                if (!userId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                var domains = await _context.Domains
                    .Select(d => d.Name)
                    .ToListAsync();

                return Ok(domains);
            }

            [HttpGet("themes")]
            public async Task<IActionResult> GetThemes([FromQuery] int? domainId = null)
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                if (!userId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                IQueryable<string> query;

                if (domainId.HasValue)
                {
                    query = _context.Themes
                        .Where(t => t.DomainId == domainId.Value)
                        .Select(t => t.Name);
                }
                else
                {
                    query = _context.Themes
                        .Select(t => t.Name);
                }

                var themes = await query.ToListAsync();
                return Ok(themes);
            }

            [HttpGet("subthemes")]
            public async Task<IActionResult> GetSubThemes(
                [FromQuery] int? domainId = null,
                [FromQuery] int? themeId = null)
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                if (!userId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                IQueryable<string> query;

                if (domainId.HasValue && themeId.HasValue)
                {
                    query = _context.SubThemes
                        .Where(s => s.Theme.DomainId == domainId.Value && s.ThemeId == themeId.Value)
                        .Select(s => s.Name);
                }
                else if (domainId.HasValue)
                {
                    query = _context.SubThemes
                        .Where(s => s.Theme.DomainId == domainId.Value)
                        .Select(s => s.Name);
                }
                else if (themeId.HasValue)
                {
                    query = _context.SubThemes
                        .Where(s => s.ThemeId == themeId.Value)
                        .Select(s => s.Name);
                }
                else
                {
                    query = _context.SubThemes
                        .Select(s => s.Name);
                }

                var subThemes = await query.ToListAsync();
                return Ok(subThemes);
            }

[HttpGet("{id}")]
public async Task<IActionResult> GetText(int id)
{
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");
    var userRole = HttpContext.Session.GetString("UserRole");
    
    if (!userId.HasValue)
    {
        return Unauthorized(new { message = "Not authenticated" });
    }

    var query = _context.Texts
        .Include(t => t.CreatedBy)
        .Include(t => t.Requirements)
        .Include(t => t.DomainObject)
        .Include(t => t.ThemeObject)
        .Include(t => t.SubThemeObject)
        .Where(t => t.TextId == id);

    // Filter by company only if not Super Admin
    if (userRole != "SuperAdmin")
    {
        if (!companyId.HasValue)
        {
            return Unauthorized(new { message = "Not authenticated" });
        }
        query = query.Where(t => t.CompanyId == companyId.Value);
    }

    var text = await query.FirstOrDefaultAsync();

    if (text == null)
    {
        return NotFound(new { message = "Text not found" });
    }

    // Mark as consulted if not already
    if (!text.IsConsulted)
    {
        text.IsConsulted = true;
        await _context.SaveChangesAsync();
    }

    return Ok(new
    {
        textId = text.TextId,
        domainId = text.DomainId,
        themeId = text.ThemeId,
        subThemeId = text.SubThemeId,
        domain = text.DomainObject?.Name,
        theme = text.ThemeObject?.Name,
        subTheme = text.SubThemeObject?.Name,
        reference = text.Reference,
        nature = text.Nature,
        publicationYear = text.PublicationYear,
        status = text.Status,
        penalties = text.Penalties,
        relatedTexts = text.RelatedTexts,
        effectiveDate = text.EffectiveDate,
        content = text.Content,
        filePath = text.FilePath,
        isConsulted = text.IsConsulted,
        createdAt = text.CreatedAt,
        createdBy = text.CreatedBy != null ? text.CreatedBy.Name : null,
        requirements = text.Requirements.Select(r => new
        {
            requirementId = r.RequirementId,
            number = r.Number,
            title = r.Title,
            status = r.Status
        }).ToList()
    });
}
[HttpGet("{id}/file")]
public async Task<IActionResult> GetFile(int id)
{
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");
    var userRole = HttpContext.Session.GetString("UserRole");
    
    if (!userId.HasValue)
    {
        return Unauthorized(new { message = "Not authenticated" });
    }

    var query = _context.Texts.Where(t => t.TextId == id);

    // Filter by company only if not Super Admin
    if (userRole != "SuperAdmin")
    {
        if (!companyId.HasValue)
        {
            return Unauthorized(new { message = "Not authenticated" });
        }
        query = query.Where(t => t.CompanyId == companyId.Value);
    }

    var text = await query.FirstOrDefaultAsync();
        
    if (text == null || string.IsNullOrEmpty(text.FilePath))
    {
        return NotFound(new { message = "File not found" });
    }

    var filePath = Path.Combine(_environment.ContentRootPath, text.FilePath);
    if (!System.IO.File.Exists(filePath))
    {
        return NotFound(new { message = "File not found" });
    }

    var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
    return File(fileBytes, "application/pdf", Path.GetFileName(filePath));
}
          [HttpPost]
public async Task<IActionResult> CreateText([FromForm] CreateTextRequest request)
{
    var userRole = HttpContext.Session.GetString("UserRole");
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");

    if (!userId.HasValue || !companyId.HasValue || (userRole != "SuperAdmin" && userRole != "SubscriptionManager"))
    {
        return Forbid();
    }

    if (request.DomainId <= 0 ||
        string.IsNullOrEmpty(request.Reference) ||
        request.PublicationYear <= 0)
    {
        return BadRequest(new { message = "Required fields are missing" });
    }

    // Validate domain exists
    var domain = await _context.Domains.FindAsync(request.DomainId);
    if (domain == null)
    {
        return BadRequest(new { message = "Selected domain does not exist" });
    }

    // Validate theme exists if provided
    if (request.ThemeId.HasValue)
    {
        var theme = await _context.Themes.FirstOrDefaultAsync(t =>
            t.ThemeId == request.ThemeId.Value &&
            t.DomainId == request.DomainId);

        if (theme == null)
        {
            return BadRequest(new { message = "Selected theme does not exist or does not belong to the selected domain" });
        }
    }

    // Validate subtheme exists if provided
    if (request.SubThemeId.HasValue && request.ThemeId.HasValue)
    {
        var subTheme = await _context.SubThemes.FirstOrDefaultAsync(s =>
            s.SubThemeId == request.SubThemeId.Value &&
            s.ThemeId == request.ThemeId.Value);

        if (subTheme == null)
        {
            return BadRequest(new { message = "Selected subtheme does not exist or does not belong to the selected theme" });
        }
    }

    // Save file if provided
    string filePath = null;
    if (request.File != null && request.File.Length > 0)
    {
        var uploadDir = Path.Combine(_environment.ContentRootPath, "Uploads", "Texts");
        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }

        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(request.File.FileName);
        filePath = Path.Combine("Uploads", "Texts", fileName);
        var fullPath = Path.Combine(_environment.ContentRootPath, filePath);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await request.File.CopyToAsync(stream);
        }
    }

    var text = new Text
    {
        CompanyId = companyId.Value, // Associate text with the current company
        DomainId = request.DomainId,
        ThemeId = request.ThemeId,
        SubThemeId = request.SubThemeId,
        Reference = request.Reference,
        Nature = request.Nature ?? "",
        PublicationYear = request.PublicationYear,
        Status = request.Status ?? "À vérifier",
        Penalties = request.Penalties ?? "",
        RelatedTexts = request.RelatedTexts ?? "",
        EffectiveDate = request.EffectiveDate,
        Content = request.Content ?? "",
        FilePath = filePath,
        CreatedById = userId.Value,
        CreatedAt = DateTime.Now
    };

    _context.Texts.Add(text);
    await _context.SaveChangesAsync();

    // Add requirements if provided
    if (request.Requirements != null && request.Requirements.Count > 0)
    {
        foreach (var req in request.Requirements)
        {
            var requirement = new TextRequirement
            {
                TextId = text.TextId,
                Number = req.Number,
                Title = req.Title,
                Status = req.Status ?? "À vérifier"
            };
            _context.TextRequirements.Add(requirement);
        }
        await _context.SaveChangesAsync();
    }

    return Ok(new
    {
        textId = text.TextId,
        message = "Text created successfully"
    });
}


[HttpPut("{id}")]
public async Task<IActionResult> UpdateText(int id, [FromForm] UpdateTextRequest request)
{
    var userRole = HttpContext.Session.GetString("UserRole");
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");

    if (!userId.HasValue || !companyId.HasValue || (userRole != "SuperAdmin" && userRole != "SubscriptionManager"))
    {
        return Forbid();
    }

    var text = await _context.Texts
        .FirstOrDefaultAsync(t => t.TextId == id && t.CompanyId == companyId.Value); // Filter by company
        
    if (text == null)
    {
        return NotFound(new { message = "Text not found" });
    }

    // Validate domain exists if provided
    if (request.DomainId.HasValue && request.DomainId.Value > 0)
    {
        var domain = await _context.Domains.FindAsync(request.DomainId.Value);
        if (domain == null)
        {
            return BadRequest(new { message = "Selected domain does not exist" });
        }

        text.DomainId = request.DomainId.Value;
    }

    // Rest of the update code remains the same...
    // Validate theme exists if provided
    if (request.ThemeId.HasValue)
    {
        // If theme is null or 0, clear the theme
        if (request.ThemeId.Value <= 0)
        {
            text.ThemeId = null;
            text.SubThemeId = null;  // Clear subtheme when theme is cleared
        }
        else
        {
            // Verify theme exists and belongs to the domain
            var domainId = request.DomainId ?? text.DomainId;
            var theme = await _context.Themes.FirstOrDefaultAsync(t =>
                t.ThemeId == request.ThemeId.Value &&
                t.DomainId == domainId);

            if (theme == null)
            {
                return BadRequest(new { message = "Selected theme does not exist or does not belong to the selected domain" });
            }

            text.ThemeId = request.ThemeId.Value;
        }
    }

    // Validate subtheme exists if provided
    if (request.SubThemeId.HasValue)
    {
        // If subtheme is null or 0, clear the subtheme
        if (request.SubThemeId.Value <= 0)
        {
            text.SubThemeId = null;
        }
        else
        {
            // Verify theme is set
            var themeId = request.ThemeId ?? text.ThemeId;
            if (!themeId.HasValue)
            {
                return BadRequest(new { message = "Cannot set a subtheme without a theme" });
            }

            // Verify subtheme exists and belongs to the theme
            var subTheme = await _context.SubThemes.FirstOrDefaultAsync(s =>
                s.SubThemeId == request.SubThemeId.Value &&
                s.ThemeId == themeId.Value);

            if (subTheme == null)
            {
                return BadRequest(new { message = "Selected subtheme does not exist or does not belong to the selected theme" });
            }

            text.SubThemeId = request.SubThemeId.Value;
        }
    }

    // Update other fields if provided
    if (!string.IsNullOrEmpty(request.Reference))
        text.Reference = request.Reference;

    if (request.Nature != null)
        text.Nature = request.Nature;

    if (request.PublicationYear > 0)
        text.PublicationYear = request.PublicationYear;

    if (!string.IsNullOrEmpty(request.Status))
        text.Status = request.Status;

    if (request.Penalties != null)
        text.Penalties = request.Penalties;

    if (request.RelatedTexts != null)
        text.RelatedTexts = request.RelatedTexts;

    if (request.EffectiveDate.HasValue)
        text.EffectiveDate = request.EffectiveDate;

    if (request.Content != null)
        text.Content = request.Content;

    // Update file if provided
    if (request.File != null && request.File.Length > 0)
    {
        // Delete old file if exists
        if (!string.IsNullOrEmpty(text.FilePath))
        {
            var oldFilePath = Path.Combine(_environment.ContentRootPath, text.FilePath);
            if (System.IO.File.Exists(oldFilePath))
            {
                System.IO.File.Delete(oldFilePath);
            }
        }

        // Save new file
        var uploadDir = Path.Combine(_environment.ContentRootPath, "Uploads", "Texts");
        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }

        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(request.File.FileName);
        var filePath = Path.Combine("Uploads", "Texts", fileName);
        var fullPath = Path.Combine(_environment.ContentRootPath, filePath);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await request.File.CopyToAsync(stream);
        }

        text.FilePath = filePath;
    }

    await _context.SaveChangesAsync();

    return Ok(new { message = "Text updated successfully" });
}

[HttpPut("{id}/requirement/{requirementId}")]
public async Task<IActionResult> UpdateRequirement(int id, int requirementId, [FromBody] UpdateRequirementRequest request)
{
    var userRole = HttpContext.Session.GetString("UserRole");
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");

    if (!userId.HasValue || !companyId.HasValue)
    {
        return Unauthorized(new { message = "Not authenticated" });
    }

    // First verify the text belongs to the user's company
    var text = await _context.Texts
        .FirstOrDefaultAsync(t => t.TextId == id && t.CompanyId == companyId.Value);
    
    if (text == null)
    {
        return NotFound(new { message = "Text not found" });
    }

    var requirement = await _context.TextRequirements
        .FirstOrDefaultAsync(r => r.RequirementId == requirementId && r.TextId == id);

    if (requirement == null)
    {
        return NotFound(new { message = "Requirement not found" });
    }

    if (!string.IsNullOrEmpty(request.Status))
        requirement.Status = request.Status;

    if (!string.IsNullOrEmpty(request.Number))
        requirement.Number = request.Number;

    if (!string.IsNullOrEmpty(request.Title))
        requirement.Title = request.Title;

    await _context.SaveChangesAsync();

    return Ok(new { message = "Requirement updated successfully" });
}

[HttpPost("{id}/requirement")]
public async Task<IActionResult> AddRequirement(int id, [FromBody] AddRequirementRequest request)
{
    var userRole = HttpContext.Session.GetString("UserRole");
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");

    if (!userId.HasValue || !companyId.HasValue || (userRole != "SuperAdmin" && userRole != "SubscriptionManager"))
    {
        return Forbid();
    }

    var text = await _context.Texts
        .FirstOrDefaultAsync(t => t.TextId == id && t.CompanyId == companyId.Value);
        
    if (text == null)
    {
        return NotFound(new { message = "Text not found" });
    }

    if (string.IsNullOrEmpty(request.Number) || string.IsNullOrEmpty(request.Title))
    {
        return BadRequest(new { message = "Number and title are required" });
    }

    var requirement = new TextRequirement
    {
        TextId = id,
        Number = request.Number,
        Title = request.Title,
        Status = request.Status ?? "À vérifier"
    };

    _context.TextRequirements.Add(requirement);
    await _context.SaveChangesAsync();

    return Ok(new
    {
        requirementId = requirement.RequirementId,
        message = "Requirement added successfully"
    });
}
          [HttpDelete("{id}/requirement/{requirementId}")]
public async Task<IActionResult> DeleteRequirement(int id, int requirementId)
{
    var userRole = HttpContext.Session.GetString("UserRole");
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");

    if (!userId.HasValue || !companyId.HasValue || (userRole != "SuperAdmin" && userRole != "SubscriptionManager"))
    {
        return Forbid();
    }

    // First verify the text belongs to the user's company
    var text = await _context.Texts
        .FirstOrDefaultAsync(t => t.TextId == id && t.CompanyId == companyId.Value);
    
    if (text == null)
    {
        return NotFound(new { message = "Text not found" });
    }

    var requirement = await _context.TextRequirements
        .FirstOrDefaultAsync(r => r.RequirementId == requirementId && r.TextId == id);

    if (requirement == null)
    {
        return NotFound(new { message = "Requirement not found" });
    }

    _context.TextRequirements.Remove(requirement);
    await _context.SaveChangesAsync();

    return Ok(new { message = "Requirement deleted successfully" });
}

[HttpDelete("{id}")]
public async Task<IActionResult> DeleteText(int id)
{
    var userRole = HttpContext.Session.GetString("UserRole");
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");

    if (!userId.HasValue || (userRole != "SuperAdmin" && userRole != "SubscriptionManager"))
    {
        return Unauthorized(new { message = "Access denied" });
    }

    var query = _context.Texts.Where(t => t.TextId == id);

    // Filter by company only if not Super Admin
    if (userRole != "SuperAdmin")
    {
        if (!companyId.HasValue)
        {
            return Unauthorized(new { message = "Not authenticated" });
        }
        query = query.Where(t => t.CompanyId == companyId.Value);
    }

    var text = await query.FirstOrDefaultAsync();

    if (text == null)
    {
        return NotFound(new { message = "Text not found" });
    }

    // Start a transaction to ensure data consistency
    using var transaction = await _context.Database.BeginTransactionAsync();
    
    try
    {
        // Step 1: Get all actions that will be deleted (both direct and via requirements)
        var textRequirementIds = await _context.TextRequirements
            .Where(tr => tr.TextId == id)
            .Select(tr => tr.RequirementId)
            .ToListAsync();

        var allActionIdsToDelete = new List<int>();

        // Get actions that reference TextRequirements of this Text
        if (textRequirementIds.Any())
        {
            var requirementActionIds = await _context.Actions
                .Where(a => a.RequirementId.HasValue && textRequirementIds.Contains(a.RequirementId.Value))
                .Select(a => a.ActionId)
                .ToListAsync();
            
            allActionIdsToDelete.AddRange(requirementActionIds);
        }

        // Get actions that directly reference this Text
        var directTextActionIds = await _context.Actions
            .Where(a => a.TextId.HasValue && a.TextId.Value == id)
            .Select(a => a.ActionId)
            .ToListAsync();

        allActionIdsToDelete.AddRange(directTextActionIds);

        // Step 2: Delete notifications that reference these actions
        if (allActionIdsToDelete.Any())
        {
            var notificationsToDelete = await _context.Notifications
                .Where(n => allActionIdsToDelete.Contains(n.RelatedActionId.Value))
                .ToListAsync();

            if (notificationsToDelete.Any())
            {
                _context.Notifications.RemoveRange(notificationsToDelete);
                await _context.SaveChangesAsync();
            }
        }

        // Step 3: Now delete the actions
        if (allActionIdsToDelete.Any())
        {
            var actionsToDelete = await _context.Actions
                .Where(a => allActionIdsToDelete.Contains(a.ActionId))
                .ToListAsync();

            if (actionsToDelete.Any())
            {
                _context.Actions.RemoveRange(actionsToDelete);
                await _context.SaveChangesAsync();
            }
        }

        // Step 4: Delete ComplianceEvaluations and their related data
        var evaluations = await _context.ComplianceEvaluations
            .Where(ce => ce.TextId == id)
            .ToListAsync();

        if (evaluations.Any())
        {
            var evaluationIds = evaluations.Select(e => e.EvaluationId).ToList();

            // Delete related records (these should cascade automatically, but being explicit)
            var observations = await _context.Observations
                .Where(o => evaluationIds.Contains(o.EvaluationId))
                .ToListAsync();
            
            var monitoringParams = await _context.MonitoringParameters
                .Where(mp => evaluationIds.Contains(mp.EvaluationId))
                .ToListAsync();
            
            var attachments = await _context.EvaluationAttachments
                .Where(ea => evaluationIds.Contains(ea.EvaluationId))
                .ToListAsync();
            
            var history = await _context.EvaluationHistory
                .Where(eh => evaluationIds.Contains(eh.EvaluationId))
                .ToListAsync();

            // Remove all evaluation-related data
            if (observations.Any()) _context.Observations.RemoveRange(observations);
            if (monitoringParams.Any()) _context.MonitoringParameters.RemoveRange(monitoringParams);
            if (attachments.Any()) _context.EvaluationAttachments.RemoveRange(attachments);
            if (history.Any()) _context.EvaluationHistory.RemoveRange(history);
            
            // Remove evaluations
            _context.ComplianceEvaluations.RemoveRange(evaluations);
            await _context.SaveChangesAsync();
        }

        // Step 5: Delete RevueLegalTexts that reference this text
        var revueLegalTexts = await _context.RevueLegalTexts
            .Where(rlt => rlt.TextId == id)
            .ToListAsync();

        if (revueLegalTexts.Any())
        {
            _context.RevueLegalTexts.RemoveRange(revueLegalTexts);
            await _context.SaveChangesAsync();
        }

        // Step 6: Delete RevueRequirements that reference TextRequirements of this text
        if (textRequirementIds.Any())
        {
            var revueRequirements = await _context.RevueRequirements
                .Where(rr => textRequirementIds.Contains(rr.TextRequirementId))
                .ToListAsync();

            if (revueRequirements.Any())
            {
                _context.RevueRequirements.RemoveRange(revueRequirements);
                await _context.SaveChangesAsync();
            }
        }

        // Step 7: Now delete the text (TextRequirements will cascade automatically)
        // Delete file if exists
        if (!string.IsNullOrEmpty(text.FilePath))
        {
            var filePath = Path.Combine(_environment.ContentRootPath, text.FilePath);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }

        _context.Texts.Remove(text);
        await _context.SaveChangesAsync();

        // Commit the transaction
        await transaction.CommitAsync();

        return Ok(new { message = "Text deleted successfully" });
    }
    catch (Exception ex)
    {
        // Rollback the transaction on error
        await transaction.RollbackAsync();
        
        // Log the error (you might want to use a proper logging framework)
        Console.WriteLine($"Error deleting text: {ex.Message}");
        
        return StatusCode(500, new { message = "An error occurred while deleting the text. Please try again." });
    }
}
        [HttpPut("{id}/status")]
public async Task<IActionResult> UpdateTextStatus(int id, [FromBody] UpdateTextStatusRequest request)
{
    var userRole = HttpContext.Session.GetString("UserRole");
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");

    if (!userId.HasValue || !companyId.HasValue || (userRole != "SuperAdmin" && userRole != "SubscriptionManager"))
    {
        return Forbid();
    }

    var text = await _context.Texts
        .FirstOrDefaultAsync(t => t.TextId == id && t.CompanyId == companyId.Value);
        
    if (text == null)
    {
        return NotFound(new { message = "Text not found" });
    }

    if (string.IsNullOrEmpty(request.Status))
    {
        return BadRequest(new { message = "Status is required" });
    }

    text.Status = request.Status;
    await _context.SaveChangesAsync();

    return Ok(new { message = "Text status updated successfully" });
}

            public class CreateTextRequest
            {
                public int DomainId { get; set; }
                public int? ThemeId { get; set; }
                public int? SubThemeId { get; set; }
                public string Reference { get; set; }
                public string Nature { get; set; }
                public int PublicationYear { get; set; }
                public string Status { get; set; }
                public string Penalties { get; set; }
                public string RelatedTexts { get; set; }
                public DateTime? EffectiveDate { get; set; }
                public string Content { get; set; }
                public IFormFile File { get; set; }
                public List<RequirementDto> Requirements { get; set; }
            }

            public class UpdateTextRequest
            {
                public int? DomainId { get; set; }
                public int? ThemeId { get; set; }
                public int? SubThemeId { get; set; }
                public string Reference { get; set; }
                public string Nature { get; set; }
                public int PublicationYear { get; set; }
                public string Status { get; set; }
                public string Penalties { get; set; }
                public string RelatedTexts { get; set; }
                public DateTime? EffectiveDate { get; set; }
                public string Content { get; set; }
                public IFormFile File { get; set; }
            }
            public class UpdateTextStatusRequest
{
    public string Status { get; set; }
}

            public class UpdateRequirementRequest
        {
            public string Number { get; set; }
            public string Title { get; set; }
            public string Status { get; set; }
        }

            public class AddRequirementRequest
            {
                public string Number { get; set; }
                public string Title { get; set; }
                public string Status { get; set; }
            }

            public class RequirementDto
            {
                public string Number { get; set; }
                public string Title { get; set; }
                public string Status { get; set; }
            }
        }
    }