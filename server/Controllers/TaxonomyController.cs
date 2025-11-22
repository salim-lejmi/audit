using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace server.Controllers
{
    [ApiController]
    [Route("api/taxonomy")]
    public class TaxonomyController : ControllerBase
    {
        private readonly AuditDbContext _context;

        public TaxonomyController(AuditDbContext context)
        {
            _context = context;
        }


        [HttpGet("domains")]
        public async Task<IActionResult> GetDomains()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            var domains = await _context.Domains
                .Select(d => new { domainId = d.DomainId, name = d.Name })
                .ToListAsync();

            return Ok(domains);
        }

        [HttpPost("domains")]
        public async Task<IActionResult> CreateDomain([FromBody] CreateDomainRequest request)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            var userId = HttpContext.Session.GetInt32("UserId");

            if (!userId.HasValue || userRole != "SuperAdmin")
            {
                return Forbid();
            }

            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest(new { message = "Domain name is required" });
            }

            var duplicateExists = await _context.Domains
                .AnyAsync(d => d.Name.ToLower() == request.Name.ToLower());
            if (duplicateExists)
            {
                return BadRequest(new { message = "Un domaine avec ce nom existe déjà" });
            }

            var domain = new Domain
            {
                Name = request.Name,
                CreatedById = userId.Value,
                CreatedAt = DateTime.Now
            };

            _context.Domains.Add(domain);
            await _context.SaveChangesAsync();

            return Ok(new { domainId = domain.DomainId, message = "Domain created successfully" });
        }

        [HttpPost("batch-create")]
        public async Task<IActionResult> BatchCreateTaxonomy([FromBody] BatchCreateTaxonomyRequest request)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            var userId = HttpContext.Session.GetInt32("UserId");

            if (!userId.HasValue || userRole != "SuperAdmin")
            {
                return Forbid();
            }

            if (request?.Domain == null || string.IsNullOrEmpty(request.Domain.Name))
            {
                return BadRequest(new { message = "Domain information is required" });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Check for duplicate domain name
                var duplicateExists = await _context.Domains
                    .AnyAsync(d => d.Name.ToLower() == request.Domain.Name.ToLower());
                if (duplicateExists)
                {
                    return BadRequest(new { message = "Un domaine avec ce nom existe déjà" });
                }

                // Create domain
                var domain = new Domain
                {
                    Name = request.Domain.Name,
                    CreatedById = userId.Value,
                    CreatedAt = DateTime.Now
                };

                _context.Domains.Add(domain);
                await _context.SaveChangesAsync();

                var createdThemeIds = new List<int>();

                // Create themes
                if (request.Domain.Themes != null)
                {
                    foreach (var themeRequest in request.Domain.Themes)
                    {
                        if (string.IsNullOrEmpty(themeRequest.Name)) continue;

                        var theme = new Theme
                        {
                            Name = themeRequest.Name,
                            DomainId = domain.DomainId,
                            CreatedById = userId.Value,
                            CreatedAt = DateTime.Now
                        };

                        _context.Themes.Add(theme);
                        await _context.SaveChangesAsync();
                        createdThemeIds.Add(theme.ThemeId);

                        // Create subthemes
                        if (themeRequest.Subthemes != null)
                        {
                            foreach (var subthemeName in themeRequest.Subthemes)
                            {
                                if (string.IsNullOrEmpty(subthemeName)) continue;

                                var subtheme = new SubTheme
                                {
                                    Name = subthemeName,
                                    ThemeId = theme.ThemeId,
                                    CreatedById = userId.Value,
                                    CreatedAt = DateTime.Now
                                };

                                _context.SubThemes.Add(subtheme);
                            }
                        }
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { 
                    domainId = domain.DomainId, 
                    themeIds = createdThemeIds,
                    message = "Taxonomy created successfully" 
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred while creating the taxonomy: " + ex.Message });
            }
        }

        [HttpPut("domains/{id}")]
        public async Task<IActionResult> UpdateDomain(int id, [FromBody] UpdateDomainRequest request)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            var userId = HttpContext.Session.GetInt32("UserId");

            if (!userId.HasValue || userRole != "SuperAdmin")
            {
                return Forbid();
            }

            var domain = await _context.Domains.FindAsync(id);
            if (domain == null)
            {
                return NotFound(new { message = "Domain not found" });
            }

            if (!string.IsNullOrEmpty(request.Name))
            {
                var duplicateExists = await _context.Domains
                    .AnyAsync(d => d.Name.ToLower() == request.Name.ToLower() && d.DomainId != id);
                if (duplicateExists)
                {
                    return BadRequest(new { message = "Un domaine avec ce nom existe déjà" });
                }

                domain.Name = request.Name;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Domain updated successfully" });
        }

        [HttpDelete("domains/{id}")]
        public async Task<IActionResult> DeleteDomain(int id)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            var userId = HttpContext.Session.GetInt32("UserId");

            if (!userId.HasValue || userRole != "SuperAdmin")
            {
                return Forbid();
            }

            var domain = await _context.Domains.FindAsync(id);
            if (domain == null)
            {
                return NotFound(new { message = "Domain not found" });
            }

            var inUseByTexts = await _context.Texts.AnyAsync(t => t.DomainId == id);
            if (inUseByTexts)
            {
                return BadRequest(new { message = "Impossible de supprimer ce domaine car il est utilisé par des textes existants." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Get all themes in this domain
                var themes = await _context.Themes.Where(t => t.DomainId == id).ToListAsync();
                
                // For each theme, delete all its subthemes
                foreach (var theme in themes)
                {
                    // Check if any subtheme is in use by texts
                    var subthemesInUse = await _context.Texts.AnyAsync(t => t.ThemeId == theme.ThemeId);
                    if (subthemesInUse)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { message = $"Impossible de supprimer ce domaine car le thème '{theme.Name}' est utilisé par des textes existants." });
                    }

                    var subthemesInUseBySubThemeId = await _context.Texts.AnyAsync(t => t.SubThemeId.HasValue && _context.SubThemes.Any(s => s.SubThemeId == t.SubThemeId.Value && s.ThemeId == theme.ThemeId));
                    if (subthemesInUseBySubThemeId)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { message = $"Impossible de supprimer ce domaine car des sous-thèmes du thème '{theme.Name}' sont utilisés par des textes existants." });
                    }

                    // Delete all subthemes of this theme
                    var subThemes = await _context.SubThemes.Where(s => s.ThemeId == theme.ThemeId).ToListAsync();
                    _context.SubThemes.RemoveRange(subThemes);
                }

                // Delete all themes in this domain
                _context.Themes.RemoveRange(themes);

                // Delete the domain
                _context.Domains.Remove(domain);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Domain and all associated themes and subthemes deleted successfully" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred while deleting the domain: " + ex.Message });
            }
        }


        [HttpGet("themes")]
        public async Task<IActionResult> GetThemes([FromQuery] int? domainId = null)
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            IQueryable<Theme> query = _context.Themes;
            if (domainId.HasValue)
            {
                query = query.Where(t => t.DomainId == domainId.Value);
            }

            var themes = await query
                .Select(t => new { themeId = t.ThemeId, domainId = t.DomainId, name = t.Name })
                .ToListAsync();

            return Ok(themes);
        }

        [HttpPost("themes")]
        public async Task<IActionResult> CreateTheme([FromBody] CreateThemeRequest request)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            var userId = HttpContext.Session.GetInt32("UserId");

            if (!userId.HasValue || userRole != "SuperAdmin")
            {
                return Forbid();
            }

            if (string.IsNullOrEmpty(request.Name) || request.DomainId <= 0)
            {
                return BadRequest(new { message = "Theme name and domain ID are required" });
            }

            // Check if domain exists
            var domainExists = await _context.Domains.AnyAsync(d => d.DomainId == request.DomainId);
            if (!domainExists)
            {
                return BadRequest(new { message = "Selected domain does not exist" });
            }

            // Check for duplicate theme name within the same domain
            var duplicateExists = await _context.Themes
                .AnyAsync(t => t.Name.ToLower() == request.Name.ToLower() && t.DomainId == request.DomainId);
            if (duplicateExists)
            {
                return BadRequest(new { message = "Un thème avec ce nom existe déjà dans ce domaine" });
            }

            var theme = new Theme
            {
                Name = request.Name,
                DomainId = request.DomainId,
                CreatedById = userId.Value,
                CreatedAt = DateTime.Now
            };

            _context.Themes.Add(theme);
            await _context.SaveChangesAsync();

            return Ok(new { themeId = theme.ThemeId, message = "Theme created successfully" });
        }

        [HttpPut("themes/{id}")]
        public async Task<IActionResult> UpdateTheme(int id, [FromBody] UpdateThemeRequest request)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            var userId = HttpContext.Session.GetInt32("UserId");

            if (!userId.HasValue || userRole != "SuperAdmin")
            {
                return Forbid();
            }

            var theme = await _context.Themes.FindAsync(id);
            if (theme == null)
            {
                return NotFound(new { message = "Theme not found" });
            }

            if (!string.IsNullOrEmpty(request.Name))
            {
                // Check for duplicate theme name within the same domain (excluding current theme)
                var domainIdToCheck = request.DomainId > 0 ? request.DomainId : theme.DomainId;
                var duplicateExists = await _context.Themes
                    .AnyAsync(t => t.Name.ToLower() == request.Name.ToLower() && 
                                  t.DomainId == domainIdToCheck && 
                                  t.ThemeId != id);
                if (duplicateExists)
                {
                    return BadRequest(new { message = "Un thème avec ce nom existe déjà dans ce domaine" });
                }

                theme.Name = request.Name;
            }

            if (request.DomainId > 0)
            {
                // Check if domain exists
                var domainExists = await _context.Domains.AnyAsync(d => d.DomainId == request.DomainId);
                if (!domainExists)
                {
                    return BadRequest(new { message = "Selected domain does not exist" });
                }

                // If domain is changing, check for duplicates in the new domain
                if (request.DomainId != theme.DomainId)
                {
                    var duplicateExists = await _context.Themes
                        .AnyAsync(t => t.Name.ToLower() == theme.Name.ToLower() && 
                                      t.DomainId == request.DomainId);
                    if (duplicateExists)
                    {
                        return BadRequest(new { message = "Un thème avec ce nom existe déjà dans le domaine de destination" });
                    }
                }

                theme.DomainId = request.DomainId;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Theme updated successfully" });
        }

        [HttpDelete("themes/{id}")]
        public async Task<IActionResult> DeleteTheme(int id)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            var userId = HttpContext.Session.GetInt32("UserId");

            if (!userId.HasValue || userRole != "SuperAdmin")
            {
                return Forbid();
            }

            var theme = await _context.Themes.FindAsync(id);
            if (theme == null)
            {
                return NotFound(new { message = "Theme not found" });
            }

            // Check if theme is in use by texts
            var inUseByTheme = await _context.Texts.AnyAsync(t => t.ThemeId == id);
            if (inUseByTheme)
            {
                return BadRequest(new { message = "Impossible de supprimer ce thème car il est utilisé par des textes existants." });
            }

            // Check if any subtheme is in use by texts
            var subthemesInUse = await _context.Texts.AnyAsync(t => t.SubThemeId.HasValue && 
                _context.SubThemes.Any(s => s.SubThemeId == t.SubThemeId.Value && s.ThemeId == id));
            if (subthemesInUse)
            {
                return BadRequest(new { message = "Impossible de supprimer ce thème car ses sous-thèmes sont utilisés par des textes existants." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Delete all subthemes of this theme
                var subThemes = await _context.SubThemes.Where(s => s.ThemeId == id).ToListAsync();
                _context.SubThemes.RemoveRange(subThemes);

                // Delete the theme
                _context.Themes.Remove(theme);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Theme and all associated subthemes deleted successfully" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred while deleting the theme: " + ex.Message });
            }
        }

        // SUBTHEMES

        [HttpGet("subthemes")]
        public async Task<IActionResult> GetSubThemes([FromQuery] int? themeId = null)
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            IQueryable<SubTheme> query = _context.SubThemes;
            if (themeId.HasValue)
            {
                query = query.Where(s => s.ThemeId == themeId.Value);
            }

            var subThemes = await query
                .Select(s => new { subThemeId = s.SubThemeId, themeId = s.ThemeId, name = s.Name })
                .ToListAsync();

            return Ok(subThemes);
        }

        [HttpPost("subthemes")]
        public async Task<IActionResult> CreateSubTheme([FromBody] CreateSubThemeRequest request)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            var userId = HttpContext.Session.GetInt32("UserId");

            if (!userId.HasValue || userRole != "SuperAdmin")
            {
                return Forbid();
            }

            if (string.IsNullOrEmpty(request.Name) || request.ThemeId <= 0)
            {
                return BadRequest(new { message = "SubTheme name and theme ID are required" });
            }

            // Check if theme exists
            var themeExists = await _context.Themes.AnyAsync(t => t.ThemeId == request.ThemeId);
            if (!themeExists)
            {
                return BadRequest(new { message = "Selected theme does not exist" });
            }

            // Check for duplicate subtheme name within the same theme
            var duplicateExists = await _context.SubThemes
                .AnyAsync(s => s.Name.ToLower() == request.Name.ToLower() && s.ThemeId == request.ThemeId);
            if (duplicateExists)
            {
                return BadRequest(new { message = "Un sous-thème avec ce nom existe déjà dans ce thème" });
            }

            var subTheme = new SubTheme
            {
                Name = request.Name,
                ThemeId = request.ThemeId,
                CreatedById = userId.Value,
                CreatedAt = DateTime.Now
            };

            _context.SubThemes.Add(subTheme);
            await _context.SaveChangesAsync();

            return Ok(new { subThemeId = subTheme.SubThemeId, message = "SubTheme created successfully" });
        }

        [HttpPut("subthemes/{id}")]
        public async Task<IActionResult> UpdateSubTheme(int id, [FromBody] UpdateSubThemeRequest request)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            var userId = HttpContext.Session.GetInt32("UserId");

            if (!userId.HasValue || userRole != "SuperAdmin")
            {
                return Forbid();
            }

            var subTheme = await _context.SubThemes.FindAsync(id);
            if (subTheme == null)
            {
                return NotFound(new { message = "SubTheme not found" });
            }

            if (!string.IsNullOrEmpty(request.Name))
            {
                // Check for duplicate subtheme name within the same theme (excluding current subtheme)
                var themeIdToCheck = request.ThemeId > 0 ? request.ThemeId : subTheme.ThemeId;
                var duplicateExists = await _context.SubThemes
                    .AnyAsync(s => s.Name.ToLower() == request.Name.ToLower() && 
                                  s.ThemeId == themeIdToCheck && 
                                  s.SubThemeId != id);
                if (duplicateExists)
                {
                    return BadRequest(new { message = "Un sous-thème avec ce nom existe déjà dans ce thème" });
                }

                subTheme.Name = request.Name;
            }

            if (request.ThemeId > 0)
            {
                // Check if theme exists
                var themeExists = await _context.Themes.AnyAsync(t => t.ThemeId == request.ThemeId);
                if (!themeExists)
                {
                    return BadRequest(new { message = "Selected theme does not exist" });
                }

                // If theme is changing, check for duplicates in the new theme
                if (request.ThemeId != subTheme.ThemeId)
                {
                    var duplicateExists = await _context.SubThemes
                        .AnyAsync(s => s.Name.ToLower() == subTheme.Name.ToLower() && 
                                      s.ThemeId == request.ThemeId);
                    if (duplicateExists)
                    {
                        return BadRequest(new { message = "Un sous-thème avec ce nom existe déjà dans le thème de destination" });
                    }
                }

                subTheme.ThemeId = request.ThemeId;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "SubTheme updated successfully" });
        }

        [HttpDelete("subthemes/{id}")]
        public async Task<IActionResult> DeleteSubTheme(int id)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            var userId = HttpContext.Session.GetInt32("UserId");

            if (!userId.HasValue || userRole != "SuperAdmin")
            {
                return Forbid();
            }

            var subTheme = await _context.SubThemes.FindAsync(id);
            if (subTheme == null)
            {
                return NotFound(new { message = "SubTheme not found" });
            }

            // Check if subtheme is in use by texts
            var inUse = await _context.Texts.AnyAsync(t => t.SubThemeId == id);
            if (inUse)
            {
                return BadRequest(new { message = "Impossible de supprimer ce sous-thème car il est utilisé par des textes existants." });
            }

            _context.SubThemes.Remove(subTheme);
            await _context.SaveChangesAsync();
            return Ok(new { message = "SubTheme deleted successfully" });
        }

        // REQUEST MODELS
        public class CreateDomainRequest
        {
            public string Name { get; set; }
        }

        public class UpdateDomainRequest
        {
            public string Name { get; set; }
        }

        public class CreateThemeRequest
        {
            public string Name { get; set; }
            public int DomainId { get; set; }
        }

        public class UpdateThemeRequest
        {
            public string Name { get; set; }
            public int DomainId { get; set; }
        }

        public class CreateSubThemeRequest
        {
            public string Name { get; set; }
            public int ThemeId { get; set; }
        }

        public class UpdateSubThemeRequest
        {
            public string Name { get; set; }
            public int ThemeId { get; set; }
        }

        public class BatchCreateTaxonomyRequest
        {
            public DomainWithThemes Domain { get; set; }
        }

        public class DomainWithThemes
        {
            public string Name { get; set; }
            public List<ThemeWithSubthemes> Themes { get; set; } = new List<ThemeWithSubthemes>();
        }

        public class ThemeWithSubthemes
        {
            public string Name { get; set; }
            public List<string> Subthemes { get; set; } = new List<string>();
        }
    }
}