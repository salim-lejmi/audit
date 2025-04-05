using System.Collections.Generic;

namespace server.Models
{
    public class Domain
    {
        public int DomainId { get; set; }
        public string Name { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public int? CreatedById { get; set; }
        public virtual User CreatedBy { get; set; }
        public virtual ICollection<Theme> Themes { get; set; }
    }
}