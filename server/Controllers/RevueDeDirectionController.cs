    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using server.Data;
    using server.Models;
    using System;
    using System.Linq;
    using System.Threading.Tasks;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using System.IO;

using iText.Kernel.Font;
using iText.IO.Font.Constants;
    namespace server.Controllers
    {
        [ApiController]
        [Route("api/revue")]
        public class RevueDeDirectionController : ControllerBase
        {
            private readonly AuditDbContext _context;

            public RevueDeDirectionController(AuditDbContext context)
            {
                _context = context;
            }

            // GET: api/revue
            [HttpGet]
            public async Task<IActionResult> GetReviews([FromQuery] int? domainId, [FromQuery] DateTime? lastReviewDate)
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                IQueryable<RevueDeDirection> query = _context.RevueDeDirections
                    .Include(r => r.Domain)
                    .Where(r => r.CompanyId == companyId.Value);

                if (domainId.HasValue)
                    query = query.Where(r => r.DomainId == domainId.Value);

                if (lastReviewDate.HasValue)
                    query = query.Where(r => r.ReviewDate > lastReviewDate.Value);

                var reviews = await query
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        r.RevueId,
                        r.DomainId,
                        DomainName = r.Domain.Name,
                        r.ReviewDate,
                        r.Status,
                        r.CreatedAt,
                        r.PdfFilePath
                    })
                    .ToListAsync();

                return Ok(reviews);
            }

            // POST: api/revue
            [HttpPost]
            public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request)
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                var userRole = HttpContext.Session.GetString("UserRole");
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                if (userRole != "SubscriptionManager" && userRole != "Auditor")
                {
                    return Forbid();
                }

                var domain = await _context.Domains.FindAsync(request.DomainId);
                if (domain == null)
                {
                    return BadRequest(new { message = "Invalid domain" });
                }

                var review = new RevueDeDirection
                {
                    CompanyId = companyId.Value,
                    DomainId = request.DomainId,
                    ReviewDate = request.ReviewDate,
                    Status = "Draft",
                    CreatedById = userId.Value,
                    CreatedAt = DateTime.Now
                };

                _context.RevueDeDirections.Add(review);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetReview), new { id = review.RevueId }, new { revueId = review.RevueId });
            }

            // GET: api/revue/{id}
            [HttpGet("{id}")]
            public async Task<IActionResult> GetReview(int id)
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                var review = await _context.RevueDeDirections
                    .Include(r => r.Domain)
                    .Include(r => r.LegalTexts).ThenInclude(lt => lt.Text)
                    .Include(r => r.Requirements)
                    .Include(r => r.Actions)
                    .Include(r => r.Stakeholders)
                    .FirstOrDefaultAsync(r => r.RevueId == id && r.CompanyId == companyId.Value);

                if (review == null)
                {
                    return NotFound(new { message = "Review not found" });
                }

                var result = new
                {
                    review.RevueId,
                    review.DomainId,
                    DomainName = review.Domain.Name,
                    review.ReviewDate,
                    review.Status,
                    review.PdfFilePath,
                    LegalTexts = review.LegalTexts.Select(lt => new
                    {
                        lt.LegalTextId,
                        lt.TextId,
                        TextReference = lt.Text.Reference,
                        lt.Penalties,
                        lt.Incentives,
                        lt.Risks,
                        lt.Opportunities,
                        lt.FollowUp
                    }),
                    Requirements = review.Requirements.Select(req => new
                    {
                        req.RequirementId,
                        req.Description,
                        req.Implementation,
                        req.Communication,
                        req.FollowUp
                    }),
                    Actions = review.Actions.Select(a => new
                    {
                        a.ActionId,
                        a.Description,
                        a.Source,
                        a.Status,
                        a.Observation,
                        a.FollowUp
                    }),
                    Stakeholders = review.Stakeholders.Select(s => new
                    {
                        s.StakeholderId,
                        s.StakeholderName,
                        s.RelationshipStatus,
                        s.Reason,
                        s.Action,
                        s.FollowUp
                    })
                };

                return Ok(result);
            }

            // PUT: api/revue/{id}
            [HttpPut("{id}")]
            public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdateReviewRequest request)
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                var userRole = HttpContext.Session.GetString("UserRole");
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                if (userRole != "SubscriptionManager" && userRole != "Auditor")
                {
                    return Forbid();
                }

                var review = await _context.RevueDeDirections.FindAsync(id);
                if (review == null || review.CompanyId != companyId.Value)
                {
                    return NotFound(new { message = "Review not found" });
                }

                if (request.ReviewDate.HasValue)
                    review.ReviewDate = request.ReviewDate.Value;

                if (!string.IsNullOrEmpty(request.Status))
                    review.Status = request.Status;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Review updated successfully" });
            }

            // DELETE: api/revue/{id}
            [HttpDelete("{id}")]
            public async Task<IActionResult> DeleteReview(int id)
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                var userRole = HttpContext.Session.GetString("UserRole");
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                if (userRole != "SubscriptionManager")
                {
                    return Forbid();
                }

                var review = await _context.RevueDeDirections.FindAsync(id);
                if (review == null || review.CompanyId != companyId.Value)
                {
                    return NotFound(new { message = "Review not found" });
                }

                _context.RevueDeDirections.Remove(review);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Review deleted successfully" });
            }

            // POST: api/revue/{id}/legaltext
            [HttpPost("{id}/legaltext")]
            public async Task<IActionResult> AddLegalText(int id, [FromBody] AddLegalTextRequest request)
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                var userRole = HttpContext.Session.GetString("UserRole");
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                if (userRole != "SubscriptionManager" && userRole != "Auditor")
                {
                    return Forbid();
                }

                var review = await _context.RevueDeDirections.FindAsync(id);
                if (review == null || review.CompanyId != companyId.Value)
                {
                    return NotFound(new { message = "Review not found" });
                }

                var text = await _context.Texts.FindAsync(request.TextId);
                if (text == null || text.CompanyId != companyId.Value)
                {
                    return NotFound(new { message = "Text not found" });
                }

                var legalText = new RevueLegalText
                {
                    RevueId = id,
                    TextId = request.TextId,
                    Penalties = request.Penalties,
                    Incentives = request.Incentives,
                    Risks = request.Risks,
                    Opportunities = request.Opportunities,
                    FollowUp = request.FollowUp
                };

                _context.RevueLegalTexts.Add(legalText);
                await _context.SaveChangesAsync();

                return Ok(new { legalTextId = legalText.LegalTextId });
            }

            // POST: api/revue/{id}/requirement
            [HttpPost("{id}/requirement")]
            public async Task<IActionResult> AddRequirement(int id, [FromBody] AddRequirementRequest request)
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                var userRole = HttpContext.Session.GetString("UserRole");
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                if (userRole != "SubscriptionManager" && userRole != "Auditor")
                {
                    return Forbid();
                }

                var review = await _context.RevueDeDirections.FindAsync(id);
                if (review == null || review.CompanyId != companyId.Value)
                {
                    return NotFound(new { message = "Review not found" });
                }

                var requirement = new RevueRequirement
                {
                    RevueId = id,
                    Description = request.Description,
                    Implementation = request.Implementation,
                    Communication = request.Communication,
                    FollowUp = request.FollowUp
                };

                _context.RevueRequirements.Add(requirement);
                await _context.SaveChangesAsync();
                return Ok(new { requirementId = requirement.RequirementId });
            }

            // POST: api/revue/{id}/action
            [HttpPost("{id}/action")]
            public async Task<IActionResult> AddAction(int id, [FromBody] AddActionRequest request)
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                var userRole = HttpContext.Session.GetString("UserRole");
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                if (userRole != "SubscriptionManager" && userRole != "Auditor")
                {
                    return Forbid();
                }

                var review = await _context.RevueDeDirections.FindAsync(id);
                if (review == null || review.CompanyId != companyId.Value)
                {
                    return NotFound(new { message = "Review not found" });
                }

                var action = new RevueAction
                {
                    RevueId = id,
                    Description = request.Description,
                    Source = request.Source,
                    Status = request.Status,
                    Observation = request.Observation,
                    FollowUp = request.FollowUp
                };

                _context.RevueActions.Add(action);
                await _context.SaveChangesAsync();
                return Ok(new { actionId = action.ActionId });
            }

            // POST: api/revue/{id}/stakeholder
            [HttpPost("{id}/stakeholder")]
            public async Task<IActionResult> AddStakeholder(int id, [FromBody] AddStakeholderRequest request)
            {
                var userId = HttpContext.Session.GetInt32("UserId");
                var companyId = HttpContext.Session.GetInt32("CompanyId");
                var userRole = HttpContext.Session.GetString("UserRole");
                if (!userId.HasValue || !companyId.HasValue)
                {
                    return Unauthorized(new { message = "Not authenticated" });
                }

                if (userRole != "SubscriptionManager" && userRole != "Auditor")
                {
                    return Forbid();
                }

                var review = await _context.RevueDeDirections.FindAsync(id);
                if (review == null || review.CompanyId != companyId.Value)
                {
                    return NotFound(new { message = "Review not found" });
                }

                var stakeholder = new RevueStakeholder
                {
                    RevueId = id,
                    StakeholderName = request.StakeholderName,
                    RelationshipStatus = request.RelationshipStatus,
                    Reason = request.Reason,
                    Action = request.Action,
                    FollowUp = request.FollowUp
                };

                _context.RevueStakeholders.Add(stakeholder);
                await _context.SaveChangesAsync();
                return Ok(new { stakeholderId = stakeholder.StakeholderId });
            }

            // POST: api/revue/{id}/generate-pdf
