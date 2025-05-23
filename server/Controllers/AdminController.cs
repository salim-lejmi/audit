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

            // Delete user
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully" });
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