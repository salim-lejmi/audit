    using Microsoft.EntityFrameworkCore;
    using server.Models;
    using System;

    namespace server.Data
    {
        public class AuditDbContext : DbContext
        {
            public AuditDbContext(DbContextOptions<AuditDbContext> options)
                : base(options)
            {
            }

            public DbSet<User> Users { get; set; }
            public DbSet<Company> Companies { get; set; }
            public DbSet<Text> Texts { get; set; }
            public DbSet<TextRequirement> TextRequirements { get; set; }
            public DbSet<Domain> Domains { get; set; }
            public DbSet<Theme> Themes { get; set; }
            public DbSet<SubTheme> SubThemes { get; set; }
            public DbSet<ComplianceEvaluation> ComplianceEvaluations { get; set; }
            public DbSet<Observation> Observations { get; set; }
            public DbSet<MonitoringParameter> MonitoringParameters { get; set; }
            public DbSet<EvaluationAttachment> EvaluationAttachments { get; set; }
            public DbSet<EvaluationHistory> EvaluationHistory { get; set; }
            public DbSet<Models.Action> Actions { get; set; }
            public DbSet<RevueDeDirection> RevueDeDirections { get; set; }
            public DbSet<RevueLegalText> RevueLegalTexts { get; set; }
            public DbSet<RevueRequirement> RevueRequirements { get; set; }
            public DbSet<RevueAction> RevueActions { get; set; }
            public DbSet<RevueStakeholder> RevueStakeholders { get; set; }
            public DbSet<Notification> Notifications { get; set; }
    public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<CompanySubscription> CompanySubscriptions { get; set; }

            private static readonly DateTime SeedCreatedAt = new DateTime(2025, 3, 10, 1, 2, 0, DateTimeKind.Utc);
            private const string AdminPasswordHash = "$2b$12$ovPPLXG.u1usgak7T7fnAeJEZjgdCOJ4GgIEpL1bM9QAbdUXNDib2";

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Configure the new properties as nullable or with default values
    modelBuilder.Entity<User>(entity =>
    {
        entity.Property(e => e.IsEmailVerified).HasDefaultValue(false);
        entity.Property(e => e.Status).HasDefaultValue("Pending");
        entity.Property(e => e.EmailVerificationToken).IsRequired(false);
        entity.Property(e => e.EmailVerificationTokenExpiry).IsRequired(false);
        entity.Property(e => e.CreatedAt).IsRequired(false);
    });

    modelBuilder.Entity<Company>(entity =>
    {
        entity.Property(e => e.IsEmailVerified).HasDefaultValue(false);
        entity.Property(e => e.Status).HasDefaultValue("Pending");
    });

    // ALL COMPANY RELATIONSHIPS WITH CASCADE DELETE
    
    // Company → Users (CASCADE)
    modelBuilder.Entity<User>()
        .HasOne(u => u.Company)
        .WithMany(c => c.Users)
        .HasForeignKey(u => u.CompanyId)
        .OnDelete(DeleteBehavior.Cascade);

    // Company → Texts (CASCADE)
    modelBuilder.Entity<Text>()
        .HasOne(t => t.Company)
        .WithMany(c => c.Texts)
        .HasForeignKey(t => t.CompanyId)
        .OnDelete(DeleteBehavior.Cascade);

    // Company → Actions (CASCADE) - CHANGED FROM NOACTION TO CASCADE
    modelBuilder.Entity<Models.Action>()
        .HasOne(a => a.Company)
        .WithMany(c => c.Actions)
        .HasForeignKey(a => a.CompanyId)
        .OnDelete(DeleteBehavior.Cascade);

    // Company → CompanySubscriptions (CASCADE) - CHANGED FROM NOACTION TO CASCADE
    modelBuilder.Entity<CompanySubscription>()
        .HasOne(cs => cs.Company)
        .WithMany()
        .HasForeignKey(cs => cs.CompanyId)
        .OnDelete(DeleteBehavior.Cascade);

    // Company → Payments (CASCADE) - CHANGED FROM NOACTION TO CASCADE
    modelBuilder.Entity<Payment>()
        .HasOne(p => p.Company)
        .WithMany()
        .HasForeignKey(p => p.CompanyId)
        .OnDelete(DeleteBehavior.Cascade);

    // Text → TextRequirements (CASCADE)
    modelBuilder.Entity<TextRequirement>()
        .HasOne(tr => tr.Text)
        .WithMany(t => t.Requirements)
        .HasForeignKey(tr => tr.TextId)
        .OnDelete(DeleteBehavior.Cascade);

    // Evaluation hierarchy cascades
    modelBuilder.Entity<Observation>()
        .HasOne(o => o.Evaluation)
        .WithMany(ce => ce.Observations)
        .HasForeignKey(o => o.EvaluationId)
        .OnDelete(DeleteBehavior.Cascade);

    modelBuilder.Entity<MonitoringParameter>()
        .HasOne(mp => mp.Evaluation)
        .WithMany(ce => ce.MonitoringParameters)
        .HasForeignKey(mp => mp.EvaluationId)
        .OnDelete(DeleteBehavior.Cascade);

    modelBuilder.Entity<EvaluationAttachment>()
        .HasOne(ea => ea.Evaluation)
        .WithMany(ce => ce.Attachments)
        .HasForeignKey(ea => ea.EvaluationId)
        .OnDelete(DeleteBehavior.Cascade);

    // RevueDeDirection → Related entities (CASCADE)
    modelBuilder.Entity<RevueLegalText>()
        .HasOne(rlt => rlt.Revue)
        .WithMany(r => r.LegalTexts)
        .HasForeignKey(rlt => rlt.RevueId)
        .OnDelete(DeleteBehavior.Cascade);

    modelBuilder.Entity<RevueRequirement>()
        .HasOne(rr => rr.Revue)
        .WithMany(r => r.Requirements)
        .HasForeignKey(rr => rr.RevueId)
        .OnDelete(DeleteBehavior.Cascade);
modelBuilder.Entity<RevueAction>()
        .HasOne(ra => ra.CreatedBy)
        .WithMany()
        .HasForeignKey(ra => ra.CreatedById)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<RevueStakeholder>()
        .HasOne(rs => rs.CreatedBy)
        .WithMany()
        .HasForeignKey(rs => rs.CreatedById)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<RevueRequirement>()
        .HasOne(rr => rr.CreatedBy)
        .WithMany()
        .HasForeignKey(rr => rr.CreatedById)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<RevueLegalText>()
        .HasOne(rlt => rlt.CreatedBy)
        .WithMany()
        .HasForeignKey(rlt => rlt.CreatedById)
        .OnDelete(DeleteBehavior.NoAction);
    modelBuilder.Entity<RevueAction>()
        .HasOne(ra => ra.Revue)
        .WithMany(r => r.Actions)
        .HasForeignKey(ra => ra.RevueId)
        .OnDelete(DeleteBehavior.Cascade);

    modelBuilder.Entity<RevueStakeholder>()
        .HasOne(rs => rs.Revue)
        .WithMany(r => r.Stakeholders)
        .HasForeignKey(rs => rs.RevueId)
        .OnDelete(DeleteBehavior.Cascade);

    // ALL OTHER RELATIONSHIPS = NO ACTION

    // All other Action relationships = NO ACTION
    modelBuilder.Entity<Models.Action>()
        .HasOne(a => a.Text)
        .WithMany()
        .HasForeignKey(a => a.TextId)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<Models.Action>()
        .HasOne(a => a.Requirement)
        .WithMany()
        .HasForeignKey(a => a.RequirementId)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<Models.Action>()
        .HasOne(a => a.Responsible)
        .WithMany()
        .HasForeignKey(a => a.ResponsibleId)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<Models.Action>()
        .HasOne(a => a.CreatedBy)
        .WithMany()
        .HasForeignKey(a => a.CreatedById)
        .OnDelete(DeleteBehavior.NoAction);

    // All other Text relationships = NO ACTION
    modelBuilder.Entity<Text>()
        .HasOne(t => t.CreatedBy)
        .WithMany()
        .HasForeignKey(t => t.CreatedById)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<Domain>()
        .HasMany(d => d.Themes)
        .WithOne(t => t.Domain)
        .HasForeignKey(t => t.DomainId)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<Theme>()
        .HasMany(t => t.SubThemes)
        .WithOne(s => s.Theme)
        .HasForeignKey(s => s.ThemeId)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<ComplianceEvaluation>()
        .HasOne(ce => ce.Text)
        .WithMany()
        .HasForeignKey(ce => ce.TextId)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<ComplianceEvaluation>()
        .HasOne(ce => ce.Requirement)
        .WithMany()
        .HasForeignKey(ce => ce.RequirementId)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<ComplianceEvaluation>()
        .HasOne(ce => ce.EvaluatedBy)
        .WithMany()
        .HasForeignKey(ce => ce.UserId)
        .OnDelete(DeleteBehavior.NoAction);

    // RevueRequirement → TextRequirement (NO ACTION)
    modelBuilder.Entity<RevueRequirement>()
        .HasOne(rr => rr.TextRequirement)
        .WithMany()
        .HasForeignKey(rr => rr.TextRequirementId)
        .OnDelete(DeleteBehavior.NoAction);

    // RevueLegalText → Text (NO ACTION)
    modelBuilder.Entity<RevueLegalText>()
        .HasOne(rlt => rlt.Text)
        .WithMany()
        .HasForeignKey(rlt => rlt.TextId)
        .OnDelete(DeleteBehavior.NoAction);

    // RevueDeDirection → User (NO ACTION for CreatedById)
    modelBuilder.Entity<RevueDeDirection>()
        .HasOne(r => r.CreatedBy)
        .WithMany()
        .HasForeignKey(r => r.CreatedById)
        .OnDelete(DeleteBehavior.NoAction);

    // Subscription Plan relationships (NO ACTION)
    modelBuilder.Entity<SubscriptionPlan>(entity =>
    {
        entity.Property(e => e.IsActive).HasDefaultValue(true);
        entity.Property(e => e.Discount).HasDefaultValue(0);
        entity.Property(e => e.TaxRate).HasDefaultValue(20);
        entity.Property(e => e.Features).IsRequired(false);
    });

    modelBuilder.Entity<CompanySubscription>()
        .HasOne(cs => cs.Plan)
        .WithMany()
        .HasForeignKey(cs => cs.PlanId)
        .OnDelete(DeleteBehavior.NoAction);

    modelBuilder.Entity<Payment>()
        .HasOne(p => p.Plan)
        .WithMany()
        .HasForeignKey(p => p.PlanId)
        .OnDelete(DeleteBehavior.NoAction);

    // Seed data - Updated to include new properties
    modelBuilder.Entity<User>().HasData(
        new User
        {
            UserId = 1,
            Name = "Super Admin",
            Email = "admin@gmail.com",
            PasswordHash = AdminPasswordHash,
            Role = "SuperAdmin",
            PhoneNumber = "99999999",
            CreatedAt = SeedCreatedAt,
            IsEmailVerified = true,
            EmailVerificationToken = null,
            EmailVerificationTokenExpiry = null,
            Status = "Active"
        }
    );

    modelBuilder.Entity<Domain>().HasData(
        new Domain { DomainId = 1, Name = "Santé et sécurité au travail", CreatedAt = SeedCreatedAt },
        new Domain { DomainId = 2, Name = "Environnement", CreatedAt = SeedCreatedAt },
        new Domain { DomainId = 3, Name = "Qualité", CreatedAt = SeedCreatedAt }
    );
}        }
    }