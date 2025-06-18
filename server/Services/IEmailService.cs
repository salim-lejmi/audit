using System.Threading.Tasks;

namespace server.Services
{
    public interface IEmailService
    {
        Task SendEmailVerificationAsync(string email, string name, string verificationLink);
        Task SendUserWelcomeEmailAsync(string email, string name, string verificationLink);
    }
}