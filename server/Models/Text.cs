using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace server.Models
{
    public class Text
    {
        public int TextId { get; set; }
        public int DomainId { get; set; }
        public int? ThemeId { get; set; }
        public int? SubThemeId { get; set; }
        public string Reference { get; set; }
        public string Nature { get; set; }
        public int PublicationYear { get; set; }
        public string Status { get; set; } // "À vérifier", "Applicable", "Non applicable", "Pour information"
        public string Penalties { get; set; }
        public string RelatedTexts { get; set; } // Abrogeant/modifiant/complétant
        public DateTime? EffectiveDate { get; set; }
        public string Content { get; set; }
        public string FilePath { get; set; }
        public bool IsConsulted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public int? CreatedById { get; set; }
        public virtual User CreatedBy { get; set; }
        public virtual Domain DomainObject { get; set; }
        public virtual Theme ThemeObject { get; set; }
        public virtual SubTheme SubThemeObject { get; set; }

        public virtual ICollection<TextRequirement> Requirements { get; set; }
    }

    public class TextRequirement
    {
        [Key]
        public int RequirementId { get; set; }
        public int TextId { get; set; }
        public string Number { get; set; }
        public string Title { get; set; }
        public string Status { get; set; } // "applicable", "non-applicable", "à vérifier", "pour information"

        [ForeignKey("TextId")]
        public Text Text { get; set; }
    }
}