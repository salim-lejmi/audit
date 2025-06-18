using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace server.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailVerificationAsync(string email, string name, string verificationLink)
        {
            var subject = "Verify Your Email - Prevention Plus";
            var body = $@"
                <html>
                <body>
                    <h2>Welcome to Prevention Plus, {name}!</h2>
                    <p>Thank you for registering your company with Prevention Plus.</p>
                    <p>Please click the link below to verify your email address:</p>
                    <p><a href='{verificationLink}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Verify Email</a></p>
                    <p>Once your email is verified, your company registration will be sent to our administrators for approval.</p>
                    <p>If you didn't create this account, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Prevention Plus Team</p>
                </body>
                </html>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendUserWelcomeEmailAsync(string email, string name, string verificationLink)
        {
            var subject = "Welcome to Prevention Plus - Verify Your Account";
            var body = $@"
                <html>
                <body>
                    <h2>Welcome to Prevention Plus, {name}!</h2>
                    <p>An account has been created for you by your company administrator.</p>
                    <p>Please click the link below to verify your email address and activate your account:</p>
                    <p><a href='{verificationLink}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Verify Email & Activate Account</a></p>
                    <p>Once verified, you'll be able to log in to your account.</p>
                    <p>If you didn't expect this email, please contact your company administrator.</p>
                    <br>
                    <p>Best regards,<br>Prevention Plus Team</p>
                </body>
                </html>";

            await SendEmailAsync(email, subject, body);
        }

        private async Task SendEmailAsync(string email, string subject, string body)
        {
            try
            {
                var smtpHost = _configuration["Email:SmtpHost"];
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"]);
                var smtpUser = _configuration["Email:SmtpUser"];
                var smtpPass = _configuration["Email:SmtpPass"];
                var fromEmail = _configuration["Email:FromEmail"];
                var fromName = _configuration["Email:FromName"];

                using var client = new SmtpClient(smtpHost, smtpPort);
                client.UseDefaultCredentials = false;
                client.Credentials = new NetworkCredential(smtpUser, smtpPass);
                client.EnableSsl = true;

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(email);

                await client.SendMailAsync(mailMessage);
            }
            catch (Exception ex)
            {
                // Log the exception (implement proper logging)
                Console.WriteLine($"Email sending failed: {ex.Message}");
                throw;
            }
        }
    }
}