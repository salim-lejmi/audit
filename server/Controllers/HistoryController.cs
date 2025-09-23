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
    [FromQuery] int pageSize = 20,
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

        // Determine access level based on user role
        bool isSuperAdmin = currentUser.Role == "SuperAdmin";
        bool isSubscriptionManager = currentUser.Role == "SubscriptionManager";
        int? userCompanyId = currentUser.CompanyId;

        // 1. COMPLIANCE EVALUATIONS
        if (source == "all" || source == "compliance")
        {
            var evaluationsQuery = _context.ComplianceEvaluations
                .Include(e => e.EvaluatedBy)
                .Include(e => e.Text)
                .Include(e => e.Requirement)
                .Where(e => e.IsSavedToHistory);

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything - no filter
            }
            else if (isSubscriptionManager)
            {
                evaluationsQuery = evaluationsQuery.Where(e => e.EvaluatedBy.CompanyId == userCompanyId);
            }
            else // Auditor or other roles
            {
                evaluationsQuery = evaluationsQuery.Where(e => e.UserId == userId.Value);
            }

            var evaluations = await evaluationsQuery.ToListAsync();
            foreach (var eval in evaluations)
            {
                string details = $"Évaluation de conformité - Texte: {eval.Text?.Reference}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = eval.EvaluationId,
                    EntityId = eval.EvaluationId,
                    User = eval.EvaluatedBy?.Name ?? "Utilisateur inconnu",
                    Document = $"Évaluation: {eval.Text?.Reference} - {eval.Requirement?.Title}",
                    Source = "compliance",
                    CreatedAt = eval.EvaluatedAt,
                    Type = "compliance",
                    Details = details,
                    Status = "Completed"
                });
            }
        }

        // 2. ACTIONS - Enhanced to detect completion by auditors
        if (source == "all" || source == "action")
        {
            var actionsQuery = _context.Actions
                .Include(a => a.CreatedBy)
                .Include(a => a.Responsible)
                .Include(a => a.Text)
                .Include(a => a.Requirement)
                .AsQueryable();

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything - no filter
            }
            else if (isSubscriptionManager)
            {
                actionsQuery = actionsQuery.Where(a => a.CompanyId == userCompanyId);
            }
            else // Auditor or other roles
            {
                actionsQuery = actionsQuery.Where(a => a.CreatedById == userId.Value || a.ResponsibleId == userId.Value);
            }

            var actions = await actionsQuery.ToListAsync();
            foreach (var action in actions)
            {
                string actionDetails = $"Responsable: {action.Responsible?.Name ?? "Non assigné"}";
                
                if (action.Status == "Completed" && action.Responsible != null)
                {
                    if (action.ResponsibleId == userId.Value)
                    {
                        actionDetails += " - Complétée par vous";
                    }
                    else
                    {
                        actionDetails += $" - Complétée par {action.Responsible.Name}";
                    }
                }
                
                if (actionDetails.Length > 50) actionDetails = actionDetails.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = action.ActionId,
                    EntityId = action.ActionId,
                    User = action.CreatedBy?.Name ?? "Utilisateur inconnu",
                    Document = action.Description,
                    Source = "action",
                    CreatedAt = action.CreatedAt,
                    Type = "action",
                    Details = actionDetails,
                    Status = action.Status
                });
            }
        }

        // 3. REVUES DE DIRECTION
        if (source == "all" || source == "revue")
        {
            var revuesQuery = _context.RevueDeDirections
                .Include(r => r.CreatedBy)
                .Include(r => r.Domain)
                .AsQueryable();

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything
            }
            else if (isSubscriptionManager)
            {
                revuesQuery = revuesQuery.Where(r => r.CompanyId == userCompanyId);
            }
            else // Auditor
            {
                revuesQuery = revuesQuery.Where(r => r.CreatedById == userId.Value);
            }

            var revues = await revuesQuery.ToListAsync();
            foreach (var revue in revues)
            {
                string details = $"Domaine: {revue.Domain?.Name} - Date: {revue.ReviewDate:dd/MM/yyyy}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = revue.RevueId,
                    EntityId = revue.RevueId,
                    User = revue.CreatedBy?.Name ?? "Utilisateur inconnu",
                    Document = $"Revue de direction - {revue.Domain?.Name}",
                    Source = "revue",
                    CreatedAt = revue.CreatedAt,
                    Type = "revue",
                    PdfPath = revue.PdfFilePath,
                    Details = details,
                    Status = revue.Status
                });
            }
        }

        // 4. REVUE ACTIONS
        if (source == "all" || source == "revue_action")
        {
            var revueActionsQuery = _context.RevueActions
                .Include(ra => ra.CreatedBy)
                .Include(ra => ra.Revue)
                    .ThenInclude(r => r.Domain)
                .AsQueryable();

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything
            }
            else if (isSubscriptionManager)
            {
                revueActionsQuery = revueActionsQuery.Where(ra => ra.CreatedBy.CompanyId == userCompanyId);
            }
            else // Auditor
            {
                revueActionsQuery = revueActionsQuery.Where(ra => ra.CreatedById == userId.Value);
            }

            var revueActions = await revueActionsQuery.ToListAsync();
            foreach (var ra in revueActions)
            {
                string details = $"Source: {ra.Source} - Domaine: {ra.Revue?.Domain?.Name}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = ra.ActionId,
                    EntityId = ra.ActionId,
                    User = ra.CreatedBy?.Name ?? "Utilisateur inconnu",
                    Document = $"Action de revue: {ra.Description}",
                    Source = "revue_action",
                    CreatedAt = ra.CreatedAt,
                    Type = "revue_action",
                    Details = details,
                    Status = ra.Status
                });
            }
        }

        // 5. REVUE LEGAL TEXTS
        if (source == "all" || source == "revue_legal_text")
        {
            var revueLegalTextsQuery = _context.RevueLegalTexts
                .Include(rlt => rlt.CreatedBy)
                .Include(rlt => rlt.Text)
                .Include(rlt => rlt.Revue)
                    .ThenInclude(r => r.Domain)
                .AsQueryable();

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything
            }
            else if (isSubscriptionManager)
            {
                revueLegalTextsQuery = revueLegalTextsQuery.Where(rlt => rlt.CreatedBy.CompanyId == userCompanyId);
            }
            else // Auditor
            {
                revueLegalTextsQuery = revueLegalTextsQuery.Where(rlt => rlt.CreatedById == userId.Value);
            }

            var revueLegalTexts = await revueLegalTextsQuery.ToListAsync();
            foreach (var rlt in revueLegalTexts)
            {
                string details = $"Domaine: {rlt.Revue?.Domain?.Name}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = rlt.LegalTextId,
                    EntityId = rlt.LegalTextId,
                    User = rlt.CreatedBy?.Name ?? "Utilisateur inconnu",
                    Document = $"Texte légal de revue: {rlt.Text?.Reference}",
                    Source = "revue_legal_text",
                    CreatedAt = rlt.CreatedAt,
                    Type = "revue_legal_text",
                    Details = details,
                    Status = "Active"
                });
            }
        }

        // 6. REVUE REQUIREMENTS
        if (source == "all" || source == "revue_requirement")
        {
            var revueRequirementsQuery = _context.RevueRequirements
                .Include(rr => rr.CreatedBy)
                .Include(rr => rr.TextRequirement)
                    .ThenInclude(tr => tr.Text)
                .Include(rr => rr.Revue)
                    .ThenInclude(r => r.Domain)
                .AsQueryable();

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything
            }
            else if (isSubscriptionManager)
            {
                revueRequirementsQuery = revueRequirementsQuery.Where(rr => rr.CreatedBy.CompanyId == userCompanyId);
            }
            else // Auditor
            {
                revueRequirementsQuery = revueRequirementsQuery.Where(rr => rr.CreatedById == userId.Value);
            }

            var revueRequirements = await revueRequirementsQuery.ToListAsync();
            foreach (var rr in revueRequirements)
            {
                string details = $"Texte: {rr.TextRequirement?.Text?.Reference} - Domaine: {rr.Revue?.Domain?.Name}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = rr.RequirementId,
                    EntityId = rr.RequirementId,
                    User = rr.CreatedBy?.Name ?? "Utilisateur inconnu",
                    Document = $"Exigence de revue: {rr.TextRequirement?.Title}",
                    Source = "revue_requirement",
                    CreatedAt = rr.CreatedAt,
                    Type = "revue_requirement",
                    Details = details,
                    Status = "Active"
                });
            }
        }

        // 7. REVUE STAKEHOLDERS
        if (source == "all" || source == "revue_stakeholder")
        {
            var revueStakeholdersQuery = _context.RevueStakeholders
                .Include(rs => rs.CreatedBy)
                .Include(rs => rs.Revue)
                    .ThenInclude(r => r.Domain)
                .AsQueryable();

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything
            }
            else if (isSubscriptionManager)
            {
                revueStakeholdersQuery = revueStakeholdersQuery.Where(rs => rs.CreatedBy.CompanyId == userCompanyId);
            }
            else // Auditor
            {
                revueStakeholdersQuery = revueStakeholdersQuery.Where(rs => rs.CreatedById == userId.Value);
            }

            var revueStakeholders = await revueStakeholdersQuery.ToListAsync();
            foreach (var rs in revueStakeholders)
            {
                string details = $"Statut: {rs.RelationshipStatus} - Domaine: {rs.Revue?.Domain?.Name}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = rs.StakeholderId,
                    EntityId = rs.StakeholderId,
                    User = rs.CreatedBy?.Name ?? "Utilisateur inconnu",
                    Document = $"Partie prenante: {rs.StakeholderName}",
                    Source = "revue_stakeholder",
                    CreatedAt = rs.CreatedAt,
                    Type = "revue_stakeholder",
                    Details = details,
                    Status = rs.RelationshipStatus
                });
            }
        }

        // 8. TEXTS
        if (source == "all" || source == "text")
        {
            var textsQuery = _context.Texts
                .Include(t => t.CreatedBy)
                .Include(t => t.DomainObject)
                .AsQueryable();

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything
            }
            else if (isSubscriptionManager)
            {
                textsQuery = textsQuery.Where(t => t.CompanyId == userCompanyId);
            }
            else // Auditor
            {
                textsQuery = textsQuery.Where(t => t.CreatedById == userId.Value);
            }

            var texts = await textsQuery.ToListAsync();
            foreach (var text in texts)
            {
                string details = $"Nature: {text.Nature} - Année: {text.PublicationYear} - Domaine: {text.DomainObject?.Name}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = text.TextId,
                    EntityId = text.TextId,
                    User = text.CreatedBy?.Name ?? "Système",
                    Document = $"Texte: {text.Reference}",
                    Source = "text",
                    CreatedAt = text.CreatedAt,
                    Type = "text",
                    PdfPath = text.FilePath,
                    Details = details,
                    Status = text.Status
                });
            }
        }

        // 9. COMPANIES (SuperAdmin only)
        if (isSuperAdmin && (source == "all" || source == "company"))
        {
            var companies = await _context.Companies.ToListAsync();
            foreach (var company in companies)
            {
                string details = $"Industrie: {company.Industry} - Vérifiée: {(company.IsEmailVerified ? "Oui" : "Non")}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = company.CompanyId,
                    EntityId = company.CompanyId,
                    User = "Système",
                    Document = $"Entreprise: {company.CompanyName}",
                    Source = "company",
                    CreatedAt = company.CreatedAt,
                    Type = "company",
                    Details = details,
                    Status = company.Status
                });
            }
        }

        // 10. USERS
        if (source == "all" || source == "user")
        {
            var usersQuery = _context.Users
                .Include(u => u.Company)
                .AsQueryable();

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything
            }
            else if (isSubscriptionManager)
            {
                usersQuery = usersQuery.Where(u => u.CompanyId == userCompanyId);
            }
            else // Auditor
            {
                usersQuery = usersQuery.Where(u => u.UserId == userId.Value);
            }

            var usersList = await usersQuery.ToListAsync();
            foreach (var userItem in usersList)
            {
                if (userItem.CreatedAt.HasValue)
                {
                    string details = $"Email: {userItem.Email} - Rôle: {userItem.Role} - Entreprise: {userItem.Company?.CompanyName}";
                    if (details.Length > 50) details = details.Substring(0, 47) + "...";

                    historyItems.Add(new HistoryItemDto
                    {
                        Id = userItem.UserId,
                        EntityId = userItem.UserId,
                        User = userItem.Name,
                        Document = $"Utilisateur: {userItem.Name}",
                        Source = "user",
                        CreatedAt = userItem.CreatedAt.Value,
                        Type = "user",
                        Details = details,
                        Status = userItem.Status
                    });
                }
            }
        }

        // 11. PAYMENTS (SuperAdmin and SubscriptionManager only)
        if ((isSuperAdmin || isSubscriptionManager) && (source == "all" || source == "payment"))
        {
            var paymentsQuery = _context.Payments
                .Include(p => p.Company)
                .Include(p => p.Plan)
                .AsQueryable();

            if (!isSuperAdmin && isSubscriptionManager)
                paymentsQuery = paymentsQuery.Where(p => p.CompanyId == userCompanyId);

            var payments = await paymentsQuery.ToListAsync();
            foreach (var payment in payments)
            {
                string details = $"Montant: {payment.Amount:F2}€ - Plan: {payment.Plan?.Name}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = payment.PaymentId,
                    EntityId = payment.PaymentId,
                    User = payment.Company?.CompanyName ?? "Entreprise inconnue",
                    Document = $"Paiement: {payment.Description}",
                    Source = "payment",
                    CreatedAt = payment.CreatedAt,
                    Type = "payment",
                    Details = details,
                    Status = payment.Status
                });
            }
        }

        // 12. SUBSCRIPTIONS (SuperAdmin and SubscriptionManager only)
        if ((isSuperAdmin || isSubscriptionManager) && (source == "all" || source == "subscription"))
        {
            var subscriptionsQuery = _context.CompanySubscriptions
                .Include(cs => cs.Company)
                .Include(cs => cs.Plan)
                .AsQueryable();

            if (!isSuperAdmin && isSubscriptionManager)
                subscriptionsQuery = subscriptionsQuery.Where(cs => cs.CompanyId == userCompanyId);

            var subscriptions = await subscriptionsQuery.ToListAsync();
            foreach (var subscription in subscriptions)
            {
                string details = $"Du {subscription.StartDate:dd/MM/yyyy} au {subscription.EndDate:dd/MM/yyyy}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = subscription.SubscriptionId,
                    EntityId = subscription.SubscriptionId,
                    User = subscription.Company?.CompanyName ?? "Entreprise inconnue",
                    Document = $"Abonnement: {subscription.Plan?.Name}",
                    Source = "subscription",
                    CreatedAt = subscription.CreatedAt,
                    Type = "subscription",
                    Details = details,
                    Status = subscription.Status
                });
            }
        }

        // 13. OBSERVATIONS
        if (source == "all" || source == "observation")
        {
            var observationsQuery = _context.Observations
                .Include(o => o.Evaluation)
                    .ThenInclude(e => e.EvaluatedBy)
                .AsQueryable();

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything
            }
            else if (isSubscriptionManager)
            {
                observationsQuery = observationsQuery.Where(o => o.Evaluation.EvaluatedBy.CompanyId == userCompanyId);
            }
            else // Auditor
            {
                observationsQuery = observationsQuery.Where(o => o.Evaluation.UserId == userId.Value);
            }

            var observations = await observationsQuery.ToListAsync();
            foreach (var obs in observations)
            {
                string details = $"Observation - Évaluation #{obs.EvaluationId}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = obs.ObservationId,
                    EntityId = obs.ObservationId,
                    User = obs.Evaluation?.EvaluatedBy?.Name ?? "Utilisateur inconnu",
                    Document = $"Observation: ID {obs.ObservationId}",
                    Source = "observation",
                    CreatedAt = obs.CreatedAt,
                    Type = "observation",
                    Details = details,
                    Status = "Active"
                });
            }
        }

        // 14. MONITORING PARAMETERS
        if (source == "all" || source == "monitoring")
        {
            var monitoringQuery = _context.MonitoringParameters
                .Include(mp => mp.Evaluation)
                    .ThenInclude(e => e.EvaluatedBy)
                .AsQueryable();

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything
            }
            else if (isSubscriptionManager)
            {
                monitoringQuery = monitoringQuery.Where(mp => mp.Evaluation.EvaluatedBy.CompanyId == userCompanyId);
            }
            else // Auditor
            {
                monitoringQuery = monitoringQuery.Where(mp => mp.Evaluation.UserId == userId.Value);
            }

            var monitoringParams = await monitoringQuery.ToListAsync();
            foreach (var mp in monitoringParams)
            {
                string details = $"Paramètre de suivi - Évaluation #{mp.EvaluationId}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = mp.ParameterId,
                    EntityId = mp.ParameterId,
                    User = mp.Evaluation?.EvaluatedBy?.Name ?? "Utilisateur inconnu",
                    Document = $"Paramètre de suivi: ID {mp.ParameterId}",
                    Source = "monitoring",
                    CreatedAt = mp.CreatedAt,
                    Type = "monitoring",
                    Details = details,
                    Status = "Active"
                });
            }
        }

        // 15. EVALUATION ATTACHMENTS
        if (source == "all" || source == "attachment")
        {
            var attachmentsQuery = _context.EvaluationAttachments
                .Include(ea => ea.Evaluation)
                    .ThenInclude(e => e.EvaluatedBy)
                .AsQueryable();

            if (isSuperAdmin)
            {
                // SuperAdmin sees everything
            }
            else if (isSubscriptionManager)
            {
                attachmentsQuery = attachmentsQuery.Where(ea => ea.Evaluation.EvaluatedBy.CompanyId == userCompanyId);
            }
            else // Auditor
            {
                attachmentsQuery = attachmentsQuery.Where(ea => ea.Evaluation.UserId == userId.Value);
            }

            var attachments = await attachmentsQuery.ToListAsync();
            foreach (var att in attachments)
            {
                string details = $"Fichier: {att.FileName} - Évaluation #{att.EvaluationId}";
                if (details.Length > 50) details = details.Substring(0, 47) + "...";

                historyItems.Add(new HistoryItemDto
                {
                    Id = att.AttachmentId,
                    EntityId = att.AttachmentId,
                    User = att.Evaluation?.EvaluatedBy?.Name ?? "Utilisateur inconnu",
                    Document = $"Pièce jointe: {att.FileName}",
                    Source = "attachment",
                    CreatedAt = att.UploadedAt,
                    Type = "attachment",
                    Details = details,
                    Status = "Active"
                });
            }
        }

        // Apply filters
        var query = historyItems.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(h => 
                h.Document.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                h.User.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                (h.Details != null && h.Details.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                (h.Status != null && h.Status.Contains(search, StringComparison.OrdinalIgnoreCase))
            );
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
        public int EntityId { get; set; }
        public string User { get; set; } = string.Empty;
        public string Document { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? PdfPath { get; set; }
        public string? Details { get; set; }
        public string? Status { get; set; }

    }
}