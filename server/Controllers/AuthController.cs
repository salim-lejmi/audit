using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using server.Data;
using server.Models;
using System.Security.Cryptography;

namespace server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : Controller
    {
        private readonly AuditDbContext _context;

        public AuthController(AuditDbContext context)
        {
            _context = context;
        }

        public IActionResult Login()
        {
            return View();
        }

        public IActionResult Signup()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Signup(string companyName, string managerName,
            string email, string phone, string industry, string password, string confirmPassword)
        {
            if (!ModelState.IsValid)
                return View();

            if (password != confirmPassword)
            {
                ModelState.AddModelError("", "Passwords do not match");
                return View();
            }

            // Check if company exists
            if (await _context.Companies.AnyAsync(c => c.CompanyName == companyName))
            {
                ModelState.AddModelError("", "Company name already exists");
                return View();
            }

            // Check if email exists
            if (await _context.Users.AnyAsync(u => u.Email == email))
            {
                ModelState.AddModelError("", "Email already exists");
                return View();
            }

            // Create company
            var company = new Company
            {
                CompanyName = companyName,
                Industry = industry,
                Status = "Pending"
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            // Hash password
            var salt = RandomNumberGenerator.GetBytes(128 / 8);
            var hashedPassword = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 100000,
                numBytesRequested: 256 / 8));

            // Create subscription manager
            var user = new User
            {
                CompanyId = company.CompanyId,
                Name = managerName,
                Email = email,
                PhoneNumber = phone,
                PasswordHash = hashedPassword,
                Role = "SubscriptionManager"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "Signup successful. Awaiting admin approval.";
            return RedirectToAction("Login");
        }

        [HttpPost]
        public async Task<IActionResult> Login(string email, string password)
        {
            var user = await _context.Users
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                ModelState.AddModelError("", "Invalid credentials");
                return View();
            }

            // Verify password
            var hashedPassword = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: password,
                salt: Convert.FromBase64String(user.PasswordHash.Split('.')[0]),
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 100000,
                numBytesRequested: 256 / 8));

            if (hashedPassword != user.PasswordHash.Split('.')[1])
            {
                ModelState.AddModelError("", "Invalid credentials");
                return View();
            }

            // Set session
            HttpContext.Session.SetInt32("UserId", user.UserId);
            HttpContext.Session.SetString("UserRole", user.Role);
            HttpContext.Session.SetString("UserName", user.Name);

            if (user.CompanyId.HasValue)
            {
                HttpContext.Session.SetInt32("CompanyId", user.CompanyId.Value);
                HttpContext.Session.SetString("CompanyName", user.Company.CompanyName);
            }

            return RedirectToAction("Index", "Home");
        }

        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Login");
        }
    }
}
