using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using System.Threading.Tasks;

namespace server.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly AuditDbContext _context;

        public AdminController(AuditDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            // Check if user is a SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return Forbid();
            }

            // Get statistics
            var totalCompanies = await _context.Companies
                .CountAsync(c => c.Status == "Approved");

            var totalUsers = await _context.Users
                .CountAsync();

            var pendingRequests = await _context.Companies
                .CountAsync(c => c.Status == "Pending");

            return Ok(new
            {
                totalCompanies,
                totalUsers,
                pendingRequests
            });
        }

        [HttpGet("pending-companies")]
        public async Task<IActionResult> GetPendingCompanies()
        {
            // Check if user is a SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return Forbid();
            }

            // Get pending companies with their subscription managers
            var pendingCompanies = await _context.Companies
                .Where(c => c.Status == "Pending")
                .Select(c => new
                {
                    companyId = c.CompanyId,
                    companyName = c.CompanyName,
                    industry = c.Industry,
                    createdAt = c.CreatedAt,
                    managerName = c.Users
                        .Where(u => u.Role == "SubscriptionManager")
                        .Select(u => u.Name)
                        .FirstOrDefault(),
                    email = c.Users
                        .Where(u => u.Role == "SubscriptionManager")
                        .Select(u => u.Email)
                        .FirstOrDefault(),
                    phoneNumber = c.Users
                        .Where(u => u.Role == "SubscriptionManager")
                        .Select(u => u.PhoneNumber)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(pendingCompanies);
        }

        [HttpPut("approve-company/{companyId}")]
        public async Task<IActionResult> ApproveCompany(int companyId)
        {
            // Check if user is a SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return Forbid();
            }

            // Find company
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null)
            {
                return NotFound(new { message = "Company not found" });
            }

            // Update company status
            company.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Company approved successfully" });
        }

        [HttpPut("reject-company/{companyId}")]
        public async Task<IActionResult> RejectCompany(int companyId)
        {
            // Check if user is a SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return Forbid();
            }

            // Find company
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null)
            {
                return NotFound(new { message = "Company not found" });
            }

            // Update company status
            company.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Company rejected successfully" });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            // Check if user is a SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return Forbid();
            }

            // Get all users with company information
            var users = await _context.Users
                .Join(_context.Companies,
                    user => user.CompanyId,
                    company => company.CompanyId,
                    (user, company) => new
                    {
                        userId = user.UserId,
                        name = user.Name,
                        email = user.Email,
                        phoneNumber = user.PhoneNumber,
                        role = user.Role,
                        companyId = company.CompanyId,
                        companyName = company.CompanyName,
                        createdAt = user.CreatedAt
                    })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("companies")]
        public async Task<IActionResult> GetAllCompanies()
        {
            // Check if user is a SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return Forbid();
            }

            // Get all approved companies
            var companies = await _context.Companies
                .Where(c => c.Status == "Approved")
                .Select(c => new
                {
                    companyId = c.CompanyId,
                    companyName = c.CompanyName
                })
                .ToListAsync();

            return Ok(companies);
        }

        [HttpPut("users/{userId}")]
        public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserRequest request)
        {
            // Check if user is a SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return Forbid();
            }

            // Find user
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Update user fields
            if (!string.IsNullOrEmpty(request.Name))
                user.Name = request.Name;

            if (!string.IsNullOrEmpty(request.Email))
                user.Email = request.Email;

            if (request.PhoneNumber != null)
                user.PhoneNumber = request.PhoneNumber;

            // Update role if the user is not a SubscriptionManager
            if (!string.IsNullOrEmpty(request.Role) && user.Role != "SubscriptionManager")
            {
                var validRoles = new[] { "User", "Auditor", "Manager" };
                if (!validRoles.Contains(request.Role))
                {
                    return BadRequest(new { message = "Invalid role" });
                }
                user.Role = request.Role;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "User updated successfully" });
        }

        [HttpPut("users/{userId}/role")]
        public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateRoleRequest request)
        {
            // Check if user is a SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return Forbid();
            }

            // Find user
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Prevent changing the role of a SubscriptionManager
            if (user.Role == "SubscriptionManager")
            {
                return BadRequest(new { message = "Cannot change the role of a Subscription Manager" });
            }

            // Validate role
            var validRoles = new[] { "User", "Auditor", "Manager" };
            if (!validRoles.Contains(request.Role))
            {
                return BadRequest(new { message = "Invalid role" });
            }

            // Update role
            user.Role = request.Role;
            await _context.SaveChangesAsync();

            return Ok(new { message = "User role updated successfully" });
        }

   [HttpDelete("users/{userId}")]
