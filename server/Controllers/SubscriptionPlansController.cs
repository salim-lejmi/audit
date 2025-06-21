using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using System.Text.Json;

namespace server.Controllers
{
    [ApiController]
    [Route("api/subscription-plans")]
    public class SubscriptionPlansController : ControllerBase
    {
        private readonly AuditDbContext _context;

        public SubscriptionPlansController(AuditDbContext context)
        {
            _context = context;
        }

        // GET: api/subscription-plans
        [HttpGet]
        public async Task<IActionResult> GetSubscriptionPlans()
        {
            // Check if user is SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return StatusCode(403, new { message = "Access denied. Super Admin only." });
            }

            try
            {
                var plans = await _context.SubscriptionPlans
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();

                var planResponses = plans.Select(p => new
                {
                    planId = p.PlanId,
                    name = p.Name,
                    description = p.Description,
                    basePrice = p.BasePrice,
                    userLimit = p.UserLimit,
                    discount = p.Discount,
                    taxRate = p.TaxRate,
                    features = string.IsNullOrEmpty(p.Features) ? new string[0] : JsonSerializer.Deserialize<string[]>(p.Features),
                    isActive = p.IsActive,
                    createdAt = p.CreatedAt,
                    updatedAt = p.UpdatedAt
                }).ToList();

                return Ok(planResponses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve subscription plans", error = ex.Message });
            }
        }

        // GET: api/subscription-plans/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSubscriptionPlan(int id)
        {
            // Check if user is SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return StatusCode(403, new { message = "Access denied. Super Admin only." });
            }

            var plan = await _context.SubscriptionPlans.FindAsync(id);
            if (plan == null)
            {
                return NotFound(new { message = "Subscription plan not found" });
            }

            return Ok(new
            {
                planId = plan.PlanId,
                name = plan.Name,
                description = plan.Description,
                basePrice = plan.BasePrice,
                userLimit = plan.UserLimit,
                discount = plan.Discount,
                taxRate = plan.TaxRate,
                features = string.IsNullOrEmpty(plan.Features) ? new string[0] : JsonSerializer.Deserialize<string[]>(plan.Features),
                isActive = plan.IsActive,
                createdAt = plan.CreatedAt,
                updatedAt = plan.UpdatedAt
            });
        }

        // POST: api/subscription-plans
        [HttpPost]
        public async Task<IActionResult> CreateSubscriptionPlan([FromBody] CreateSubscriptionPlanRequest request)
        {
            // Check if user is SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return StatusCode(403, new { message = "Access denied. Super Admin only." });
            }

            // Validate request
            if (string.IsNullOrEmpty(request.Name) || request.BasePrice < 0 || request.UserLimit < 1)
            {
                return BadRequest(new { message = "Invalid plan data" });
            }

            try
            {
                var plan = new SubscriptionPlan
                {
                    Name = request.Name,
                    Description = request.Description ?? "",
                    BasePrice = request.BasePrice,
                    UserLimit = request.UserLimit,
                    Discount = Math.Max(0, Math.Min(100, request.Discount)), // Clamp between 0-100
                    TaxRate = Math.Max(0, request.TaxRate),
                    Features = JsonSerializer.Serialize(request.Features ?? new string[0]),
                    IsActive = request.IsActive,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.SubscriptionPlans.Add(plan);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    planId = plan.PlanId,
                    name = plan.Name,
                    description = plan.Description,
                    basePrice = plan.BasePrice,
                    userLimit = plan.UserLimit,
                    discount = plan.Discount,
                    taxRate = plan.TaxRate,
                    features = request.Features ?? new string[0],
                    isActive = plan.IsActive,
                    createdAt = plan.CreatedAt,
                    updatedAt = plan.UpdatedAt,
                    message = "Subscription plan created successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to create subscription plan", error = ex.Message });
            }
        }

        // PUT: api/subscription-plans/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSubscriptionPlan(int id, [FromBody] UpdateSubscriptionPlanRequest request)
        {
            // Check if user is SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return StatusCode(403, new { message = "Access denied. Super Admin only." });
            }

            var plan = await _context.SubscriptionPlans.FindAsync(id);
            if (plan == null)
            {
                return NotFound(new { message = "Subscription plan not found" });
            }

            try
            {
                // Update fields if provided
                if (!string.IsNullOrEmpty(request.Name))
                    plan.Name = request.Name;
                
                if (request.Description != null)
                    plan.Description = request.Description;
                
                if (request.BasePrice.HasValue && request.BasePrice >= 0)
                    plan.BasePrice = request.BasePrice.Value;
                
                if (request.UserLimit.HasValue && request.UserLimit > 0)
                    plan.UserLimit = request.UserLimit.Value;
                
                if (request.Discount.HasValue)
                    plan.Discount = Math.Max(0, Math.Min(100, request.Discount.Value));
                
                if (request.TaxRate.HasValue && request.TaxRate >= 0)
                    plan.TaxRate = request.TaxRate.Value;
                
                if (request.Features != null)
                    plan.Features = JsonSerializer.Serialize(request.Features);
                
                if (request.IsActive.HasValue)
                    plan.IsActive = request.IsActive.Value;

                plan.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    planId = plan.PlanId,
                    name = plan.Name,
                    description = plan.Description,
                    basePrice = plan.BasePrice,
                    userLimit = plan.UserLimit,
                    discount = plan.Discount,
                    taxRate = plan.TaxRate,
                    features = string.IsNullOrEmpty(plan.Features) ? new string[0] : JsonSerializer.Deserialize<string[]>(plan.Features),
                    isActive = plan.IsActive,
                    createdAt = plan.CreatedAt,
                    updatedAt = plan.UpdatedAt,
                    message = "Subscription plan updated successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update subscription plan", error = ex.Message });
            }
        }

        // DELETE: api/subscription-plans/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubscriptionPlan(int id)
        {
            // Check if user is SuperAdmin
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SuperAdmin")
            {
                return StatusCode(403, new { message = "Access denied. Super Admin only." });
            }

            var plan = await _context.SubscriptionPlans.FindAsync(id);
            if (plan == null)
            {
                return NotFound(new { message = "Subscription plan not found" });
            }

            try
            {
                _context.SubscriptionPlans.Remove(plan);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Subscription plan deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to delete subscription plan", error = ex.Message });
            }
        }

        public class CreateSubscriptionPlanRequest
        {
            public string Name { get; set; }
            public string Description { get; set; }
            public decimal BasePrice { get; set; }
            public int UserLimit { get; set; }
            public decimal Discount { get; set; } = 0;
            public decimal TaxRate { get; set; } = 20;
            public string[] Features { get; set; }
            public bool IsActive { get; set; } = true;
        }

        public class UpdateSubscriptionPlanRequest
        {
            public string Name { get; set; }
            public string Description { get; set; }
            public decimal? BasePrice { get; set; }
            public int? UserLimit { get; set; }
            public decimal? Discount { get; set; }
            public decimal? TaxRate { get; set; }
            public string[] Features { get; set; }
            public bool? IsActive { get; set; }
        }
    }
}