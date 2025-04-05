namespace server.Models
{
    public class SubTheme
    {
        public int SubThemeId { get; set; }
        public int ThemeId { get; set; }
        public string Name { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public int? CreatedById { get; set; }
        public virtual User CreatedBy { get; set; }
        public virtual Theme Theme { get; set; }
    }
}