public async Task<IActionResult> DeleteUser(int userId)
{
    try
    {
        // Check if user is a SuperAdmin
        var userRole = HttpContext.Session.GetString("UserRole");
        if (userRole != "SuperAdmin")
        {
            return Forbid();
        }

        // Find user
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // Prevent deleting a SubscriptionManager
        if (user.Role == "SubscriptionManager")
        {
            return BadRequest(new { message = "Cannot delete a Subscription Manager" });
        }

        // --- UPDATED DELETION LOGIC ---

        // 1. Delete notifications for this user (notifications sent TO the user)
        var userNotifications = await _context.Notifications
                                            .Where(n => n.UserId == userId)
                                            .ToListAsync();
        _context.Notifications.RemoveRange(userNotifications);

        // 2. Find all actions where this user is responsible or created by this user
        var responsibleActions = await _context.Actions
                                                .Where(a => a.ResponsibleId == userId)
                                                .ToListAsync();

        var createdByActions = await _context.Actions
                                            .Where(a => a.CreatedById == userId)
                                            .ToListAsync();

        // Combine both lists and get unique actions
        var allUserActions = responsibleActions.Union(createdByActions).Distinct().ToList();

        // Delete notifications that reference these actions
        if (allUserActions.Any())
        {
            var actionIds = allUserActions.Select(a => a.ActionId).ToList();
            var actionNotifications = await _context.Notifications
                                                   .Where(n => n.RelatedActionId.HasValue && actionIds.Contains(n.RelatedActionId.Value))
                                                   .ToListAsync();
            _context.Notifications.RemoveRange(actionNotifications);
        }

        // Delete the actions
        _context.Actions.RemoveRange(allUserActions);

        // 3. Delete all Revue entities created by this user
        var revueRequirements = await _context.RevueRequirements
                                              .Where(rr => rr.CreatedById == userId)
                                              .ToListAsync();
        _context.RevueRequirements.RemoveRange(revueRequirements);

        var revueLegalTexts = await _context.RevueLegalTexts
                                           .Where(rlt => rlt.CreatedById == userId)
                                           .ToListAsync();
        _context.RevueLegalTexts.RemoveRange(revueLegalTexts);

        var revueActions = await _context.RevueActions
                                        .Where(ra => ra.CreatedById == userId)
                                        .ToListAsync();
        _context.RevueActions.RemoveRange(revueActions);

        var revueStakeholders = await _context.RevueStakeholders
                                             .Where(rs => rs.CreatedById == userId)
                                             .ToListAsync();
        _context.RevueStakeholders.RemoveRange(revueStakeholders);

        // 4. Finally, delete the user
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User deleted successfully" });
    }
    catch (Exception ex)
    {
        // Log the exception
        Console.WriteLine($"Error deleting user: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while deleting the user", details = ex.Message });
    }
}
[HttpGet("companies/detailed")]
public async Task<IActionResult> GetAllCompaniesDetailed()
{
    // Check if user is a SuperAdmin
    var userRole = HttpContext.Session.GetString("UserRole");
    if (userRole != "SuperAdmin")
    {
        return Forbid();
    }

    // Get all companies with detailed information
    var companies = await _context.Companies
        .Select(c => new
        {
            companyId = c.CompanyId,
            companyName = c.CompanyName,
            industry = c.Industry,
            status = c.Status,
            createdAt = c.CreatedAt,
            isEmailVerified = c.IsEmailVerified,
            totalUsers = c.Users.Count(),
            totalTexts = c.Texts.Count(),
            totalActions = c.Actions.Count(),
            subscriptionManagerName = c.Users
                .Where(u => u.Role == "SubscriptionManager")
                .Select(u => u.Name)
                .FirstOrDefault(),
            subscriptionManagerEmail = c.Users
                .Where(u => u.Role == "SubscriptionManager")
                .Select(u => u.Email)
                .FirstOrDefault()
        })
        .OrderByDescending(c => c.createdAt)
        .ToListAsync();

    return Ok(companies);
}

