using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using System.Threading.Tasks;

namespace server.Controllers
{
    [ApiController]
    [Route("api/company")]
    public class CompanyController : ControllerBase
    {
        private readonly AuditDbContext _context;

        public CompanyController(AuditDbContext context)
        {
            _context = context;
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

            // Create user
            var user = new User
            {
                CompanyId = companyId.Value,
                Name = request.Name,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber ?? "",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
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

        // Delete user
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User deleted successfully" });
    }
    catch (Exception ex)
    {
        // Log the exception (in a real app, you'd use a proper logging mechanism)
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