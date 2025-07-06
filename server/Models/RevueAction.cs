using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models
{
    public class RevueAction
    {
        [Key]
        public int ActionId { get; set; }
        public int RevueId { get; set; }
        public string Description { get; set; }
        public string Source { get; set; }
        public string Status { get; set; } // "Pending", "In Progress", "Completed"
        public string Observation { get; set; }
        public string FollowUp { get; set; }
        public int CreatedById { get; set; }
public DateTime CreatedAt { get; set; } = DateTime.Now;

[ForeignKey("CreatedById")]
public virtual User CreatedBy { get; set; }


        [ForeignKey("RevueId")]
        public virtual RevueDeDirection Revue { get; set; }
    }
}