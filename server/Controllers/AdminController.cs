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
    }
}