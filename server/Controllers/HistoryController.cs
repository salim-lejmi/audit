using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using System.Linq;

namespace server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoryController : ControllerBase
    {
        private readonly AuditDbContext _context;

        public HistoryController(AuditDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetHistory(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string search = "",
            [FromQuery] string source = "all",
            [FromQuery] string user = "all",
            [FromQuery] string dateFrom = "",
            [FromQuery] string dateTo = "")
        {
            try
            {
                // Get user ID from session
                var userId = HttpContext.Session.GetInt32("UserId");
                if (!userId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                var currentUser = await _context.Users
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.UserId == userId.Value);

                if (currentUser == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                var historyItems = new List<HistoryItemDto>();

                // Parse date filters
                DateTime? fromDate = null;
                DateTime? toDate = null;
                
                if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var parsedFromDate))
                    fromDate = parsedFromDate;
                
                if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var parsedToDate))
                    toDate = parsedToDate.AddDays(1);

                // Super Admin sees all data
                if (currentUser.Role == "SuperAdmin")
                {
                    // Get compliance evaluations
                    if (source == "all" || source == "compliance")
                    {
                        var evaluations = await _context.ComplianceEvaluations
                            .Include(e => e.EvaluatedBy)
                            .Include(e => e.Text)
                            .Include(e => e.Requirement)
                            .Where(e => e.IsSavedToHistory)
                            .ToListAsync();

                        foreach (var eval in evaluations)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = eval.EvaluationId,
                                User = eval.EvaluatedBy?.Name ?? "Utilisateur inconnu",
                                Document = $"Évaluation: {eval.Text?.Reference} - {eval.Requirement?.Title}",
                                Source = "compliance",
                                CreatedAt = eval.EvaluatedAt,
                                ModifiedAt = eval.EvaluatedAt,
                                Type = "compliance"
                            });
                        }
                    }

                    // Get actions
                    if (source == "all" || source == "action")
                    {
                        var actions = await _context.Actions
                            .Include(a => a.CreatedBy)
                            .ToListAsync();

                        foreach (var action in actions)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = action.ActionId,
                                User = action.CreatedBy?.Name ?? "Utilisateur inconnu",
                                Document = $"Action: {action.Description}",
                                Source = "action",
                                CreatedAt = action.CreatedAt,
                                ModifiedAt = action.UpdatedAt ?? action.CreatedAt,
                                Type = "action"
                            });
                        }
                    }

                    // Get revues
                    if (source == "all" || source == "revue")
                    {
                        var revues = await _context.RevueDeDirections
                            .Include(r => r.CreatedBy)
                            .Include(r => r.Domain)
                            .ToListAsync();

                        foreach (var revue in revues)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = revue.RevueId,
                                User = revue.CreatedBy?.Name ?? "Utilisateur inconnu",
                                Document = $"Revue de direction - {revue.Domain?.Name}",
                                Source = "revue",
                                CreatedAt = revue.CreatedAt,
                                ModifiedAt = revue.CreatedAt,
                                Type = "revue",
                                PdfPath = revue.PdfFilePath
                            });
                        }
                    }

                    // Get texts
                    if (source == "all" || source == "text")
                    {
                        var texts = await _context.Texts
                            .Include(t => t.CreatedBy)
                            .ToListAsync();

                        foreach (var text in texts)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = text.TextId,
                                User = text.CreatedBy?.Name ?? "Système",
                                Document = $"Texte: {text.Reference}",
                                Source = "text",
                                CreatedAt = text.CreatedAt,
                                ModifiedAt = text.CreatedAt,
                                Type = "text",
                                PdfPath = text.FilePath
                            });
                        }
                    }
                }
                else if (currentUser.Role == "SubscriptionManager")
                {
                    // Subscription Manager sees all company data
                    var companyId = currentUser.CompanyId;
                    if (!companyId.HasValue)
                    {
                        return BadRequest(new { message = "User not associated with a company" });
                    }

                    // Get compliance evaluations for the company
                    if (source == "all" || source == "compliance")
                    {
                        var evaluations = await _context.ComplianceEvaluations
                            .Include(e => e.EvaluatedBy)
                            .Include(e => e.Text)
                            .Include(e => e.Requirement)
                            .Where(e => e.IsSavedToHistory && e.EvaluatedBy.CompanyId == companyId)
                            .ToListAsync();

                        foreach (var eval in evaluations)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = eval.EvaluationId,
                                User = eval.EvaluatedBy?.Name ?? "Utilisateur inconnu",
                                Document = $"Évaluation: {eval.Text?.Reference} - {eval.Requirement?.Title}",
                                Source = "compliance",
                                CreatedAt = eval.EvaluatedAt,
                                ModifiedAt = eval.EvaluatedAt,
                                Type = "compliance"
                            });
                        }
                    }

                    // Get actions for the company
                    if (source == "all" || source == "action")
                    {
                        var actions = await _context.Actions
                            .Include(a => a.CreatedBy)
                            .Where(a => a.CompanyId == companyId)
                            .ToListAsync();

                        foreach (var action in actions)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = action.ActionId,
                                User = action.CreatedBy?.Name ?? "Utilisateur inconnu",
                                Document = $"Action: {action.Description}",
                                Source = "action",
                                CreatedAt = action.CreatedAt,
                                ModifiedAt = action.UpdatedAt ?? action.CreatedAt,
                                Type = "action"
                            });
                        }
                    }

                    // Get revues for the company
                    if (source == "all" || source == "revue")
                    {
                        var revues = await _context.RevueDeDirections
                            .Include(r => r.CreatedBy)
                            .Include(r => r.Domain)
                            .Where(r => r.CompanyId == companyId)
                            .ToListAsync();

                        foreach (var revue in revues)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = revue.RevueId,
                                User = revue.CreatedBy?.Name ?? "Utilisateur inconnu",
                                Document = $"Revue de direction - {revue.Domain?.Name}",
                                Source = "revue",
                                CreatedAt = revue.CreatedAt,
                                ModifiedAt = revue.CreatedAt,
                                Type = "revue",
                                PdfPath = revue.PdfFilePath
                            });
                        }
                    }

                    // Get texts for the company
                    if (source == "all" || source == "text")
                    {
                        var texts = await _context.Texts
                            .Include(t => t.CreatedBy)
                            .Where(t => t.CompanyId == companyId)
                            .ToListAsync();

                        foreach (var text in texts)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = text.TextId,
                                User = text.CreatedBy?.Name ?? "Système",
                                Document = $"Texte: {text.Reference}",
                                Source = "text",
                                CreatedAt = text.CreatedAt,
                                ModifiedAt = text.CreatedAt,
                                Type = "text",
                                PdfPath = text.FilePath
                            });
                        }
                    }
                }
                else
                {
                    // Auditors/Users see only THEIR OWN data
                    var companyId = currentUser.CompanyId;
                    if (!companyId.HasValue)
                    {
                        return BadRequest(new { message = "User not associated with a company" });
                    }

                    // Get compliance evaluations created BY THIS USER only
                    if (source == "all" || source == "compliance")
                    {
                        var evaluations = await _context.ComplianceEvaluations
                            .Include(e => e.EvaluatedBy)
                            .Include(e => e.Text)
                            .Include(e => e.Requirement)
                            .Where(e => e.IsSavedToHistory && e.UserId == userId.Value)
                            .ToListAsync();

                        foreach (var eval in evaluations)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = eval.EvaluationId,
                                User = eval.EvaluatedBy?.Name ?? "Utilisateur inconnu",
                                Document = $"Évaluation: {eval.Text?.Reference} - {eval.Requirement?.Title}",
                                Source = "compliance",
                                CreatedAt = eval.EvaluatedAt,
                                ModifiedAt = eval.EvaluatedAt,
                                Type = "compliance"
                            });
                        }
                    }

                    // Get actions created BY THIS USER only
                    if (source == "all" || source == "action")
                    {
                        var actions = await _context.Actions
                            .Include(a => a.CreatedBy)
                            .Where(a => a.CreatedById == userId.Value)
                            .ToListAsync();

                        foreach (var action in actions)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = action.ActionId,
                                User = action.CreatedBy?.Name ?? "Utilisateur inconnu",
                                Document = $"Action: {action.Description}",
                                Source = "action",
                                CreatedAt = action.CreatedAt,
                                ModifiedAt = action.UpdatedAt ?? action.CreatedAt,
                                Type = "action"
                            });
                        }
                    }

                    // Get revues created BY THIS USER only
                    if (source == "all" || source == "revue")
                    {
                        var revues = await _context.RevueDeDirections
                            .Include(r => r.CreatedBy)
                            .Include(r => r.Domain)
                            .Where(r => r.CreatedById == userId.Value)
                            .ToListAsync();

                        foreach (var revue in revues)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = revue.RevueId,
                                User = revue.CreatedBy?.Name ?? "Utilisateur inconnu",
                                Document = $"Revue de direction - {revue.Domain?.Name}",
                                Source = "revue",
                                CreatedAt = revue.CreatedAt,
                                ModifiedAt = revue.CreatedAt,
                                Type = "revue",
                                PdfPath = revue.PdfFilePath
                            });
                        }
                    }

                    // Get texts created BY THIS USER only (if any)
                    if (source == "all" || source == "text")
                    {
                        var texts = await _context.Texts
                            .Include(t => t.CreatedBy)
                            .Where(t => t.CreatedById == userId.Value)
                            .ToListAsync();

                        foreach (var text in texts)
                        {
                            historyItems.Add(new HistoryItemDto
                            {
                                Id = text.TextId,
                                User = text.CreatedBy?.Name ?? "Système",
                                Document = $"Texte: {text.Reference}",
                                Source = "text",
                                CreatedAt = text.CreatedAt,
                                ModifiedAt = text.CreatedAt,
                                Type = "text",
                                PdfPath = text.FilePath
                            });
                        }
                    }
                }

                // Apply filters
                var query = historyItems.AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(h => h.Document.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                           h.User.Contains(search, StringComparison.OrdinalIgnoreCase));
                }

                if (user != "all")
                {
                    query = query.Where(h => h.User.Equals(user, StringComparison.OrdinalIgnoreCase));
                }

                if (fromDate.HasValue)
                {
                    query = query.Where(h => h.CreatedAt >= fromDate.Value);
                }

                if (toDate.HasValue)
                {
                    query = query.Where(h => h.CreatedAt < toDate.Value);
                }

                // Get available users for filter
                var availableUsers = historyItems.Select(h => h.User).Distinct().OrderBy(u => u).ToList();

                // Sort by creation date (newest first)
                var sortedItems = query.OrderByDescending(h => h.CreatedAt).ToList();

                // Apply pagination
                var totalItems = sortedItems.Count;
                var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
                var startIndex = (page - 1) * pageSize;
                var pagedItems = sortedItems.Skip(startIndex).Take(pageSize).ToList();

                return Ok(new
                {
                    Items = pagedItems,
                    Pagination = new
                    {
                        CurrentPage = page,
                        TotalPages = totalPages,
                        TotalItems = totalItems,
                        PageSize = pageSize
                    },
                    AvailableUsers = availableUsers
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("download-pdf/{id}")]
        public async Task<IActionResult> DownloadPdf(int id, [FromQuery] string type)
        {
            try
            {
                // Check authentication
                var userId = HttpContext.Session.GetInt32("UserId");
                if (!userId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                string filePath = null;
                string fileName = null;

                switch (type)
                {
                    case "revue":
                        var revue = await _context.RevueDeDirections.FindAsync(id);
                        if (revue?.PdfFilePath != null)
                        {
                            filePath = revue.PdfFilePath;
                            fileName = $"Revue_{revue.RevueId}.pdf";
                        }
                        break;
                    case "text":
                        var text = await _context.Texts.FindAsync(id);
                        if (text?.FilePath != null)
                        {
                            filePath = text.FilePath;
                            fileName = $"Texte_{text.Reference}.pdf";
                        }
                        break;
                    default:
                        return BadRequest(new { message = "Type not supported for PDF download" });
                }

                if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath))
                {
                    return NotFound(new { message = "PDF file not found" });
                }

                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                return File(fileBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error downloading PDF: {ex.Message}" });
            }
        }
    }

    public class HistoryItemDto
    {
        public int Id { get; set; }
        public string User { get; set; } = string.Empty;
        public string Document { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime ModifiedAt { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? PdfPath { get; set; }
    }
}