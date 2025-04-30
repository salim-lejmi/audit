using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class compliance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ComplianceEvaluations",
                columns: table => new
                {
                    EvaluationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TextId = table.Column<int>(type: "int", nullable: false),
                    RequirementId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EvaluatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsSavedToHistory = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComplianceEvaluations", x => x.EvaluationId);
                    table.ForeignKey(
                        name: "FK_ComplianceEvaluations_TextRequirements_RequirementId",
                        column: x => x.RequirementId,
                        principalTable: "TextRequirements",
                        principalColumn: "RequirementId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComplianceEvaluations_Texts_TextId",
                        column: x => x.TextId,
                        principalTable: "Texts",
                        principalColumn: "TextId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComplianceEvaluations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationAttachments",
                columns: table => new
                {
                    AttachmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EvaluationId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationAttachments", x => x.AttachmentId);
                    table.ForeignKey(
                        name: "FK_EvaluationAttachments_ComplianceEvaluations_EvaluationId",
                        column: x => x.EvaluationId,
                        principalTable: "ComplianceEvaluations",
                        principalColumn: "EvaluationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationHistory",
                columns: table => new
                {
                    HistoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EvaluationId = table.Column<int>(type: "int", nullable: false),
                    PreviousStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NewStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChangedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ChangedById = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationHistory", x => x.HistoryId);
                    table.ForeignKey(
                        name: "FK_EvaluationHistory_ComplianceEvaluations_EvaluationId",
                        column: x => x.EvaluationId,
                        principalTable: "ComplianceEvaluations",
                        principalColumn: "EvaluationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EvaluationHistory_Users_ChangedById",
                        column: x => x.ChangedById,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MonitoringParameters",
                columns: table => new
                {
                    ParameterId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EvaluationId = table.Column<int>(type: "int", nullable: false),
                    ParameterName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ParameterValue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonitoringParameters", x => x.ParameterId);
                    table.ForeignKey(
                        name: "FK_MonitoringParameters_ComplianceEvaluations_EvaluationId",
                        column: x => x.EvaluationId,
                        principalTable: "ComplianceEvaluations",
                        principalColumn: "EvaluationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Observations",
                columns: table => new
                {
                    ObservationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EvaluationId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Observations", x => x.ObservationId);
                    table.ForeignKey(
                        name: "FK_Observations_ComplianceEvaluations_EvaluationId",
                        column: x => x.EvaluationId,
                        principalTable: "ComplianceEvaluations",
                        principalColumn: "EvaluationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Observations_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComplianceEvaluations_RequirementId",
                table: "ComplianceEvaluations",
                column: "RequirementId");

            migrationBuilder.CreateIndex(
                name: "IX_ComplianceEvaluations_TextId",
                table: "ComplianceEvaluations",
                column: "TextId");

            migrationBuilder.CreateIndex(
                name: "IX_ComplianceEvaluations_UserId",
                table: "ComplianceEvaluations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationAttachments_EvaluationId",
                table: "EvaluationAttachments",
                column: "EvaluationId");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationHistory_ChangedById",
                table: "EvaluationHistory",
                column: "ChangedById");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationHistory_EvaluationId",
                table: "EvaluationHistory",
                column: "EvaluationId");

            migrationBuilder.CreateIndex(
                name: "IX_MonitoringParameters_EvaluationId",
                table: "MonitoringParameters",
                column: "EvaluationId");

            migrationBuilder.CreateIndex(
                name: "IX_Observations_CreatedById",
                table: "Observations",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Observations_EvaluationId",
                table: "Observations",
                column: "EvaluationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EvaluationAttachments");

            migrationBuilder.DropTable(
                name: "EvaluationHistory");

            migrationBuilder.DropTable(
                name: "MonitoringParameters");

            migrationBuilder.DropTable(
                name: "Observations");

            migrationBuilder.DropTable(
                name: "ComplianceEvaluations");
        }
    }
}
