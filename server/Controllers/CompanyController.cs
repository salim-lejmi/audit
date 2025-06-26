using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using server.Services;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace server.Controllers
{
    [ApiController]
    [Route("api/company")]
    public class CompanyController : ControllerBase
    {
        private readonly AuditDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

       public CompanyController(AuditDbContext context, IEmailService emailService, IConfiguration configuration)
{
    _context = context;
    _emailService = emailService;
    _configuration = configuration;
}


        [HttpGet("dashboard-info")]
        public async Task<IActionResult> GetDashboardInfo()
        {
            // Check if user is a SubscriptionManager
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SubscriptionManager")
            {
                return Forbid();
            }

            // Get companyId from session
            var companyId = HttpContext.Session.GetInt32("CompanyId");
            if (!companyId.HasValue)
            {
                return BadRequest(new { message = "Invalid company ID" });
            }

            // Get company information
            var company = await _context.Companies.FindAsync(companyId.Value);
            if (company == null)
            {
                return NotFound(new { message = "Company not found" });
            }

            // Get total users for the company
            var totalUsers = await _context.Users
                .CountAsync(u => u.CompanyId == companyId);

            return Ok(new
            {
                companyName = company.CompanyName,
                industry = company.Industry,
                totalUsers = totalUsers,
                status = company.Status,
                createdAt = company.CreatedAt
            });
        }

        [HttpGet("user-dashboard-info")]
        public async Task<IActionResult> GetUserDashboardInfo()
        {
            // Check authentication
            var userId = HttpContext.Session.GetInt32("UserId");
            var companyId = HttpContext.Session.GetInt32("CompanyId");
            
            if (!userId.HasValue || !companyId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Get user information
            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Get company information
            var company = await _context.Companies.FindAsync(companyId.Value);
            if (company == null)
            {
                return NotFound(new { message = "Company not found" });
            }

            var assignedActionsCount = await _context.Actions
                .CountAsync(a => a.ResponsibleId == userId.Value);

            var completedActionsCount = await _context.Actions
                .CountAsync(a => a.ResponsibleId == userId.Value && a.Progress == 100);

            var pendingEvaluationsCount = await _context.ComplianceEvaluations
                .CountAsync(ce => ce.UserId == userId.Value && ce.Status == "à vérifier");

            return Ok(new
            {
                userName = user.Name,
                role = user.Role,
                companyName = company.CompanyName,
                industry = company.Industry,
                status = company.Status,
                assignedActions = assignedActionsCount,
                completedActions = completedActionsCount,
                pendingEvaluations = pendingEvaluationsCount,
                createdAt = company.CreatedAt
            });
        }
        [HttpGet("users")]
        public async Task<IActionResult> GetCompanyUsers()
        {
            // Check if user is a SubscriptionManager
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SubscriptionManager")
            {
                return Forbid();
            }

            // Get companyId from session
            var companyId = HttpContext.Session.GetInt32("CompanyId");
            if (!companyId.HasValue)
            {
                return BadRequest(new { message = "Invalid company ID" });
            }

            // Get users for the company
            var users = await _context.Users
                .Where(u => u.CompanyId == companyId)
                .Select(u => new
                {
                    userId = u.UserId,
                    name = u.Name,
                    email = u.Email,
                    role = u.Role,
                    phoneNumber = u.PhoneNumber,
                    createdAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

[HttpPost("users")]
public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
{
    // Check if user is a SubscriptionManager
    var userRole = HttpContext.Session.GetString("UserRole");
    if (userRole != "SubscriptionManager")
    {
        return Forbid();
    }

    // Get companyId from session
    var companyId = HttpContext.Session.GetInt32("CompanyId");
    if (!companyId.HasValue)
    {
        return BadRequest(new { message = "Invalid company ID" });
    }

    // Check subscription limits
    var subscriptionService = HttpContext.RequestServices.GetRequiredService<ISubscriptionService>();
    if (!await subscriptionService.CanCreateUser(companyId.Value))
    {
        return BadRequest(new { message = "User limit reached for your subscription plan. Please upgrade to add more users." });
    }
    // Validate request
    if (string.IsNullOrEmpty(request.Name) ||
        string.IsNullOrEmpty(request.Email) ||
        string.IsNullOrEmpty(request.Password) ||
        string.IsNullOrEmpty(request.Role))
    {
        return BadRequest(new { message = "All fields are required" });
    }

    // Check if email is already registered
    if (await _context.Users.AnyAsync(u => u.Email == request.Email))
    {
        return BadRequest(new { message = "Email is already registered" });
    }

    // Check if role is valid
    var validRoles = new[] { "User", "Auditor", "Manager" };
    if (!validRoles.Contains(request.Role))
    {
        return BadRequest(new { message = "Invalid role" });
    }

    try
    {
        // Generate verification token
        var verificationToken = GenerateEmailVerificationToken();
        var tokenExpiry = DateTime.Now.AddHours(24);

        // Create user with pending status
        var user = new User
        {
            CompanyId = companyId.Value,
            Name = request.Name,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber ?? "",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            CreatedAt = null, // Will be set when email is verified
            IsEmailVerified = false,
            EmailVerificationToken = verificationToken,
            EmailVerificationTokenExpiry = tokenExpiry,
            Status = "Pending"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Send verification email
        var baseUrl = _configuration["App:BaseUrl"];
        var verificationLink = $"{baseUrl}/verify-email?token={verificationToken}&type=user";
        
        await _emailService.SendUserWelcomeEmailAsync(request.Email, request.Name, verificationLink);

        return Ok(new
        {
            userId = user.UserId,
            name = user.Name,
            email = user.Email,
            phoneNumber = user.PhoneNumber,
            role = user.Role,
            status = user.Status,
            createdAt = user.CreatedAt,
            message = "User created successfully. Verification email sent."
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Failed to create user and send verification email" });
    }
}

private string GenerateEmailVerificationToken()
{
    using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
    var bytes = new byte[32];
    rng.GetBytes(bytes);
    return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
}
        [HttpPut("users/{userId}")]
        public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserRequest request)
        {
            // Check if user is a SubscriptionManager
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SubscriptionManager")
            {
                return Forbid();
            }

            // Get companyId from session
            var companyId = HttpContext.Session.GetInt32("CompanyId");
            if (!companyId.HasValue)
            {
                return BadRequest(new { message = "Invalid company ID" });
            }

            // Find user
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId && u.CompanyId == companyId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Check if trying to update the SubscriptionManager role
            if (user.Role == "SubscriptionManager" && request.Role != "SubscriptionManager")
            {
                return BadRequest(new { message = "Cannot change the role of the Subscription Manager" });
            }

            // Check if role is valid
            if (!string.IsNullOrEmpty(request.Role))
            {
                var validRoles = new[] { "User", "Auditor", "Manager", "SubscriptionManager" };
                if (!validRoles.Contains(request.Role))
                {
                    return BadRequest(new { message = "Invalid role" });
                }
                user.Role = request.Role;
            }

            // Update user
            if (!string.IsNullOrEmpty(request.Name))
                user.Name = request.Name;

            if (!string.IsNullOrEmpty(request.Email))
                user.Email = request.Email;

            if (!string.IsNullOrEmpty(request.PhoneNumber))
                user.PhoneNumber = request.PhoneNumber;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                userId = user.UserId,
                name = user.Name,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                role = user.Role,
                createdAt = user.CreatedAt
            });
        }

        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            try
            {
                // Check if user is a SubscriptionManager
                var userRole = HttpContext.Session.GetString("UserRole");
                if (userRole != "SubscriptionManager")
                {
                    return Forbid();
                }

                // Get companyId from session
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                if (!companyId.HasValue)
                {
                    return BadRequest(new { message = "Invalid company ID" });
                }

                // Find user
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId && u.CompanyId == companyId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Prevent deleting the SubscriptionManager
                if (user.Role == "SubscriptionManager")
                {
                    return BadRequest(new { message = "Cannot delete the Subscription Manager" });
                }

                // --- UPDATED DELETION LOGIC ---

                // First, delete notifications for this user (notifications sent TO the user)
                var userNotifications = await _context.Notifications
                                                    .Where(n => n.UserId == userId)
                                                    .ToListAsync();
                _context.Notifications.RemoveRange(userNotifications);

                // Find all actions where this user is responsible or created by this user
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

                // Now delete the actions
                _context.Actions.RemoveRange(allUserActions);

                // Finally, delete the user
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
        [HttpPut("users/{userId}/role")]
        public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateRoleRequest request)
        {
            // Check if user is a SubscriptionManager
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SubscriptionManager")
            {
                return Forbid();
            }

            // Get companyId from session
            var companyId = HttpContext.Session.GetInt32("CompanyId");
            if (!companyId.HasValue)
            {
                return BadRequest(new { message = "Invalid company ID" });
            }

            // Find user
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId && u.CompanyId == companyId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Prevent changing the role of the SubscriptionManager
            if (user.Role == "SubscriptionManager")
            {
                return BadRequest(new { message = "Cannot change the role of the Subscription Manager" });
            }

            // Check if role is valid
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
     

[HttpGet("settings")]
public async Task<IActionResult> GetCompanySettings()
{
    // Check if user is a SubscriptionManager
    var userRole = HttpContext.Session.GetString("UserRole");
    if (userRole != "SubscriptionManager")
    {
        return Forbid();
    }

    // Get companyId from session
    var companyId = HttpContext.Session.GetInt32("CompanyId");
    if (!companyId.HasValue)
    {
        return BadRequest(new { message = "Invalid company ID" });
    }

    // Get company information
    var company = await _context.Companies.FindAsync(companyId.Value);
    if (company == null)
    {
        return NotFound(new { message = "Company not found" });
    }

    return Ok(new
    {
        companyId = company.CompanyId,
        companyName = company.CompanyName,
        industry = company.Industry,
        status = company.Status,
        createdAt = company.CreatedAt
    });
}

[HttpPut("settings")]
public async Task<IActionResult> UpdateCompanySettings([FromBody] UpdateCompanySettingsRequest request)
{
    // Check if user is a SubscriptionManager
    var userRole = HttpContext.Session.GetString("UserRole");
    if (userRole != "SubscriptionManager")
    {
        return Forbid();
    }

    // Get companyId from session
    var companyId = HttpContext.Session.GetInt32("CompanyId");
    if (!companyId.HasValue)
    {
        return BadRequest(new { message = "Invalid company ID" });
    }

    // Validate request
    if (string.IsNullOrEmpty(request.CompanyName) || string.IsNullOrEmpty(request.Industry))
    {
        return BadRequest(new { message = "Company name and industry are required" });
    }

    try
    {
        // Find and update company
        var company = await _context.Companies.FindAsync(companyId.Value);
        if (company == null)
        {
            return NotFound(new { message = "Company not found" });
        }

        company.CompanyName = request.CompanyName.Trim();
        company.Industry = request.Industry.Trim();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            companyId = company.CompanyId,
            companyName = company.CompanyName,
            industry = company.Industry,
            status = company.Status,
            createdAt = company.CreatedAt
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Failed to update company settings" });
    }
}

public class UpdateCompanySettingsRequest
{
    public string CompanyName { get; set; }
    public string Industry { get; set; }
}

        public class CreateUserRequest
        {
            public string Name { get; set; }
            public string Email { get; set; }
            public string PhoneNumber { get; set; }
            public string Password { get; set; }
            public string Role { get; set; }
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