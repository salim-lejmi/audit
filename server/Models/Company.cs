namespace server.Models
{
    public class Company
    {
        public int CompanyId { get; set; }
        public string CompanyName { get; set; }
        public string Industry { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public bool IsEmailVerified { get; set; } = false;

        public virtual ICollection<User> Users { get; set; } = new List<User>();
        public virtual ICollection<Text> Texts { get; set; } = new List<Text>();
        public virtual ICollection<Models.Action> Actions { get; set; } = new List<Models.Action>();
    }
}   