using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models
{
    public class Action
    {
        [Key]
        public int ActionId { get; set; }

        // REMOVE [Required] here
        public int? TextId { get; set; } // This is correctly nullable now

        public int? RequirementId { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; }

        public int? ResponsibleId { get; set; }

        [Required]
        public DateTime Deadline { get; set; }

        [Range(0, 100)]
        public int Progress { get; set; } = 0;

        [StringLength(255)]
        public string Effectiveness { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "active"; // active, completed, canceled

        [Required]
        public int CompanyId { get; set; } // Add this line to associate action with a company

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }

        [Required]
        public int CreatedById { get; set; }

        [ForeignKey("TextId")]
        public virtual Text Text { get; set; }

        [ForeignKey("RequirementId")]
        public virtual TextRequirement Requirement { get; set; }

        [ForeignKey("ResponsibleId")]
        public virtual User Responsible { get; set; }

        [ForeignKey("CreatedById")]
        public virtual User CreatedBy { get; set; }
        
        [ForeignKey("CompanyId")]
        public virtual Company Company { get; set; }
    }
}