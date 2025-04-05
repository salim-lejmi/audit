using System.Collections.Generic;

namespace server.Models
{
    public class Theme
    {
        public int ThemeId { get; set; }
        public int DomainId { get; set; }
        public string Name { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public int? CreatedById { get; set; }
        public virtual User CreatedBy { get; set; }
        public virtual Domain Domain { get; set; }
        public virtual ICollection<SubTheme> SubThemes { get; set; }
    }
}