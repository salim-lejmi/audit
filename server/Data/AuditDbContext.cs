using Microsoft.EntityFrameworkCore;

namespace server.Data
{
    public class AuditDbContext : DbContext
    {
        public AuditDbContext(DbContextOptions<AuditDbContext> options)
            : base(options)
        {
        }

        // Define your DbSets here
        // public DbSet<YourEntity> YourEntities { get; set; }
    }
}