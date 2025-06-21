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
    [Route("api/history")]
    public class HistoryController : ControllerBase
    {
        private readonly AuditDbContext _context;

        public HistoryController(AuditDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetHistory(
            [FromQuery] int? userId = null,
            [FromQuery] string actionType = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            // Check authentication
            var sessionUserId = HttpContext.Session.GetInt32("UserId");
            var companyId = HttpContext.Session.GetInt32("CompanyId");

            if (!sessionUserId.HasValue || !companyId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Validate page and pageSize
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;

            // Fetch evaluation history
            var evaluationHistoryQuery = _context.EvaluationHistory
                .Include(eh => eh.Evaluation)
                .ThenInclude(e => e.Text)
                .Include(eh => eh.ChangedBy)
                .Where(eh => eh.Evaluation.Text.CompanyId == companyId.Value);

            // Fetch action history
            var actionQuery = _context.Actions
                .Include(a => a.Text)
                .Include(a => a.CreatedBy)
                .Where(a => a.CompanyId == companyId.Value);

            // Apply filters
            if (userId.HasValue)
            {
                evaluationHistoryQuery = evaluationHistoryQuery.Where(eh => eh.ChangedById == userId.Value);
                actionQuery = actionQuery.Where(a => a.CreatedById == userId.Value);
            }
            if (!string.IsNullOrEmpty(actionType))
            {
                if (actionType.ToLower() == "evaluation")
                {
                    actionQuery = actionQuery.Where(a => false); // Exclude actions
                }
                else if (actionType.ToLower() == "action")
                {
                    evaluationHistoryQuery = evaluationHistoryQuery.Where(eh => false); // Exclude evaluations
                }
            }
            if (startDate.HasValue)
            {
                evaluationHistoryQuery = evaluationHistoryQuery.Where(eh => eh.ChangedAt >= startDate.Value);
                actionQuery = actionQuery.Where(a => a.CreatedAt >= startDate.Value);
            }
            if (endDate.HasValue)
            {
                evaluationHistoryQuery = evaluationHistoryQuery.Where(eh => eh.ChangedAt <= endDate.Value);
                actionQuery = actionQuery.Where(a => a.CreatedAt <= endDate.Value);
            }

            // Combine and project to HistoryItem
            var evaluationItems = await evaluationHistoryQuery
                .Select(eh => new HistoryItem
                {
                    Id = eh.HistoryId,
                    ActionType = "Evaluation",
                    Description = $"Changed status from {eh.PreviousStatus} to {eh.NewStatus} for requirement {eh.Evaluation.RequirementId}",
                    Timestamp = eh.ChangedAt,
                    PerformedBy = eh.ChangedBy.Name
                })
                .ToListAsync();

            var actionItems = await actionQuery
                .Select(a => new HistoryItem
                {
                    Id = a.ActionId,
                    ActionType = "Action",
                    Description = a.Description,
                    Timestamp = a.CreatedAt,
                    PerformedBy = a.CreatedBy.Name
                })
                .ToListAsync();

            var allItems = evaluationItems.Concat(actionItems)
                .OrderByDescending(item => item.Timestamp)
                .ToList();

            // Pagination
            var totalCount = allItems.Count;
            var paginatedItems = allItems
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Ok(new
            {
                items = paginatedItems,
                totalCount,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                currentPage = page
            });
        }
    }

    public class HistoryItem
    {
        public int Id { get; set; }
        public string ActionType { get; set; }
        public string Description { get; set; }
        public DateTime Timestamp { get; set; }
        public string PerformedBy { get; set; }
    }
}