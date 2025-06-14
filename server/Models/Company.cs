namespace server.Models
{
    public class Company
    {
        public int CompanyId { get; set; }
        public string CompanyName { get; set; }
        public string Industry { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public virtual ICollection<User> Users { get; set; }
                public virtual ICollection<Text> Texts { get; set; }
        public virtual ICollection<Action> Actions { get; set; }

    }
}
