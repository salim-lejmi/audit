using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models
{
    public class RevueStakeholder
    {
        [Key]
        public int StakeholderId { get; set; }
        public int RevueId { get; set; }
        public string StakeholderName { get; set; }
        public string RelationshipStatus { get; set; } // "Need/Expectation", "Complaint", "Observation"
        public string Reason { get; set; }
        public string Action { get; set; }
        public string FollowUp { get; set; }
        public int CreatedById { get; set; }
public DateTime CreatedAt { get; set; } = DateTime.Now;
[ForeignKey("CreatedById")]
public virtual User CreatedBy { get; set; }


        [ForeignKey("RevueId")]
        public virtual RevueDeDirection Revue { get; set; }
    }
}