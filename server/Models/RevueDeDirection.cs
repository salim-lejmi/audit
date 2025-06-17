using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models
{
    public class RevueDeDirection
    {
        [Key]
        public int RevueId { get; set; }
        public int CompanyId { get; set; }
        public int DomainId { get; set; }
        public DateTime ReviewDate { get; set; }
        public string Status { get; set; } // "Draft", "In Progress", "Completed", "Canceled"
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public int CreatedById { get; set; }
public string? PdfFilePath { get; set; }
        [ForeignKey("CompanyId")]
        public virtual Company Company { get; set; }

        [ForeignKey("DomainId")]
        public virtual Domain Domain { get; set; }

        [ForeignKey("CreatedById")]
        public virtual User CreatedBy { get; set; }

        public virtual ICollection<RevueLegalText> LegalTexts { get; set; }
        public virtual ICollection<RevueRequirement> Requirements { get; set; }
        public virtual ICollection<RevueAction> Actions { get; set; }
        public virtual ICollection<RevueStakeholder> Stakeholders { get; set; }
    }
}