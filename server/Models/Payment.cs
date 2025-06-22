using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models
{
    public class Payment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PaymentId { get; set; }
        
        [Required]
        public int CompanyId { get; set; }
        
        [Required]
        public int PlanId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string StripePaymentIntentId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string StripeSessionId { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } // pending, succeeded, failed, canceled
        
        [MaxLength(500)]
        public string Description { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime? PaidAt { get; set; }
        
        public DateTime? ExpiresAt { get; set; }
        
        // Navigation properties
        public virtual Company Company { get; set; }
        public virtual SubscriptionPlan Plan { get; set; }
    }
}