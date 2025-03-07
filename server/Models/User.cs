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
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public virtual Company Company { get; set; }
    }
}
