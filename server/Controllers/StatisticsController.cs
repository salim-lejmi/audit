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
    [Route("api/statistics")]
    public class StatisticsController : ControllerBase
    {
        private readonly AuditDbContext _context;

        public StatisticsController(AuditDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetStatistics([FromQuery] int? domainId = null)
        {
            try
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                // Base query for texts in the user's company
                IQueryable<Text> textsQuery = _context.Texts
                    .Where(t => t.CompanyId == companyId.Value);

                // Filter by domain if specified
                if (domainId.HasValue)
                {
                    textsQuery = textsQuery.Where(t => t.DomainId == domainId.Value);
                }

                // 1. Conformity state statistics (for texts)
                var textsByStatus = await textsQuery
                    .GroupBy(t => t.Status)
                    .Select(g => new
                    {
                        status = g.Key,
                        count = g.Count()
                    })
                    .ToListAsync();

                // 2. Requirement conformity statistics
                var textIds = await textsQuery.Select(t => t.TextId).ToListAsync();
                
                var requirementsByStatus = await _context.TextRequirements
                    .Where(tr => textIds.Contains(tr.TextId))
                    .GroupJoin(
                        _context.ComplianceEvaluations,
                        tr => tr.RequirementId,
                        ce => ce.RequirementId,
                        (tr, ceGroup) => new
                        {
                            Status = ceGroup.Any() ? ceGroup.OrderByDescending(ce => ce.EvaluatedAt).First().Status : tr.Status
                        }
                    )
                    .GroupBy(x => x.Status)
                    .Select(g => new
                    {
                        status = g.Key,
                        count = g.Count()
                    })
                    .ToListAsync();

                // 3. Action progress statistics
                var actions = await _context.Actions
                    .Where(a => a.CompanyId == companyId.Value && 
                               (domainId == null || textsQuery.Any(t => t.TextId == a.TextId)))
                    .ToListAsync();

                var actionsByStatus = actions
                    .GroupBy(a => a.Status)
                    .Select(g => new
                    {
                        status = g.Key,
                        count = g.Count()
                    })
                    .ToList();

                var actionProgressGroups = new List<object>();
                
                // Group actions by progress ranges
                actionProgressGroups.Add(new
                {
                    range = "0-25%",
                    count = actions.Count(a => a.Progress >= 0 && a.Progress <= 25)
                });
                actionProgressGroups.Add(new
                {
                    range = "26-50%",
                    count = actions.Count(a => a.Progress > 25 && a.Progress <= 50)
                });
                actionProgressGroups.Add(new
                {
                    range = "51-75%",
                    count = actions.Count(a => a.Progress > 50 && a.Progress <= 75)
                });
                actionProgressGroups.Add(new
                {
                    range = "76-100%",
                    count = actions.Count(a => a.Progress > 75 && a.Progress <= 100)
                });

                // 4. Action progress by responsible person
                var actionsByResponsible = await _context.Actions
                    .Where(a => a.CompanyId == companyId.Value && 
                           a.ResponsibleId.HasValue &&
                           (domainId == null || textsQuery.Any(t => t.TextId == a.TextId)))
                    .GroupBy(a => new { a.ResponsibleId, ResponsibleName = a.Responsible.Name })
                    .Select(g => new
                    {
                        responsibleId = g.Key.ResponsibleId,
                        responsibleName = g.Key.ResponsibleName,
                        totalActions = g.Count(),
                        completedActions = g.Count(a => a.Status == "completed"),
                        averageProgress = g.Average(a => a.Progress)
                    })
                    .ToListAsync();

                // Get available domains for filtering
                var domains = await _context.Domains
                    .Where(d => _context.Texts
                        .Where(t => t.CompanyId == companyId.Value)
                        .Select(t => t.DomainId)
                        .Contains(d.DomainId))
                    .Select(d => new
                    {
                        domainId = d.DomainId,
                        name = d.Name
                    })
                    .ToListAsync();

                return Ok(new
                {
                    domains,
                    textsByStatus,
                    requirementsByStatus,
                    actionsByStatus,
                    actionProgressGroups,
                    actionsByResponsible
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}