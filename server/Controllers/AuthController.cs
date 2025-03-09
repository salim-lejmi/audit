using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using System.Threading.Tasks;
using BCrypt.Net;

namespace server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuditDbContext _context;

        public AuthController(AuditDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Validate request
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Email and password are required" });
            }

            // Find user by email
            var user = await _context.Users
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Check if user is part of a company and if company is approved (except for SuperAdmin)
            if (user.Role != "SuperAdmin" && (user.Company == null || user.Company.Status != "Approved"))
            {
                return Unauthorized(new { message = "Your account is pending approval" });
            }

            // Store user info in session
            HttpContext.Session.SetInt32("UserId", user.UserId);
            HttpContext.Session.SetString("UserRole", user.Role);

            if (user.CompanyId.HasValue)
            {
                HttpContext.Session.SetInt32("CompanyId", user.CompanyId.Value);
            }

            // Return user info
            return Ok(new
            {
                userId = user.UserId,
                name = user.Name,
                email = user.Email,
                role = user.Role,
                companyId = user.CompanyId,
                companyName = user.Company?.CompanyName
            });
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupRequest request)
        {
            // Validate request
            if (string.IsNullOrEmpty(request.CompanyName) ||
                string.IsNullOrEmpty(request.ManagerName) ||
                string.IsNullOrEmpty(request.Email) ||
                string.IsNullOrEmpty(request.Password) ||
                string.IsNullOrEmpty(request.Industry))
            {
                return BadRequest(new { message = "All fields are required except phone number" });
            }

            // Check if email is already registered
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { message = "Email is already registered" });
            }

            // Create transaction
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Create company
                var company = new Company
                {
                    CompanyName = request.CompanyName,
                    Industry = request.Industry,
                    Status = "Pending",
                    CreatedAt = DateTime.Now
                };

                _context.Companies.Add(company);
                await _context.SaveChangesAsync();

                // Create subscription manager user
                var user = new User
                {
                    CompanyId = company.CompanyId,
                    Name = request.ManagerName,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber ?? "",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    Role = "SubscriptionManager",
                    CreatedAt = DateTime.Now
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new { message = "Signup successful. Your account is pending approval." });
            }
            catch
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred while processing your request" });
            }
        }

        [HttpGet("verify")]
        public IActionResult VerifyAuth()
        {
            // Check if user is authenticated
            var userId = HttpContext.Session.GetInt32("UserId");
            var userRole = HttpContext.Session.GetString("UserRole");

            if (!userId.HasValue || string.IsNullOrEmpty(userRole))
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            return Ok(new
            {
                userId = userId.Value,
                role = userRole
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // Clear session
            HttpContext.Session.Clear();
            return Ok(new { message = "Logged out successfully" });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class SignupRequest
    {
        public string CompanyName { get; set; }
        public string ManagerName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Industry { get; set; }
        public string Password { get; set; }
    }
}