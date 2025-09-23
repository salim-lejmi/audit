using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using server.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Action = server.Models.Action;

namespace server.Controllers
{
    [ApiController]
    [Route("api/action-plan")]
    public class ActionPlanController : ControllerBase
    {
        private readonly AuditDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly INotificationService _notificationService;

        public ActionPlanController(AuditDbContext context, IWebHostEnvironment environment, INotificationService notificationService)
        {
            _context = context;
            _environment = environment;
            _notificationService = notificationService;

        }

        [HttpGet]
        public async Task<IActionResult> GetActions(
            [FromQuery] int? domainId = null,
            [FromQuery] int? themeId = null,
            [FromQuery] int? subThemeId = null,
            [FromQuery] string nature = null,
            [FromQuery] int? publicationYear = null,
            [FromQuery] string keyword = null,
            [FromQuery] int? responsibleId = null,
            [FromQuery] string status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // Check authentication
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                // Get user role
                var user = await _context.Users.FindAsync(userId.Value);
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                // Build query with filters
                IQueryable<Action> query = _context.Actions
                    .Include(a => a.Text)
                    .ThenInclude(t => t.DomainObject)
                    .Include(a => a.Text)
                    .ThenInclude(t => t.ThemeObject)
                    .Include(a => a.Text)
                    .ThenInclude(t => t.SubThemeObject)
                    .Include(a => a.Requirement)
                    .Include(a => a.Responsible)
                    .Where(a => a.CompanyId == companyId.Value); // Filter by company

                // If user is not SubscriptionManager, only show actions assigned to them
                if (user.Role != "SubscriptionManager")
                {
                    query = query.Where(a => a.ResponsibleId == userId);
                }
                // If user is SubscriptionManager, filter by company users if responsibleId is provided
                else if (responsibleId.HasValue)
                {
                    // Verify responsible user is in the same company
                    var responsible = await _context.Users.FindAsync(responsibleId.Value);
                    if (responsible == null || responsible.CompanyId != companyId)
                    {
                        return BadRequest(new { message = "Invalid responsible user" });
                    }
                    
                    query = query.Where(a => a.ResponsibleId == responsibleId);
                }

                // Apply other filters
                if (domainId.HasValue)
                    query = query.Where(a => a.Text.DomainId == domainId.Value);

                if (themeId.HasValue)
                    query = query.Where(a => a.Text.ThemeId == themeId.Value);

                if (subThemeId.HasValue)
                    query = query.Where(a => a.Text.SubThemeId == subThemeId.Value);

                if (!string.IsNullOrEmpty(nature))
                    query = query.Where(a => a.Text.Nature.Contains(nature));

                if (publicationYear.HasValue)
                    query = query.Where(a => a.Text.PublicationYear == publicationYear.Value);

                if (!string.IsNullOrEmpty(keyword))
                    query = query.Where(a => a.Text.Reference.Contains(keyword) ||
                                           a.Description.Contains(keyword));

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(a => a.Status == status);

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Get actions for current page
                var actions = await query
                    .OrderByDescending(a => a.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(a => new
                    {
                        actionId = a.ActionId,
                        textId = a.TextId,
                        textReference = a.Text.Reference,
                        requirementId = a.RequirementId,
                        requirementTitle = a.Requirement != null ? a.Requirement.Title : null,
                        description = a.Description,
                        responsibleId = a.ResponsibleId,
                        responsibleName = a.Responsible != null ? a.Responsible.Name : null,
                        deadline = a.Deadline,
                        progress = a.Progress,
                        effectiveness = a.Effectiveness,
                        status = a.Status,
                        createdAt = a.CreatedAt,
                        updatedAt = a.UpdatedAt,
                        createdById = a.CreatedById,
                        domain = a.Text.DomainObject != null ? a.Text.DomainObject.Name : null,
                        theme = a.Text.ThemeObject != null ? a.Text.ThemeObject.Name : null,
                        subTheme = a.Text.SubThemeObject != null ? a.Text.SubThemeObject.Name : null
                    })
                    .ToListAsync();

                return Ok(new
                {
                    actions,
                    totalCount,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                    currentPage = page
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("{actionId}")]
        public async Task<IActionResult> GetAction(int actionId)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            var companyId = HttpContext.Session.GetInt32("CompanyId");
            
            if (!userId.HasValue || !companyId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            var action = await _context.Actions
                .Include(a => a.Text)
                .Include(a => a.Requirement)
                .Include(a => a.Responsible)
                .Include(a => a.CreatedBy)
                .FirstOrDefaultAsync(a => a.ActionId == actionId && a.CompanyId == companyId.Value); // Filter by company

            if (action == null)
            {
                return NotFound(new { message = "Action not found" });
            }

            // Get user
            var user = await _context.Users.FindAsync(userId.Value);

            // Check if user has access to this action
            if (user.Role != "SubscriptionManager" && action.ResponsibleId != userId)
            {
                return StatusCode(403, new { message = "You don't have permission to view this action" });
            }

            var result = new
            {
                actionId = action.ActionId,
                textId = action.TextId,
                textReference = action.Text.Reference,
                requirementId = action.RequirementId,
                requirementTitle = action.Requirement?.Title,
                description = action.Description,
                responsibleId = action.ResponsibleId,
                responsibleName = action.Responsible?.Name,
                deadline = action.Deadline,
                progress = action.Progress,
                effectiveness = action.Effectiveness,
                status = action.Status,
                createdAt = action.CreatedAt,
                updatedAt = action.UpdatedAt,
                createdById = action.CreatedById,
                createdByName = action.CreatedBy.Name
            };

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAction([FromBody] CreateActionRequest request)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            var companyId = HttpContext.Session.GetInt32("CompanyId");
            
            if (!userId.HasValue || !companyId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Validate request
            if (request.TextId <= 0 || string.IsNullOrEmpty(request.Description) ||
                request.Deadline == default)
            {
                return BadRequest(new { message = "TextId, description, and deadline are required" });
            }

            // Verify text exists and belongs to the same company
            var text = await _context.Texts
                .FirstOrDefaultAsync(t => t.TextId == request.TextId && t.CompanyId == companyId.Value);
                
            if (text == null)
            {
                return NotFound(new { message = "Text not found" });
            }

            // Verify requirement exists if provided
            if (request.RequirementId.HasValue)
            {
                var requirement = await _context.TextRequirements.FindAsync(request.RequirementId.Value);
                if (requirement == null)
                {
                    return NotFound(new { message = "Requirement not found" });
                }
                if (requirement.TextId != request.TextId)
                {
                    return BadRequest(new { message = "Requirement does not belong to the specified text" });
                }
            }

            // Get current user
            var currentUser = await _context.Users.FindAsync(userId.Value);

            // Verify responsible user exists if provided
            if (request.ResponsibleId.HasValue && request.ResponsibleId.Value > 0)
            {
                // Verify responsible user exists
                var responsible = await _context.Users.FindAsync(request.ResponsibleId.Value);
                if (responsible == null)
                {
                    return NotFound(new { message = "Responsible user not found" });
                }

                // Check permission: Only SubscriptionManager can assign actions to other users
                if (currentUser.Role != "SubscriptionManager" && request.ResponsibleId != userId)
                {
                    return StatusCode(403, new { message = "You can only create actions for yourself" });
                }

                // If SubscriptionManager, ensure responsible user is in the same company
                if (currentUser.Role == "SubscriptionManager" && responsible.CompanyId != currentUser.CompanyId)
                {
                    return StatusCode(403, new { message = "You can only assign actions to users in your company" });
                }
            }

            // Create action
            var action = new Action
            {
                TextId = request.TextId,
                RequirementId = request.RequirementId,
                Description = request.Description,
                ResponsibleId = request.ResponsibleId,
                Deadline = request.Deadline,
                Progress = request.Progress,
                Effectiveness = request.Effectiveness,
                Status = request.Status ?? "active",
                CompanyId = companyId.Value,
                CreatedAt = DateTime.Now,
                CreatedById = userId.Value
            };

            _context.Actions.Add(action);
            await _context.SaveChangesAsync();

            // Create notification if action is assigned to someone else
            if (request.ResponsibleId.HasValue && request.ResponsibleId.Value != userId.Value)
            {
                await _notificationService.CreateNotificationAsync(
                    request.ResponsibleId.Value,
                 "Nouvelle action assignée",
        $"Une nouvelle action vous a été assignée : {request.Description}",
        "ActionAssignée",
                    action.ActionId
                );
            }

            return CreatedAtAction(nameof(GetAction), new { actionId = action.ActionId },
                new { actionId = action.ActionId, message = "Action created successfully" });
        }

[HttpPut("{actionId}")]
public async Task<IActionResult> UpdateAction(int actionId, [FromBody] UpdateActionRequest request)
{
    // Check authentication
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");
    
    if (!userId.HasValue || !companyId.HasValue)
    {
        return Unauthorized(new { message = "Not authenticated" });
    }

    // Find action and ensure it belongs to the user's company
    var action = await _context.Actions
        .Include(a => a.CreatedBy)
        .FirstOrDefaultAsync(a => a.ActionId == actionId && a.CompanyId == companyId.Value);
        
    if (action == null)
    {
        return NotFound(new { message = "Action not found" });
    }

    // Get current user
    var currentUser = await _context.Users.FindAsync(userId.Value);

    // Check permission based on user role
    bool isAuditor = currentUser.Role != "SuperAdmin" && currentUser.Role != "SubscriptionManager";
    bool canEdit = false;

    if (!isAuditor)
    {
        // SuperAdmin or SubscriptionManager can edit any action in their company
        canEdit = true;
    }
    else
    {
        // Auditors can only edit actions assigned to them
        canEdit = action.ResponsibleId == userId.Value;
    }

    if (!canEdit)
    {
        return StatusCode(403, new { message = "You don't have permission to update this action" });
    }

    var oldStatus = action.Status;
    var wasAssignedToSomeoneElse = false;
    var oldResponsibleId = action.ResponsibleId;

    // Track changes to specific fields
    var entry = _context.Entry(action);

    if (isAuditor)
    {
        // Auditors can only update progress and status
        if (request.Progress.HasValue)
        {
            entry.Property(a => a.Progress).IsModified = true;
            action.Progress = request.Progress.Value;
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            entry.Property(a => a.Status).IsModified = true;
            action.Status = request.Status;
        }

        if (request.Effectiveness != null) // Check for null to allow clearing
        {
            entry.Property(a => a.Effectiveness).IsModified = true;
            action.Effectiveness = request.Effectiveness;
        }
    }
    else
    {
        // SuperAdmin/SubscriptionManager can update all fields
        if (!string.IsNullOrEmpty(request.Description))
        {
            entry.Property(a => a.Description).IsModified = true;
            action.Description = request.Description;
        }

        if (request.ResponsibleId.HasValue)
        {
            // If ResponsibleId is provided and not zero, verify responsible user exists and is in the same company
            if (request.ResponsibleId.Value > 0)
            {
                var responsible = await _context.Users.FindAsync(request.ResponsibleId.Value);
                if (responsible == null)
                {
                    return BadRequest(new { message = "Responsible user not found" });
                }
                if (responsible.CompanyId != currentUser.CompanyId)
                {
                    return StatusCode(403, new { message = "You can only assign actions to users in your company" });
                }

                // Check if action is being assigned to someone else
                if (request.ResponsibleId.Value != oldResponsibleId && request.ResponsibleId.Value != userId.Value)
                {
                    wasAssignedToSomeoneElse = true;
                }
            }
            entry.Property(a => a.ResponsibleId).IsModified = true;
            action.ResponsibleId = request.ResponsibleId;
        }

        if (request.Deadline.HasValue)
        {
            entry.Property(a => a.Deadline).IsModified = true;
            action.Deadline = request.Deadline.Value;
        }

        if (request.Progress.HasValue)
        {
            entry.Property(a => a.Progress).IsModified = true;
            action.Progress = request.Progress.Value;
        }

        if (request.Effectiveness != null) // Check for null to allow clearing
        {
            entry.Property(a => a.Effectiveness).IsModified = true;
            action.Effectiveness = request.Effectiveness;
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            entry.Property(a => a.Status).IsModified = true;
            action.Status = request.Status;
        }
    }

    action.UpdatedAt = DateTime.Now;
    entry.Property(a => a.UpdatedAt).IsModified = true;

    try
    {
        await _context.SaveChangesAsync();
    }
    catch (DbUpdateException ex)
    {
        return StatusCode(500, new { message = "Error saving changes", error = ex.InnerException?.Message ?? ex.Message });
    }

    // Create notifications based on what changed
    if (wasAssignedToSomeoneElse && action.ResponsibleId.HasValue)
    {
        await _notificationService.CreateNotificationAsync(
            action.ResponsibleId.Value,
         "Action assignée pour vous",
$"Une action vous a été assignée : {action.Description}",
"ActionAssignée",

            action.ActionId
        );
    }

    if (oldStatus != "completed" && action.Status == "completed" && action.CreatedById != userId.Value)
    {
        await _notificationService.CreateNotificationAsync(
            action.CreatedById,
            "Action Completed",
            $"Action has been completed: {action.Description}",
            "ActionCompleted",
            action.ActionId
        );
    }

    return Ok(new { message = "Action updated successfully" });
}
[HttpDelete("{actionId}")]
public async Task<IActionResult> DeleteAction(int actionId)
{
    try
    {
        // Check authentication
        var userId = HttpContext.Session.GetInt32("UserId");
        var companyId = HttpContext.Session.GetInt32("CompanyId");
        
        if (!userId.HasValue || !companyId.HasValue)
        {
            return Unauthorized(new { message = "Not authenticated" });
        }

        // Find action and ensure it belongs to the user's company
        var action = await _context.Actions
            .FirstOrDefaultAsync(a => a.ActionId == actionId && a.CompanyId == companyId.Value);
            
        if (action == null)
        {
            return NotFound(new { message = "Action not found" });
        }

        // Get current user
        var currentUser = await _context.Users.FindAsync(userId.Value);

        // Check permission: Only SubscriptionManager or creator can delete the action
        if (currentUser.Role != "SubscriptionManager" && action.CreatedById != userId)
        {
            return StatusCode(403, new { message = "You don't have permission to delete this action" });
        }

        // --- DELETE RELATED NOTIFICATIONS FIRST ---
        
        // Delete all notifications that reference this action
        var relatedNotifications = await _context.Notifications
                                                .Where(n => n.RelatedActionId == actionId)
                                                .ToListAsync();
        
        if (relatedNotifications.Any())
        {
            _context.Notifications.RemoveRange(relatedNotifications);
        }

        // Delete the action
        _context.Actions.Remove(action);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Action deleted successfully" });
    }
    catch (Exception ex)
    {
        // Log the exception
        Console.WriteLine($"Error deleting action: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while deleting the action", details = ex.Message });
    }
}
        [HttpGet("export")]
        public async Task<IActionResult> ExportActionPlan(
            [FromQuery] int? textId = null,
            [FromQuery] int? responsibleId = null)
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            var companyId = HttpContext.Session.GetInt32("CompanyId");
            
            if (!userId.HasValue || !companyId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Get user
            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            // Build query
            IQueryable<Action> query = _context.Actions
                .Include(a => a.Text)
                .Include(a => a.Requirement)
                .Include(a => a.Responsible)
                .Include(a => a.CreatedBy)
                .Where(a => a.CompanyId == companyId.Value); // Filter by company

            // If user is not SubscriptionManager, only show actions assigned to them
            if (user.Role != "SubscriptionManager")
            {
                query = query.Where(a => a.ResponsibleId == userId);
            }
            // If user is SubscriptionManager and responsibleId is provided, filter by that
            else if (responsibleId.HasValue)
            {
                // Verify responsible user is in the same company
                var responsible = await _context.Users.FindAsync(responsibleId.Value);
                if (responsible == null || responsible.CompanyId != user.CompanyId)
                {
                    return BadRequest(new { message = "Invalid responsible user" });
                }
                query = query.Where(a => a.ResponsibleId == responsibleId);
            }

            // Filter by textId if provided
            if (textId.HasValue)
            {
                // Verify text belongs to the user's company
                var text = await _context.Texts
                    .FirstOrDefaultAsync(t => t.TextId == textId && t.CompanyId == companyId.Value);
                    
                if (text == null)
                {
                    return BadRequest(new { message = "Invalid text" });
                }
                
                query = query.Where(a => a.TextId == textId);
            }

            // Get actions
            var actions = await query
                .OrderBy(a => a.Deadline)
                .Select(a => new
                {
                    textReference = a.Text.Reference,
                    requirementTitle = a.Requirement != null ? a.Requirement.Title : null,
                    description = a.Description,
                    responsibleName = a.Responsible != null ? a.Responsible.Name : null,
                    deadline = a.Deadline,
                    progress = a.Progress,
                    effectiveness = a.Effectiveness,
                    status = a.Status,
                    createdAt = a.CreatedAt,
                    createdByName = a.CreatedBy.Name
                })
                .ToListAsync();

            // Prepare export data
            var exportData = new
            {
                title = "Plan d'action",
                generatedAt = DateTime.Now,
                generatedBy = user.Name,
                textId = textId,
                textReference = textId.HasValue
                    ? await _context.Texts.Where(t => t.TextId == textId && t.CompanyId == companyId).Select(t => t.Reference).FirstOrDefaultAsync()
                    : null,
                responsibleName = responsibleId.HasValue
                    ? await _context.Users.Where(u => u.UserId == responsibleId && u.CompanyId == companyId).Select(u => u.Name).FirstOrDefaultAsync()
                    : null,
                actions
            };

            return Ok(exportData);
        }
        [HttpGet("{actionId}/tips")]
public async Task<IActionResult> GetActionTips(int actionId)
{
    try
    {
        // Check authentication
        var userId = HttpContext.Session.GetInt32("UserId");
        var companyId = HttpContext.Session.GetInt32("CompanyId");
        
        if (!userId.HasValue || !companyId.HasValue)
        {
            return Unauthorized(new { message = "Not authenticated" });
        }

        // Get the action
        var action = await _context.Actions
            .Include(a => a.Text)
            .ThenInclude(t => t.DomainObject)
            .Include(a => a.Text)
            .ThenInclude(t => t.ThemeObject)
            .FirstOrDefaultAsync(a => a.ActionId == actionId && a.CompanyId == companyId.Value);

        if (action == null)
        {
            return NotFound(new { message = "Action not found" });
        }

        // Get user
        var user = await _context.Users.FindAsync(userId.Value);

        // Check if user has access to this action
        if (user.Role != "SubscriptionManager" && action.ResponsibleId != userId)
        {
            return StatusCode(403, new { message = "You don't have permission to view this action" });
        }

        // Call Flask NLP service
        var tips = await CallNLPService(action);

        return Ok(new { 
            actionId = actionId,
            tips = tips,
            success = true
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = ex.Message });
    }
}

private async Task<object> CallNLPService(Action action)
{
    try
    {
        using (var httpClient = new HttpClient())
        {
            var requestData = new
            {
                description = action.Description,
                domain = action.Text?.DomainObject?.Name,
                theme = action.Text?.ThemeObject?.Name
            };

            var json = System.Text.Json.JsonSerializer.Serialize(requestData);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync("http://localhost:5000/analyze-action", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                return System.Text.Json.JsonSerializer.Deserialize<object>(responseContent);
            }
            else
            {
                // Return fallback tips if service is unavailable
                return new
                {
                    success = false,
                    analysis = new
                    {
                        priority_level = "Medium",
                        risk_assessment = "Service temporarily unavailable",
                        recommended_tips = new[]
                        {
                            "Review action requirements carefully",
                            "Consult with relevant stakeholders",
                            "Document progress regularly"
                        },
                        estimated_effort = "Medium",
                        suggested_timeline = "2-4 weeks"
                    }
                };
            }
        }
    }
    catch (Exception ex)
    {
        // Return fallback tips on error
        return new
        {
            success = false,
            error = "NLP service unavailable",
            analysis = new
            {
                priority_level = "Medium",
                risk_assessment = "Unable to analyze at this time",
                recommended_tips = new[]
                {
                    "Review action requirements",
                    "Engage with team members",
                    "Monitor progress closely"
                }
            }
        };
    }
}

       public class CreateActionRequest
        {
            public int TextId { get; set; }
            public int? RequirementId { get; set; }
            public string Description { get; set; }
            public int? ResponsibleId { get; set; }
            public DateTime Deadline { get; set; }
            public int Progress { get; set; } = 0;
            public string Effectiveness { get; set; }
            public string Status { get; set; } = "active";
        }       
        
    public class UpdateActionRequest
{
    public string Description { get; set; }
    public int? ResponsibleId { get; set; }
    public DateTime? Deadline { get; set; }
    public int? Progress { get; set; }
    public string Effectiveness { get; set; }
    public string Status { get; set; }
}

    }
}