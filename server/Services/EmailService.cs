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
            var subject = "Vérifiez votre adresse e-mail - Prevention Plus";
            var body = $@"
                <html>
                <body>
                    <h2>Bienvenue sur Prevention Plus, {name} !</h2>
                    <p>Merci d'avoir inscrit votre entreprise sur Prevention Plus.</p>
                    <p>Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse e-mail :</p>
                    <p><a href='{verificationLink}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Vérifier l'adresse e-mail</a></p>
                    <p>Une fois votre e-mail vérifié, l'inscription de votre entreprise sera transmise à nos administrateurs pour approbation.</p>
                    <p>Si vous n'êtes pas à l'origine de cette inscription, veuillez ignorer cet e-mail.</p>
                    <br>
                    <p>Cordialement,<br>L'équipe Prevention Plus</p>
                </body>
                </html>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendUserWelcomeEmailAsync(string email, string name, string verificationLink)
        {
            var subject = "Bienvenue sur Prevention Plus - Vérifiez votre compte";
            var body = $@"
                <html>
                <body>
                    <h2>Bienvenue sur Prevention Plus, {name} !</h2>
                    <p>Un compte a été créé pour vous par l’administrateur de votre entreprise.</p>
                    <p>Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse e-mail et activer votre compte :</p>
                    <p><a href='{verificationLink}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Vérifier et activer le compte</a></p>
                    <p>Une fois vérifié, vous pourrez vous connecter à votre compte.</p>
                    <p>Si vous ne vous attendiez pas à recevoir cet e-mail, veuillez contacter l’administrateur de votre entreprise.</p>
                    <br>
                    <p>Cordialement,<br>L'équipe Prevention Plus</p>
                </body>
                </html>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendQuoteEmailAsync(string to, string clientName, string quoteNumber, string message)
        {
            string subject = $"Devis #{quoteNumber} - Prevention Plus";
            
            string htmlContent = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='background-color: #4c75a0; padding: 20px; text-align: center; color: white;'>
                    <h1>Prevention Plus</h1>
                </div>
                <div style='padding: 20px; background-color: #f5f5f5; border: 1px solid #ddd;'>
                    <p>Bonjour {clientName},</p>
                    <p>{message}</p>
                    <p>Numéro du devis : <strong>{quoteNumber}</strong></p>
                    <p>N'hésitez pas à nous contacter si vous avez des questions concernant ce devis.</p>
                    <p>Cordialement,</p>
                    <p>L'équipe Prevention Plus</p>
                </div>
            </div>";

            await SendEmailAsync(to, subject, htmlContent);
        }

        public async Task SendEmailAsync(string email, string subject, string body)
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
                // Enregistrer l’erreur (ajouter un vrai système de journalisation)
                Console.WriteLine($"Échec de l’envoi de l’e-mail : {ex.Message}");
                throw;
            }
        }
    }
}
