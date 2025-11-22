using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.Controllers
{
    [ApiController]
    [Route("api/compliance")]
    public class ComplianceEvaluationController : ControllerBase
    {
        private readonly AuditDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public ComplianceEvaluationController(AuditDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet("texts")]
        public async Task<IActionResult> GetTextsForEvaluation(
            [FromQuery] int? domainId = null,
            [FromQuery] int? themeId = null,
            [FromQuery] int? subThemeId = null,
            [FromQuery] string nature = null,
            [FromQuery] int? publicationYear = null,
            [FromQuery] string keyword = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                IQueryable<Text> query = _context.Texts
                    .Include(t => t.DomainObject)
                    .Include(t => t.ThemeObject)
                    .Include(t => t.SubThemeObject)
                    .Include(t => t.Requirements)
                    .Where(t => t.CompanyId == companyId.Value);

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
                    query = query.Where(t => t.Reference.Contains(keyword) || t.Content.Contains(keyword));

                var totalCount = await query.CountAsync();

                var textIds = await query
                    .OrderByDescending(t => t.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(t => t.TextId)
                    .ToListAsync();

                var textsWithDetails = await query
                    .Where(t => textIds.Contains(t.TextId))
                    .OrderByDescending(t => t.CreatedAt)
                    .Select(t => new
                    {
                        textId = t.TextId,
                        domain = t.DomainObject != null ? t.DomainObject.Name : "",
                        theme = t.ThemeObject != null ? t.ThemeObject.Name : "",
                        subTheme = t.SubThemeObject != null ? t.SubThemeObject.Name : "",
                        reference = t.Reference,
                        penaltyOrIncentive = t.Penalties
                    })
                    .ToListAsync();

                var requirementCounts = await _context.TextRequirements
                    .Where(tr => textIds.Contains(tr.TextId))
                    .GroupBy(tr => tr.TextId)
                    .Select(g => new
                    {
                        TextId = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

var requirementStatuses = await _context.TextRequirements
    .Where(tr => textIds.Contains(tr.TextId))
    .GroupJoin(
        _context.ComplianceEvaluations,
        tr => tr.RequirementId,
        ce => ce.RequirementId,
        (tr, ceGroup) => new
        {
            TextId = tr.TextId,
            // Get the LATEST evaluation status, or fall back to requirement status
            Status = ceGroup.Any() 
                ? ceGroup.OrderByDescending(ce => ce.EvaluatedAt).First().Status 
                : tr.Status
        }
    )
    .GroupBy(x => new { x.TextId, x.Status })
    .Select(g => new
    {
        TextId = g.Key.TextId,
        Status = g.Key.Status,
        Count = g.Count()
    })
    .ToListAsync();
                var result = textsWithDetails.Select(t => 
                {
                    var reqCount = requirementCounts
                        .FirstOrDefault(rc => rc.TextId == t.textId)?.Count ?? 0;
                    
                    var statusCounts = requirementStatuses
                        .Where(rs => rs.TextId == t.textId)
                        .Select(rs => new { status = rs.Status, count = rs.Count })
                        .ToList();
                    
                    var applicableCount = requirementStatuses
                        .Where(rs => rs.TextId == t.textId && rs.Status == "applicable")
                        .Sum(rs => rs.Count);
                    
                    int applicablePercentage = reqCount > 0 
                        ? (int)Math.Round((double)applicableCount / reqCount * 100) 
                        : 0;

                    return new
                    {
                        t.textId,
                        t.domain,
                        t.theme,
                        t.subTheme,
                        t.reference,
                        t.penaltyOrIncentive,
                        requirementsStatuses = statusCounts,
                        applicablePercentage
                    };
                }).ToList();

                return Ok(new
                {
                    texts = result,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                    currentPage = page
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTextsForEvaluation: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, ex.ToString());
            }
        }


        // Remove the CalculateApplicablePercentage method as we've moved its logic inline

        // Rest of your controller methods remain unchanged
[HttpGet("text/{textId}")]
public async Task<IActionResult> GetTextWithRequirements(int textId)
{
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");
    
    if (!userId.HasValue || !companyId.HasValue)
    {
        return Unauthorized(new { message = "Not authenticated" });
    }

    var text = await _context.Texts
        .Include(t => t.DomainObject)
        .Include(t => t.ThemeObject)
        .Include(t => t.SubThemeObject)
        .Include(t => t.Requirements)
        .FirstOrDefaultAsync(t => t.TextId == textId && t.CompanyId == companyId.Value);

    if (text == null)
    {
        return NotFound(new { message = "Text not found" });
    }

    var requirements = await _context.TextRequirements
        .Where(tr => tr.TextId == textId)
        .Select(tr => new
        {
            requirementId = tr.RequirementId,
            number = tr.Number,
            title = tr.Title,
            status = tr.Status, // Include initial requirement status
            evaluation = _context.ComplianceEvaluations
                .Where(ce => ce.RequirementId == tr.RequirementId)
                .OrderByDescending(ce => ce.EvaluatedAt)
                .Select(ce => new
                {
                    evaluationId = ce.EvaluationId,
                    status = ce.Status,
                    evaluatedAt = ce.EvaluatedAt,
                    evaluatedBy = ce.EvaluatedBy.Name,
                    observations = ce.Observations.Select(o => new
                    {
                        observationId = o.ObservationId,
                        content = o.Content,
                        createdAt = o.CreatedAt,
                        createdBy = o.CreatedBy.Name
                    }).ToList(),
                    monitoringParameters = ce.MonitoringParameters.Select(mp => new
                    {
                        parameterId = mp.ParameterId,
                        name = mp.ParameterName,
                        value = mp.ParameterValue,
                        createdAt = mp.CreatedAt
                    }).ToList(),
                    attachments = ce.Attachments.Select(a => new
                    {
                        attachmentId = a.AttachmentId,
                        fileName = a.FileName,
                        uploadedAt = a.UploadedAt
                    }).ToList()
                })
                .FirstOrDefault()
        })
        .ToListAsync();

    var result = new
    {
        text = new
        {
            textId = text.TextId,
            domain = text.DomainObject?.Name,
            theme = text.ThemeObject?.Name,
            subTheme = text.SubThemeObject?.Name,
            reference = text.Reference,
            nature = text.Nature,
            publicationYear = text.PublicationYear,
            penalties = text.Penalties,
            content = text.Content
        },
        requirements = requirements
    };

    return Ok(result);
}
[HttpPost("evaluate")]
public async Task<IActionResult> EvaluateRequirement([FromBody] EvaluateRequirementRequest request)
{
    // Check authentication
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");
    
    if (!userId.HasValue || !companyId.HasValue)
    {
        return Unauthorized(new { message = "Not authenticated" });
    }

    // Validate request
    if (request.RequirementId <= 0 || string.IsNullOrEmpty(request.Status))
    {
        return BadRequest(new { message = "Requirement ID and status are required" });
    }

    // Validate status
    var validStatuses = new[] { "applicable", "non-applicable", "à vérifier", "pour information" };
    if (!validStatuses.Contains(request.Status.ToLower()))
    {
        return BadRequest(new { message = "Invalid status. Must be one of: applicable, non-applicable, à vérifier, pour information" });
    }

    // Get requirement to ensure it exists and to get the textId
    var requirement = await _context.TextRequirements.FindAsync(request.RequirementId);
    if (requirement == null)
    {
        return NotFound(new { message = "Requirement not found" });
    }
    
    // Verify the requirement belongs to a text in the user's company
    var text = await _context.Texts
        .FirstOrDefaultAsync(t => t.TextId == requirement.TextId && t.CompanyId == companyId.Value);
        
    if (text == null)
    {
        return NotFound(new { message = "Text not found or you don't have access to it" });
    }

    // Check if an evaluation already exists for this requirement
    var existingEvaluation = await _context.ComplianceEvaluations
        .FirstOrDefaultAsync(ce => ce.RequirementId == request.RequirementId);

    ComplianceEvaluation evaluation;

    if (existingEvaluation != null)
    {
        // Verify the evaluation belongs to the user's company
        var evaluationText = await _context.Texts
            .FirstOrDefaultAsync(t => t.TextId == existingEvaluation.TextId && t.CompanyId == companyId.Value);
            
        if (evaluationText == null)
        {
            return NotFound(new { message = "Evaluation not found or you don't have access to it" });
        }
        
        // If evaluation exists, create a history record before updating
        var history = new EvaluationHistory
        {
            EvaluationId = existingEvaluation.EvaluationId,
            PreviousStatus = existingEvaluation.Status,
            NewStatus = request.Status,
            ChangedAt = DateTime.Now,
            ChangedById = userId.Value
        };
        _context.EvaluationHistory.Add(history);

        // Update existing evaluation
        existingEvaluation.Status = request.Status;
        existingEvaluation.EvaluatedAt = DateTime.Now;
        existingEvaluation.UserId = userId.Value;

        evaluation = existingEvaluation;
    }
    else
    {
        // Create new evaluation
        evaluation = new ComplianceEvaluation
        {
            TextId = requirement.TextId,
            RequirementId = request.RequirementId,
            Status = request.Status,
            EvaluatedAt = DateTime.Now,
            UserId = userId.Value,
            IsSavedToHistory = false
        };
        _context.ComplianceEvaluations.Add(evaluation);
    }

    await _context.SaveChangesAsync();

    return Ok(new { evaluationId = evaluation.EvaluationId, message = "Requirement evaluated successfully" });
}

        [HttpPost("observation")]
        public async Task<IActionResult> AddObservation([FromBody] AddObservationRequest request)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Validate request
            if (request.EvaluationId <= 0 || string.IsNullOrEmpty(request.Content))
            {
                return BadRequest(new { message = "Evaluation ID and content are required" });
            }

            // Verify evaluation exists
            var evaluation = await _context.ComplianceEvaluations.FindAsync(request.EvaluationId);
            if (evaluation == null)
            {
                return NotFound(new { message = "Evaluation not found" });
            }

            // Create observation
            var observation = new Observation
            {
                EvaluationId = request.EvaluationId,
                Content = request.Content,
                CreatedAt = DateTime.Now,
                CreatedById = userId.Value
            };

            _context.Observations.Add(observation);
            await _context.SaveChangesAsync();

            return Ok(new { observationId = observation.ObservationId, message = "Observation added successfully" });
        }

        [HttpDelete("observation/{observationId}")]
        public async Task<IActionResult> DeleteObservation(int observationId)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Find observation
            var observation = await _context.Observations.FindAsync(observationId);
            if (observation == null)
            {
                return NotFound(new { message = "Observation not found" });
            }

            // Verify user is the creator
            if (observation.CreatedById != userId.Value)
            {
                return StatusCode(403, new { message = "You can only delete your own observations" });
            }

            _context.Observations.Remove(observation);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Observation deleted successfully" });
        }

        [HttpPost("monitoring-parameter")]
        public async Task<IActionResult> AddMonitoringParameter([FromBody] AddMonitoringParameterRequest request)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Validate request
            if (request.EvaluationId <= 0 || string.IsNullOrEmpty(request.ParameterName))
            {
                return BadRequest(new { message = "Evaluation ID and parameter name are required" });
            }

            // Verify evaluation exists
            var evaluation = await _context.ComplianceEvaluations.FindAsync(request.EvaluationId);
            if (evaluation == null)
            {
                return NotFound(new { message = "Evaluation not found" });
            }

            // Create monitoring parameter
            var parameter = new MonitoringParameter
            {
                EvaluationId = request.EvaluationId,
                ParameterName = request.ParameterName,
                ParameterValue = request.ParameterValue ?? "",
                CreatedAt = DateTime.Now
            };

            _context.MonitoringParameters.Add(parameter);
            await _context.SaveChangesAsync();

            return Ok(new { parameterId = parameter.ParameterId, message = "Monitoring parameter added successfully" });
        }

        [HttpDelete("monitoring-parameter/{parameterId}")]
        public async Task<IActionResult> DeleteMonitoringParameter(int parameterId)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Find parameter
            var parameter = await _context.MonitoringParameters.FindAsync(parameterId);
            if (parameter == null)
            {
                return NotFound(new { message = "Monitoring parameter not found" });
            }

            _context.MonitoringParameters.Remove(parameter);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Monitoring parameter deleted successfully" });
        }

        [HttpPost("attachment")]
        public async Task<IActionResult> AddAttachment([FromForm] AddAttachmentRequest request)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Validate request
            if (request.EvaluationId <= 0 || request.File == null || request.File.Length == 0)
            {
                return BadRequest(new { message = "Evaluation ID and file are required" });
            }

            // Verify evaluation exists
            var evaluation = await _context.ComplianceEvaluations.FindAsync(request.EvaluationId);
            if (evaluation == null)
            {
                return NotFound(new { message = "Evaluation not found" });
            }

            // Create directory if it doesn't exist
            var uploadDir = Path.Combine(_environment.ContentRootPath, "Uploads", "Attachments");
            if (!Directory.Exists(uploadDir))
            {
                Directory.CreateDirectory(uploadDir);
            }

            // Save file
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(request.File.FileName);
            var filePath = Path.Combine("Uploads", "Attachments", fileName);
            var fullPath = Path.Combine(_environment.ContentRootPath, filePath);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream);
            }
    
            // Create attachment record
            var attachment = new EvaluationAttachment
            {
                EvaluationId = request.EvaluationId,
                FileName = request.File.FileName,
                FilePath = filePath,
                UploadedAt = DateTime.Now
            };

            _context.EvaluationAttachments.Add(attachment);
            await _context.SaveChangesAsync();

            return Ok(new { attachmentId = attachment.AttachmentId, message = "Attachment added successfully" });
        }

        [HttpGet("attachment/{attachmentId}")]
        public async Task<IActionResult> GetAttachment(int attachmentId)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Find attachment
            var attachment = await _context.EvaluationAttachments.FindAsync(attachmentId);
            if (attachment == null)
            {
                return NotFound(new { message = "Attachment not found" });
            }

            // Verify file exists
            var filePath = Path.Combine(_environment.ContentRootPath, attachment.FilePath);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Attachment file not found" });
            }

            // Return file
            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, "application/octet-stream", attachment.FileName);
        }

        [HttpDelete("attachment/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Find attachment
            var attachment = await _context.EvaluationAttachments.FindAsync(attachmentId);
            if (attachment == null)
            {
                return NotFound(new { message = "Attachment not found" });
            }

            // Delete file if it exists
            var filePath = Path.Combine(_environment.ContentRootPath, attachment.FilePath);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            // Remove record
            _context.EvaluationAttachments.Remove(attachment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Attachment deleted successfully" });
        }

        [HttpPost("save-to-history")]
        public async Task<IActionResult> SaveToHistory([FromBody] SaveToHistoryRequest request)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Validate request
            if (request.TextId <= 0)
            {
                return BadRequest(new { message = "Text ID is required" });
            }

            // Get all evaluations for the text
            var evaluations = await _context.ComplianceEvaluations
                .Where(ce => ce.TextId == request.TextId)
                .ToListAsync();

            if (evaluations.Count == 0)
            {
                return NotFound(new { message = "No evaluations found for this text" });
            }

            // Mark all evaluations as saved to history
            foreach (var evaluation in evaluations)
            {
                evaluation.IsSavedToHistory = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Evaluations saved to history successfully" });
        }

        [HttpGet("export/{textId}")]
        public async Task<IActionResult> ExportEvaluation(int textId)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Get text with requirements and evaluations
            var text = await _context.Texts
                .Include(t => t.DomainObject)
                .Include(t => t.ThemeObject)
                .Include(t => t.SubThemeObject)
                .FirstOrDefaultAsync(t => t.TextId == textId);

            if (text == null)
            {
                return NotFound(new { message = "Text not found" });
            }

            var requirements = await _context.TextRequirements
                .Where(tr => tr.TextId == textId)
                .ToListAsync();

            var evaluations = await _context.ComplianceEvaluations
                .Include(ce => ce.EvaluatedBy)
                .Include(ce => ce.Observations)
                .ThenInclude(o => o.CreatedBy)
                .Include(ce => ce.MonitoringParameters)
                .Where(ce => ce.TextId == textId)
                .ToListAsync();

            // Prepare data for export
            var exportData = new
            {
                text = new
                {
                    reference = text.Reference,
                    domain = text.DomainObject?.Name,
                    theme = text.ThemeObject?.Name,
                    subTheme = text.SubThemeObject?.Name,
                    nature = text.Nature,
                    publicationYear = text.PublicationYear,
                    penalties = text.Penalties,
                    exportDate = DateTime.Now
                },
                requirements = requirements.Select(r =>
                {
                    var evaluation = evaluations.FirstOrDefault(e => e.RequirementId == r.RequirementId);
                    return new
                    {
                        number = r.Number,
                        title = r.Title,
                        status = evaluation?.Status ?? "à vérifier",
                        evaluatedBy = evaluation?.EvaluatedBy?.Name,
                        evaluatedAt = evaluation?.EvaluatedAt,
                        observations = evaluation?.Observations.Select(o => new
                        {
                            content = o.Content,
                            createdBy = o.CreatedBy.Name,
                            createdAt = o.CreatedAt
                        }).ToList(),
                        monitoringParameters = evaluation?.MonitoringParameters.Select(mp => new
                        {
                            name = mp.ParameterName,
                            value = mp.ParameterValue,
                            createdAt = mp.CreatedAt
                        }).ToList()
                    };
                }).ToList()
            };

            return Ok(exportData);
        }

        public class EvaluateRequirementRequest
        {
            public int RequirementId { get; set; }
            public string Status { get; set; }
        }

        public class AddObservationRequest
        {
            public int EvaluationId { get; set; }
            public string Content { get; set; }
        }

        public class AddMonitoringParameterRequest
        {
            public int EvaluationId { get; set; }
            public string ParameterName { get; set; }
            public string ParameterValue { get; set; }
        }

        public class AddAttachmentRequest
        {
            public int EvaluationId { get; set; }
            public IFormFile File { get; set; }
        }

        public class SaveToHistoryRequest
        {
            public int TextId { get; set; }
        }
    }
}