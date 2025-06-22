using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using System.Text.Json;

namespace server.Services
{
    public interface ISubscriptionService
    {
        Task<bool> CanCreateUser(int companyId);
        Task<string[]> GetCompanyFeatures(int companyId);
        Task<bool> HasFeature(int companyId, string feature);
    }

    public class SubscriptionService : ISubscriptionService
    {
        private readonly AuditDbContext _context;

        public SubscriptionService(AuditDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CanCreateUser(int companyId)
        {
            var subscription = await GetActiveSubscription(companyId);
            if (subscription == null) return false;

            var activeUsers = await _context.Users
                .CountAsync(u => u.CompanyId == companyId && u.Status == "Active");

            return activeUsers < subscription.Plan.UserLimit;
        }

        public async Task<string[]> GetCompanyFeatures(int companyId)
        {
            var subscription = await GetActiveSubscription(companyId);
            if (subscription?.Plan?.Features == null) return new string[0];

            return JsonSerializer.Deserialize<string[]>(subscription.Plan.Features) ?? new string[0];
        }

        public async Task<bool> HasFeature(int companyId, string feature)
        {
            var features = await GetCompanyFeatures(companyId);
            return features.Contains(feature);
        }

        private async Task<CompanySubscription> GetActiveSubscription(int companyId)
        {
            return await _context.CompanySubscriptions
                .Include(s => s.Plan)
                .Where(s => s.CompanyId == companyId && s.Status == "active" && s.EndDate > DateTime.Now)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();
        }
    }
}