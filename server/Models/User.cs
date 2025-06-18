namespace server.Models
{
    public class User
    {
        public int UserId { get; set; }
        public int? CompanyId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; }
        public DateTime? CreatedAt { get; set; } // Now nullable
        public bool IsEmailVerified { get; set; } = false;
        public string EmailVerificationToken { get; set; }
        public DateTime? EmailVerificationTokenExpiry { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Active

        public virtual Company Company { get; set; }
    }
}