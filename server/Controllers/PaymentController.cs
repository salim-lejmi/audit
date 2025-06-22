using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using Stripe;
using Stripe.Checkout;
using System.Text.Json;

namespace server.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly AuditDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(AuditDbContext context, IConfiguration configuration, ILogger<PaymentsController> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
        }

        // GET: api/payments/company-subscription
[HttpGet("company-subscription")]
public async Task<IActionResult> GetCompanySubscription()
{
    // Remove the role restriction - any authenticated user should be able to check company subscription
    var companyId = HttpContext.Session.GetInt32("CompanyId");
    if (!companyId.HasValue)
    {
        return BadRequest(new { message = "Invalid company ID" });
    }

    // Optional: Add authentication check if needed
    var userId = HttpContext.Session.GetInt32("UserId");
    if (!userId.HasValue)
    {
        return StatusCode(401, new { message = "User not authenticated" });
    }

    try
    {
        var subscription = await _context.CompanySubscriptions
            .Include(s => s.Plan)
            .Include(s => s.Company)
            .Where(s => s.CompanyId == companyId.Value && s.Status == "active" && s.EndDate > DateTime.Now)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

        if (subscription == null)
        {
            return Ok(new { hasSubscription = false });
        }

        var features = string.IsNullOrEmpty(subscription.Plan.Features) 
            ? new string[0] 
            : JsonSerializer.Deserialize<string[]>(subscription.Plan.Features);

        return Ok(new
        {
            hasSubscription = true,
            subscription = new
            {
                subscriptionId = subscription.SubscriptionId,
                planName = subscription.Plan.Name,
                planId = subscription.PlanId,
                status = subscription.Status,
                startDate = subscription.StartDate,
                endDate = subscription.EndDate,
                userLimit = subscription.Plan.UserLimit,
                features = features
            }
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to retrieve subscription for company {CompanyId}", companyId);
        return StatusCode(500, new { message = "Failed to retrieve subscription", error = ex.Message });
    }
}
        // POST: api/payments/create-checkout-session
        [HttpPost("create-checkout-session")]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] CreatePaymentRequest request)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SubscriptionManager")
            {
                return StatusCode(403, new { message = "Access denied. Subscription Manager only." });
            }

            var companyId = HttpContext.Session.GetInt32("CompanyId");
            if (!companyId.HasValue)
            {
                return BadRequest(new { message = "Invalid company ID" });
            }

            try
            {
                var plan = await _context.SubscriptionPlans.FindAsync(request.PlanId);
                if (plan == null || !plan.IsActive)
                {
                    return BadRequest(new { message = "Invalid or inactive subscription plan" });
                }

                var company = await _context.Companies.FindAsync(companyId.Value);
                if (company == null)
                {
                    return BadRequest(new { message = "Company not found" });
                }

                // Calculate pricing
                var discountedPrice = plan.BasePrice * (1 - plan.Discount / 100);
                var taxAmount = discountedPrice * (plan.TaxRate / 100);
                var finalPrice = discountedPrice + taxAmount;

                var options = new SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string> { "card" },
                    LineItems = new List<SessionLineItemOptions>
                    {
                        new SessionLineItemOptions
                        {
                            PriceData = new SessionLineItemPriceDataOptions
                            {
                                UnitAmount = (long)(finalPrice * 100), // Stripe uses cents
                                Currency = "usd",
                                ProductData = new SessionLineItemPriceDataProductDataOptions
                                {
                                    Name = plan.Name,
                                    Description = $"Subscription for {company.CompanyName} - {plan.Description}",
                                },
                            },
                            Quantity = 1,
                        },
                    },
                    Mode = "payment",
                    SuccessUrl = $"{_configuration["App:BaseUrl"]}/company/payments?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
                    CancelUrl = $"{_configuration["App:BaseUrl"]}/company/payments?payment=canceled",
                    Metadata = new Dictionary<string, string>
                    {
                        { "company_id", companyId.Value.ToString() },
                        { "plan_id", request.PlanId.ToString() },
                        { "plan_name", plan.Name },
                        { "company_name", company.CompanyName }
                    }
                };

                var service = new SessionService();
                var session = await service.CreateAsync(options);

                // Create payment record
                var payment = new Payment
                {
                    CompanyId = companyId.Value,
                    PlanId = request.PlanId,
                    StripeSessionId = session.Id,
                    StripePaymentIntentId = session.PaymentIntentId ?? "",
                    Amount = finalPrice,
                    Status = "pending",
                    Description = $"Subscription payment for {plan.Name}",
                    ExpiresAt = DateTime.Now.AddHours(24)
                };

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created checkout session {SessionId} for company {CompanyId}", session.Id, companyId);

                return Ok(new { sessionId = session.Id, url = session.Url });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create checkout session for company {CompanyId}", companyId);
                return StatusCode(500, new { message = "Failed to create checkout session", error = ex.Message });
            }
        }

        // POST: api/payments/webhook
        [HttpPost("webhook")]
        public async Task<IActionResult> HandleWebhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            
            try
            {
                var stripeEvent = EventUtility.ConstructEvent(json,
                    Request.Headers["Stripe-Signature"], _configuration["Stripe:WebhookSecret"]);

                _logger.LogInformation("Received Stripe webhook: {EventType}", stripeEvent.Type);

                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Session;
                    await HandleSuccessfulPayment(session);
                }

                return Ok();
            }
            catch (StripeException e)
            {
                _logger.LogError(e, "Stripe webhook signature verification failed");
                return BadRequest();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing webhook");
                return StatusCode(500);
            }
        }

        // GET: api/payments/verify-session/{sessionId}
        [HttpGet("verify-session/{sessionId}")]
        public async Task<IActionResult> VerifySession(string sessionId)
        {
            var userRole = HttpContext.Session.GetString("UserRole");
            if (userRole != "SubscriptionManager")
            {
                return StatusCode(403, new { message = "Access denied. Subscription Manager only." });
            }

            try
            {
                _logger.LogInformation("Verifying session: {SessionId}", sessionId);

                var service = new SessionService();
                var session = await service.GetAsync(sessionId);

                _logger.LogInformation("Session {SessionId} status: {PaymentStatus}", sessionId, session.PaymentStatus);

                if (session.PaymentStatus == "paid")
                {
                    await HandleSuccessfulPayment(session);
                    return Ok(new { success = true, message = "Payment verified and subscription activated" });
                }

                return Ok(new { success = false, message = "Payment not completed" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to verify payment for session {SessionId}", sessionId);
                return StatusCode(500, new { message = "Failed to verify payment", error = ex.Message });
            }
        }

        private async Task HandleSuccessfulPayment(Session session)
        {
            try
            {
                _logger.LogInformation("Processing successful payment for session {SessionId}", session.Id);

                var companyIdStr = session.Metadata.GetValueOrDefault("company_id");
                var planIdStr = session.Metadata.GetValueOrDefault("plan_id");

                if (string.IsNullOrEmpty(companyIdStr) || string.IsNullOrEmpty(planIdStr))
                {
                    _logger.LogError("Missing metadata in session {SessionId}", session.Id);
                    return;
                }

                if (!int.TryParse(companyIdStr, out int companyId) || !int.TryParse(planIdStr, out int planId))
                {
                    _logger.LogError("Invalid metadata format in session {SessionId}: companyId={CompanyId}, planId={PlanId}", 
                        session.Id, companyIdStr, planIdStr);
                    return;
                }

                // Check if subscription already exists to avoid duplicate processing
                var existingSubscription = await _context.CompanySubscriptions
                    .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.Status == "active" && 
                                            s.CreatedAt > DateTime.Now.AddMinutes(-5)); // Within last 5 minutes

                if (existingSubscription != null)
                {
                    _logger.LogInformation("Subscription already exists for company {CompanyId}, skipping duplicate processing", companyId);
                    return;
                }

                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // Update payment status
                    var payment = await _context.Payments
                        .FirstOrDefaultAsync(p => p.StripeSessionId == session.Id);
                    
                    if (payment != null)
                    {
                        payment.Status = "succeeded";
                        payment.PaidAt = DateTime.Now;
                        payment.StripePaymentIntentId = session.PaymentIntentId ?? payment.StripePaymentIntentId;
                        _logger.LogInformation("Updated payment {PaymentId} status to succeeded", payment.PaymentId);
                    }

                    // Cancel existing active subscriptions
                    var existingSubscriptions = await _context.CompanySubscriptions
                        .Where(s => s.CompanyId == companyId && s.Status == "active")
                        .ToListAsync();

                    foreach (var existingSub in existingSubscriptions)
                    {
                        existingSub.Status = "canceled";
                        existingSub.CanceledAt = DateTime.Now;
                        _logger.LogInformation("Canceled existing subscription {SubscriptionId}", existingSub.SubscriptionId);
                    }

                    // Create new subscription
                    var newSubscription = new CompanySubscription
                    {
                        CompanyId = companyId,
                        PlanId = planId,
                        Status = "active",
                        StartDate = DateTime.Now,
                        EndDate = DateTime.Now.AddMonths(1) // 1 month subscription
                    };

                    _context.CompanySubscriptions.Add(newSubscription);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation("Created new subscription for company {CompanyId} with plan {PlanId}", companyId, planId);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Failed to process subscription for session {SessionId}", session.Id);
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in HandleSuccessfulPayment for session {SessionId}", session.Id);
                throw;
            }
        }

        public class CreatePaymentRequest
        {
            public int PlanId { get; set; }
        }
    }
}