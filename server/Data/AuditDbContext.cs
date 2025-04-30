using Microsoft.EntityFrameworkCore;
using server.Models;

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


        private static readonly DateTime SeedCreatedAt = new DateTime(2025, 3, 10, 1, 2, 0, DateTimeKind.Utc);
        private const string AdminPasswordHash = "$2b$12$ovPPLXG.u1usgak7T7fnAeJEZjgdCOJ4GgIEpL1bM9QAbdUXNDib2";

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure User-Company relationship
            modelBuilder.Entity<User>()
                .HasOne(u => u.Company)
                .WithMany(c => c.Users)
                .HasForeignKey(u => u.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Text-User relationship
            modelBuilder.Entity<Text>()
                .HasOne(t => t.CreatedBy)
                .WithMany()
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure TextRequirement-Text relationship
            modelBuilder.Entity<TextRequirement>()
                .HasOne(tr => tr.Text)
                .WithMany(t => t.Requirements)
                .HasForeignKey(tr => tr.TextId)
                .OnDelete(DeleteBehavior.Cascade);

            // Explicitly configure RequirementId as the primary key for TextRequirement
            modelBuilder.Entity<TextRequirement>()
                .HasKey(tr => tr.RequirementId);
            modelBuilder.Entity<Domain>()
                .HasMany(d => d.Themes)
                .WithOne(t => t.Domain)
                .HasForeignKey(t => t.DomainId);

            // Configure Theme relationships
            modelBuilder.Entity<Theme>()
                .HasMany(t => t.SubThemes)
                .WithOne(s => s.Theme)
                .HasForeignKey(s => s.ThemeId);

            // Configure ComplianceEvaluation relationships
            modelBuilder.Entity<ComplianceEvaluation>()
                .HasOne(ce => ce.Text)
                .WithMany()
                .HasForeignKey(ce => ce.TextId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ComplianceEvaluation>()
                .HasOne(ce => ce.Requirement)
                .WithMany()
                .HasForeignKey(ce => ce.RequirementId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ComplianceEvaluation>()
                .HasOne(ce => ce.EvaluatedBy)
                .WithMany()
                .HasForeignKey(ce => ce.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure Observation relationships
            modelBuilder.Entity<Observation>()
                .HasOne(o => o.Evaluation)
                .WithMany(ce => ce.Observations)
                .HasForeignKey(o => o.EvaluationId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure MonitoringParameter relationships
            modelBuilder.Entity<MonitoringParameter>()
                .HasOne(mp => mp.Evaluation)
                .WithMany(ce => ce.MonitoringParameters)
                .HasForeignKey(mp => mp.EvaluationId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure EvaluationAttachment relationships
            modelBuilder.Entity<EvaluationAttachment>()
                .HasOne(ea => ea.Evaluation)
                .WithMany(ce => ce.Attachments)
                .HasForeignKey(ea => ea.EvaluationId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed Super Admin user
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    UserId = 1,
                    Name = "Super Admin",
                    Email = "admin@gmail.com",
                    PasswordHash = AdminPasswordHash,
                    Role = "SuperAdmin",
                    PhoneNumber = "99999999",
                    CreatedAt = SeedCreatedAt
                }
            );
            modelBuilder.Entity<Domain>().HasData(
                new Domain { DomainId = 1, Name = "Santé et sécurité au travail", CreatedAt = SeedCreatedAt },
                new Domain { DomainId = 2, Name = "Environnement", CreatedAt = SeedCreatedAt },
                new Domain { DomainId = 3, Name = "Qualité", CreatedAt = SeedCreatedAt }
            );
        }
    }
}