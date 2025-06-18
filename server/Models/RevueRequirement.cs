using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models
{
    public class RevueRequirement
    {
        [Key]
        public int RequirementId { get; set; }
        public int RevueId { get; set; }
        public int TextRequirementId { get; set; }
        public string Implementation { get; set; }
        public string Communication { get; set; }
        public string FollowUp { get; set; }

        [ForeignKey("RevueId")]
        public virtual RevueDeDirection Revue { get; set; }
        [ForeignKey("TextRequirementId")]
        public virtual TextRequirement TextRequirement { get; set; }

    }
}