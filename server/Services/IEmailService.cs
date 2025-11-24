using System.Threading.Tasks;

namespace server.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string htmlContent);
        Task SendEmailVerificationAsync(string to, string name, string verificationLink);
        Task SendUserWelcomeEmailAsync(string to, string name, string verificationLink);
        Task SendQuoteEmailAsync(string to, string clientName, string quoteNumber, string message);
        Task SendPasswordResetEmailAsync(string to, string name, string resetLink);
    }
}