[HttpPut("companies/{companyId}")]
public async Task<IActionResult> UpdateCompany(int companyId, [FromBody] UpdateCompanyRequest request)
{
    // Check if user is a SuperAdmin
    var userRole = HttpContext.Session.GetString("UserRole");
    if (userRole != "SuperAdmin")
    {
        return Forbid();
    }

    // Find company
    var company = await _context.Companies.FindAsync(companyId);
    if (company == null)
    {
        return NotFound(new { message = "Company not found" });
    }

    // Validate request
    if (string.IsNullOrEmpty(request.CompanyName) || string.IsNullOrEmpty(request.Industry))
    {
        return BadRequest(new { message = "Company name and industry are required" });
    }

    // Check if status is valid
    var validStatuses = new[] { "Pending", "Approved", "Rejected" };
    if (!string.IsNullOrEmpty(request.Status) && !validStatuses.Contains(request.Status))
    {
        return BadRequest(new { message = "Invalid status" });
    }

    try
    {
        // Update company
        company.CompanyName = request.CompanyName.Trim();
        company.Industry = request.Industry.Trim();
        
        if (!string.IsNullOrEmpty(request.Status))
        {
            company.Status = request.Status;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            companyId = company.CompanyId,
            companyName = company.CompanyName,
            industry = company.Industry,
            status = company.Status,
            createdAt = company.CreatedAt,
            message = "Company updated successfully"
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Failed to update company" });
    }
}

       [HttpDelete("companies/{companyId}")]
public async Task<IActionResult> DeleteCompany(int companyId)
{
    try
    {
        // Check if user is a SuperAdmin
        var userRole = HttpContext.Session.GetString("UserRole");
        if (userRole != "SuperAdmin")
        {
            return Forbid();
        }

        // Find company
        var company = await _context.Companies.FindAsync(companyId);
        if (company == null)
        {
            return NotFound(new { message = "Company not found" });
        }

        // Get all users from this company
        var companyUserIds = await _context.Users
            .Where(u => u.CompanyId == companyId)
            .Select(u => u.UserId)
            .ToListAsync();

        // Get counts for reporting
        var userCount = companyUserIds.Count;
        var textCount = await _context.Texts.CountAsync(t => t.CompanyId == companyId);
        var actionCount = await _context.Actions.CountAsync(a => a.CompanyId == companyId);
        var subscriptionCount = await _context.CompanySubscriptions.CountAsync(cs => cs.CompanyId == companyId);
        var paymentCount = await _context.Payments.CountAsync(p => p.CompanyId == companyId);

        // --- MANUAL DELETION OF ENTITIES THAT REFERENCE USERS ---

        // 1. Delete all compliance evaluations and their related data
        var evaluationsToDelete = await _context.ComplianceEvaluations
            .Where(ce => companyUserIds.Contains(ce.UserId))
            .ToListAsync();

        var evaluationIds = evaluationsToDelete.Select(e => e.EvaluationId).ToList();

        // Delete evaluation-related entities first
        if (evaluationIds.Any())
        {
            // Delete observations
            var observations = await _context.Observations
                .Where(o => evaluationIds.Contains(o.EvaluationId))
                .ToListAsync();
            _context.Observations.RemoveRange(observations);

            // Delete monitoring parameters
            var monitoringParams = await _context.MonitoringParameters
                .Where(mp => evaluationIds.Contains(mp.EvaluationId))
                .ToListAsync();
            _context.MonitoringParameters.RemoveRange(monitoringParams);

            // Delete evaluation attachments
            var attachments = await _context.EvaluationAttachments
                .Where(ea => evaluationIds.Contains(ea.EvaluationId))
                .ToListAsync();
            _context.EvaluationAttachments.RemoveRange(attachments);

            // Delete evaluation history
            var history = await _context.EvaluationHistory
                .Where(eh => evaluationIds.Contains(eh.EvaluationId))
                .ToListAsync();
            _context.EvaluationHistory.RemoveRange(history);
        }

        // Delete the evaluations themselves
        _context.ComplianceEvaluations.RemoveRange(evaluationsToDelete);

        // 2. Delete all revue-related entities created by company users
        var revueRequirements = await _context.RevueRequirements
            .Where(rr => companyUserIds.Contains(rr.CreatedById))
            .ToListAsync();
        _context.RevueRequirements.RemoveRange(revueRequirements);

        var revueLegalTexts = await _context.RevueLegalTexts
            .Where(rlt => companyUserIds.Contains(rlt.CreatedById))
            .ToListAsync();
        _context.RevueLegalTexts.RemoveRange(revueLegalTexts);

        var revueActions = await _context.RevueActions
            .Where(ra => companyUserIds.Contains(ra.CreatedById))
            .ToListAsync();
        _context.RevueActions.RemoveRange(revueActions);

        var revueStakeholders = await _context.RevueStakeholders
            .Where(rs => companyUserIds.Contains(rs.CreatedById))
            .ToListAsync();
        _context.RevueStakeholders.RemoveRange(revueStakeholders);

        // 3. Delete revue de directions created by company users
        var revueDeDirections = await _context.RevueDeDirections
            .Where(r => companyUserIds.Contains(r.CreatedById))
            .ToListAsync();
        _context.RevueDeDirections.RemoveRange(revueDeDirections);

        // 4. Delete notifications for company users
        var notifications = await _context.Notifications
            .Where(n => companyUserIds.Contains(n.UserId))
            .ToListAsync();
        _context.Notifications.RemoveRange(notifications);

        // 5. Delete action-related notifications
        var actionNotifications = await _context.Notifications
            .Where(n => n.RelatedActionId.HasValue && 
                       _context.Actions.Any(a => a.ActionId == n.RelatedActionId.Value && a.CompanyId == companyId))
            .ToListAsync();
        _context.Notifications.RemoveRange(actionNotifications);

        // 6. Now delete the company (this will cascade to Users, Texts, Actions, CompanySubscriptions, Payments)
        _context.Companies.Remove(company);
        
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Company deleted successfully",
            deletedCounts = new
            {
                users = userCount,
                texts = textCount,
                actions = actionCount,
                subscriptions = subscriptionCount,
                payments = paymentCount,
                evaluations = evaluationsToDelete.Count,
                revues = revueDeDirections.Count,
                observations = evaluationIds.Any() ? await _context.Observations.CountAsync(o => evaluationIds.Contains(o.EvaluationId)) : 0,
                monitoringParameters = evaluationIds.Any() ? await _context.MonitoringParameters.CountAsync(mp => evaluationIds.Contains(mp.EvaluationId)) : 0
            }
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "An error occurred while deleting the company", details = ex.Message });
    }
}
public class UpdateCompanyRequest
{
    public string CompanyName { get; set; }
    public string Industry { get; set; }
    public string Status { get; set; }
}

        public class UpdateUserRequest
        {
            public string Name { get; set; }
            public string Email { get; set; }
            public string PhoneNumber { get; set; }
            public string Role { get; set; }
        }

        public class UpdateRoleRequest
        {
            public string Role { get; set; }
        }
    }
}