[HttpPost("{id}/generate-pdf")]
public async Task<IActionResult> GeneratePdf(int id)
{
    var userId = HttpContext.Session.GetInt32("UserId");
    var companyId = HttpContext.Session.GetInt32("CompanyId");
    if (!userId.HasValue || !companyId.HasValue)
    {
        return Unauthorized(new { message = "Not authenticated" });
    }

    var review = await _context.RevueDeDirections
        .Include(r => r.Domain)
        .Include(r => r.LegalTexts).ThenInclude(lt => lt.Text)
        .Include(r => r.Requirements)
        .Include(r => r.Actions)
        .Include(r => r.Stakeholders)
        .FirstOrDefaultAsync(r => r.RevueId == id && r.CompanyId == companyId.Value);

    if (review == null)
    {
        return NotFound(new { message = "Review not found" });
    }

    var pdfFileName = $"review_{review.RevueId}.pdf";
    var pdfPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "pdfs", pdfFileName);
    Directory.CreateDirectory(Path.GetDirectoryName(pdfPath));

    using (var stream = new MemoryStream())
    {
        using (var writer = new PdfWriter(stream))
        {
            using (var pdf = new PdfDocument(writer))
            {
                using (var document = new Document(pdf))
                {
                    // Define fonts
                    var boldFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
                    var regularFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);

                    // Title
                    document.Add(new Paragraph($"Review ID: {review.RevueId}")
                        .SetFont(boldFont)
                        .SetFontSize(20));

                    // Review Info
                    document.Add(new Paragraph($"Domain: {review.Domain.Name}")
                        .SetFont(regularFont));
                    document.Add(new Paragraph($"Review Date: {review.ReviewDate:yyyy-MM-dd}")
                        .SetFont(regularFont));
                    document.Add(new Paragraph($"Status: {review.Status}")
                        .SetFont(regularFont));
                    document.Add(new Paragraph("\n"));

                    // Legal Texts Table
                    if (review.LegalTexts.Any())
                    {
                        document.Add(new Paragraph("Legal Texts")
                            .SetFont(boldFont)
                            .SetFontSize(14));
                        var table = new Table(UnitValue.CreatePercentArray(new float[] { 20, 16, 16, 16, 16, 16 }));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Reference").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Penalties").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Incentives").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Risks").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Opportunities").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Follow Up").SetFont(boldFont)));

                        foreach (var lt in review.LegalTexts)
                        {
                            table.AddCell(new Cell().Add(new Paragraph(lt.Text.Reference).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(lt.Penalties).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(lt.Incentives).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(lt.Risks).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(lt.Opportunities).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(lt.FollowUp).SetFont(regularFont)));
                        }
                        document.Add(table);
                        document.Add(new Paragraph("\n"));
                    }

                    // Requirements Table
                    if (review.Requirements.Any())
                    {
                        document.Add(new Paragraph("Requirements")
                            .SetFont(boldFont)
                            .SetFontSize(14));
                        var table = new Table(UnitValue.CreatePercentArray(new float[] { 25, 25, 25, 25 }));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Description").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Implementation").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Communication").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Follow Up").SetFont(boldFont)));

                        foreach (var req in review.Requirements)
                        {
                            table.AddCell(new Cell().Add(new Paragraph(req.Description).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(req.Implementation).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(req.Communication).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(req.FollowUp).SetFont(regularFont)));
                        }
                        document.Add(table);
                        document.Add(new Paragraph("\n"));
                    }

                    // Actions Table
                    if (review.Actions.Any())
                    {
                        document.Add(new Paragraph("Actions")
                            .SetFont(boldFont)
                            .SetFontSize(14));
                        var table = new Table(UnitValue.CreatePercentArray(new float[] { 20, 20, 20, 20, 20 }));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Description").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Source").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Status").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Observation").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Follow Up").SetFont(boldFont)));

                        foreach (var act in review.Actions)
                        {
                            table.AddCell(new Cell().Add(new Paragraph(act.Description).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(act.Source).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(act.Status).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(act.Observation).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(act.FollowUp).SetFont(regularFont)));
                        }
                        document.Add(table);
                        document.Add(new Paragraph("\n"));
                    }

                    // Stakeholders Table
                    if (review.Stakeholders.Any())
                    {
                        document.Add(new Paragraph("Stakeholders")
                            .SetFont(boldFont)
                            .SetFontSize(14));
                        var table = new Table(UnitValue.CreatePercentArray(new float[] { 20, 20, 20, 20, 20 }));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Name").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Relationship Status").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Reason").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Action").SetFont(boldFont)));
                        table.AddHeaderCell(new Cell().Add(new Paragraph("Follow Up").SetFont(boldFont)));

                        foreach (var stake in review.Stakeholders)
                        {
                            table.AddCell(new Cell().Add(new Paragraph(stake.StakeholderName).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(stake.RelationshipStatus).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(stake.Reason).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(stake.Action).SetFont(regularFont)));
                            table.AddCell(new Cell().Add(new Paragraph(stake.FollowUp).SetFont(regularFont)));
                        }
                        document.Add(table);
                    }
                }
            }
        }

        var pdfBytes = stream.ToArray();
        await System.IO.File.WriteAllBytesAsync(pdfPath, pdfBytes);
        review.PdfFilePath = $"/pdfs/{pdfFileName}";
        await _context.SaveChangesAsync();

        return File(pdfBytes, "application/pdf", pdfFileName);
    }
}
            public class CreateReviewRequest
            {
                public int DomainId { get; set; }
                public DateTime ReviewDate { get; set; }
            }

            public class UpdateReviewRequest
            {
                public DateTime? ReviewDate { get; set; }
                public string Status { get; set; }
            }

            public class AddLegalTextRequest
            {
                public int TextId { get; set; }
                public string Penalties { get; set; }
                public string Incentives { get; set; }
                public string Risks { get; set; }
                public string Opportunities { get; set; }
                public string FollowUp { get; set; }
            }

            public class AddRequirementRequest
            {
                public string Description { get; set; }
                public string Implementation { get; set; }
                public string Communication { get; set; }
                public string FollowUp { get; set; }
            }

            public class AddActionRequest
            {
                public string Description { get; set; }
                public string Source { get; set; }
                public string Status { get; set; }
                public string Observation { get; set; }
                public string FollowUp { get; set; }
            }

            public class AddStakeholderRequest
            {
                public string StakeholderName { get; set; }
                public string RelationshipStatus { get; set; }
                public string Reason { get; set; }
                public string Action { get; set; }
                public string FollowUp { get; set; }
            }
        }
    }