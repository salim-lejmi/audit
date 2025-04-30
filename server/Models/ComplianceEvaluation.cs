using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models
{
    public class ComplianceEvaluation
    {
        [Key]
        public int EvaluationId { get; set; }
        public int TextId { get; set; }
        public int RequirementId { get; set; }
        public int UserId { get; set; }
        public string Status { get; set; } // "applicable", "non-applicable", "à vérifier", "pour information"
        public DateTime EvaluatedAt { get; set; }
        public bool IsSavedToHistory { get; set; }

        // Navigation properties
        [ForeignKey("TextId")]
        public Text Text { get; set; }

        [ForeignKey("RequirementId")]
        public TextRequirement Requirement { get; set; }

        [ForeignKey("UserId")]
        public User EvaluatedBy { get; set; }

        public ICollection<Observation> Observations { get; set; }
        public ICollection<MonitoringParameter> MonitoringParameters { get; set; }
        public ICollection<EvaluationAttachment> Attachments { get; set; }
    }

    public class Observation
    {
        [Key]
        public int ObservationId { get; set; }
        public int EvaluationId { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public int CreatedById { get; set; }

        [ForeignKey("EvaluationId")]
        public ComplianceEvaluation Evaluation { get; set; }

        [ForeignKey("CreatedById")]
        public User CreatedBy { get; set; }
    }

    public class MonitoringParameter
    {
        [Key]
        public int ParameterId { get; set; }
        public int EvaluationId { get; set; }
        public string ParameterName { get; set; }
        public string ParameterValue { get; set; }
        public DateTime CreatedAt { get; set; }

        [ForeignKey("EvaluationId")]
        public ComplianceEvaluation Evaluation { get; set; }
    }

    public class EvaluationAttachment
    {
        [Key]
        public int AttachmentId { get; set; }
        public int EvaluationId { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }

        [ForeignKey("EvaluationId")]
        public ComplianceEvaluation Evaluation { get; set; }
    }

    public class EvaluationHistory
    {
        [Key]
        public int HistoryId { get; set; }
        public int EvaluationId { get; set; }
        public string PreviousStatus { get; set; }
        public string NewStatus { get; set; }
        public DateTime ChangedAt { get; set; }
        public int ChangedById { get; set; }

        [ForeignKey("EvaluationId")]
        public ComplianceEvaluation Evaluation { get; set; }

        [ForeignKey("ChangedById")]
        public User ChangedBy { get; set; }
    }
}