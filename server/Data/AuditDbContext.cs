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
        private static readonly DateTime SeedCreatedAt = new DateTime(2025, 3, 10, 1, 2, 0, DateTimeKind.Utc);
        // Pre-computed hash for "admin123"
        private const string AdminPasswordHash = "$2b$12$ovPPLXG.u1usgak7T7fnAeJEZjgdCOJ4GgIEpL1bM9QAbdUXNDib2";

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure User-Company relationship
            modelBuilder.Entity<User>()
                .HasOne(u => u.Company)
                .WithMany(c => c.Users)
                .HasForeignKey(u => u.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed Super Admin user
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    UserId = 1,
                    Name = "Super Admin",
                    Email = "admin@gmail.com",
                    PasswordHash = AdminPasswordHash,  // Use the pre-computed hash
                    Role = "SuperAdmin",
                    PhoneNumber = "99999999",
                    CreatedAt = SeedCreatedAt
                }
            );
        }
    }
}