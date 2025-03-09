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
    }
}