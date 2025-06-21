using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models
{
    public class SubscriptionPlan
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PlanId { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        
        [MaxLength(500)]
        public string Description { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }
        
        [Required]
        public int UserLimit { get; set; }
        
        [Column(TypeName = "decimal(5,2)")]
        public decimal Discount { get; set; } = 0; // Percentage (0-100)
        
        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal TaxRate { get; set; } = 20; // Percentage
        
        [MaxLength(2000)]
        public string Features { get; set; } // JSON serialized array
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}