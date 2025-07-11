using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using System.Threading.Tasks;
using BCrypt.Net;

namespace server.Controllers
{
    [ApiController]
    [Route("api/profile")]
    public class ProfileController : ControllerBase
    {
        private readonly AuditDbContext _context;

        public ProfileController(AuditDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            // Get user ID from session
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Find user by ID
            var user = await _context.Users
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.UserId == userId.Value);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Return user profile data
            return Ok(new
            {
                userId = user.UserId,
                name = user.Name,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                role = user.Role,
                companyId = user.CompanyId,
                companyName = user.Company?.CompanyName
            });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            // Get user ID from session
            var userId = HttpContext.Session.GetInt32("UserId");
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Find user by ID
            var user = await _context.Users
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.UserId == userId.Value);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Update user fields
            user.Name = request.Name ?? user.Name;
            user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;

            // Verify old password and update password if provided
            if (!string.IsNullOrEmpty(request.OldPassword) && !string.IsNullOrEmpty(request.NewPassword))
            {
                // Verify old password
                if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
                {
                    return BadRequest(new { message = "Current password is incorrect" });
                }
                
                // Update to new password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            }

            // Update company name only for SubscriptionManager
            if (user.Role == "SubscriptionManager" && user.Company != null && !string.IsNullOrEmpty(request.CompanyName))
            {
                user.Company.CompanyName = request.CompanyName;
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Profile updated successfully" });
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, new { message = "An error occurred while updating your profile" });
            }
        }
    }

    public class UpdateProfileRequest
    {
        public string? Name { get; set; }
        public string? PhoneNumber { get; set; }
        
        // Password change fields
        public string? OldPassword { get; set; }
        public string? NewPassword { get; set; }
        
        // Company name only for SubscriptionManager - make it nullable
        public string? CompanyName { get; set; }
    }
}