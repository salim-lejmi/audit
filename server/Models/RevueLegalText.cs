using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models
{
    public class RevueLegalText
    {
        [Key]
        public int LegalTextId { get; set; }
        public int RevueId { get; set; }
        public int TextId { get; set; }
        public string Penalties { get; set; }
        public string Incentives { get; set; }
        public string Risks { get; set; }
        public string Opportunities { get; set; }
        public string FollowUp { get; set; }

        [ForeignKey("RevueId")]
        public virtual RevueDeDirection Revue { get; set; }

        [ForeignKey("TextId")]
        public virtual Text Text { get; set; }
    }
}