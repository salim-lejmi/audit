using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using server.Services;
using System.Threading.Tasks;
using BCrypt.Net;
using System.Security.Cryptography;
using System.Text;

namespace server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuditDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public AuthController(AuditDbContext context, IEmailService emailService, IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
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

            // Check if email is verified
            if (!user.IsEmailVerified)
            {
                return Unauthorized(new { message = "Please verify your email address before logging in" });
            }

            // Check if user status is active
            if (user.Status != "Active")
            {
                return Unauthorized(new { message = "Your account is pending activation" });
            }

            // Check if user is part of a company and if company is approved (except for SuperAdmin)
            if (user.Role != "SuperAdmin" && (user.Company == null || user.Company.Status != "Approved"))
            {
                return Unauthorized(new { message = "Your company is pending approval" });
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
                // Generate verification token
                var verificationToken = GenerateEmailVerificationToken();
                var tokenExpiry = DateTime.Now.AddHours(24); // Token expires in 24 hours

                // Create company (not approved yet)
                var company = new Company
                {
                    CompanyName = request.CompanyName,
                    Industry = request.Industry,
                    Status = "Pending", // Will stay pending until email is verified
                    CreatedAt = DateTime.Now,
                    IsEmailVerified = false
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
                var verificationLink = $"{baseUrl}/verify-email?token={verificationToken}&type=signup";
                
                await _emailService.SendEmailVerificationAsync(request.Email, request.ManagerName, verificationLink);

                await transaction.CommitAsync();

                return Ok(new { 
                    message = "Signup successful. Please check your email and click the verification link to complete your registration." 
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred while processing your request" });
            }
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
        {
            if (string.IsNullOrEmpty(request.Token))
            {
                return BadRequest(new { message = "Verification token is required" });
            }

            var user = await _context.Users
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.EmailVerificationToken == request.Token);

            if (user == null)
            {
                return BadRequest(new { message = "Invalid verification token" });
            }

            if (user.EmailVerificationTokenExpiry < DateTime.Now)
            {
                return BadRequest(new { message = "Verification token has expired" });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Mark email as verified
                user.IsEmailVerified = true;
                user.EmailVerificationToken = null;
                user.EmailVerificationTokenExpiry = null;

                if (request.Type == "signup")
                {
                    // For subscription manager signup - now send request to admin
                    user.CreatedAt = DateTime.Now;
                    user.Status = "Active"; // SubscriptionManager becomes active immediately after email verification
                    
                    // Company email verification status
                    if (user.Company != null)
                    {
                        user.Company.IsEmailVerified = true;
                    }
                }
                else if (request.Type == "user")
                {
                    // For regular user - activate immediately
                    user.CreatedAt = DateTime.Now;
                    user.Status = "Active";
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var message = request.Type == "signup" 
                    ? "Email verified successfully! Your company registration has been sent for admin approval."
                    : "Email verified successfully! You can now log in to your account.";

                return Ok(new { message });
            }
            catch
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred while verifying email" });
            }
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
        {
            if (string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { message = "Email is required" });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsEmailVerified);

            if (user == null)
            {
                return BadRequest(new { message = "User not found or email already verified" });
            }

            try
            {
                // Generate new verification token
                var verificationToken = GenerateEmailVerificationToken();
                var tokenExpiry = DateTime.Now.AddHours(24);

                user.EmailVerificationToken = verificationToken;
                user.EmailVerificationTokenExpiry = tokenExpiry;

                await _context.SaveChangesAsync();

                // Send verification email
                var baseUrl = _configuration["App:BaseUrl"];
                var type = user.Role == "SubscriptionManager" ? "signup" : "user";
                var verificationLink = $"{baseUrl}/verify-email?token={verificationToken}&type={type}";

                if (user.Role == "SubscriptionManager")
                {
                    await _emailService.SendEmailVerificationAsync(user.Email, user.Name, verificationLink);
                }
                else
                {
                    await _emailService.SendUserWelcomeEmailAsync(user.Email, user.Name, verificationLink);
                }

                return Ok(new { message = "Verification email sent successfully" });
            }
            catch
            {
                return StatusCode(500, new { message = "Failed to send verification email" });
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

        private string GenerateEmailVerificationToken()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[32];
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
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

        public class VerifyEmailRequest
        {
            public string Token { get; set; }
            public string Type { get; set; } // "signup" or "user"
        }

        public class ResendVerificationRequest
        {
            public string Email { get; set; }
        }
    }
}