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

        private static readonly DateTime SeedCreatedAt = new DateTime(2025, 3, 10, 1, 2, 0, DateTimeKind.Utc);
        private const string AdminPasswordHash = "$2b$12$ovPPLXG.u1usgak7T7fnAeJEZjgdCOJ4GgIEpL1bM9QAbdUXNDib2";

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ONLY these relationships can cascade - everything else is NoAction

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

            // EVERYTHING ELSE IS NO ACTION - NO EXCEPTIONS!

            // All Action relationships = NO ACTION
            modelBuilder.Entity<Models.Action>()
                .HasOne(a => a.Company)
                .WithMany(c => c.Actions)
                .HasForeignKey(a => a.CompanyId)
                .OnDelete(DeleteBehavior.NoAction);

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

            // All other relationships = NO ACTION
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

            // Seed data
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