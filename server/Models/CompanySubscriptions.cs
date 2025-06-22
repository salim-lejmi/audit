using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models
{
    public class CompanySubscription
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SubscriptionId { get; set; }
        
        [Required]
        public int CompanyId { get; set; }
        
        [Required]
        public int PlanId { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } // active, expired, canceled
        
        public DateTime StartDate { get; set; } = DateTime.Now;
        
        public DateTime EndDate { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime? CanceledAt { get; set; }
        
        // Navigation properties
        public virtual Company Company { get; set; }
        public virtual SubscriptionPlan Plan { get; set; }
    }
}