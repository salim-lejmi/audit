using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class revueModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RevueDeDirections",
                columns: table => new
                {
                    RevueId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<int>(type: "int", nullable: false),
                    DomainId = table.Column<int>(type: "int", nullable: false),
                    ReviewDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RevueDeDirections", x => x.RevueId);
                    table.ForeignKey(
                        name: "FK_RevueDeDirections_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "CompanyId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RevueDeDirections_Domains_DomainId",
                        column: x => x.DomainId,
                        principalTable: "Domains",
                        principalColumn: "DomainId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RevueDeDirections_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "RevueActions",
                columns: table => new
                {
                    ActionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RevueId = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Observation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FollowUp = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RevueActions", x => x.ActionId);
                    table.ForeignKey(
                        name: "FK_RevueActions_RevueDeDirections_RevueId",
                        column: x => x.RevueId,
                        principalTable: "RevueDeDirections",
                        principalColumn: "RevueId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RevueLegalTexts",
                columns: table => new
                {
                    LegalTextId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RevueId = table.Column<int>(type: "int", nullable: false),
                    TextId = table.Column<int>(type: "int", nullable: false),
                    Penalties = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Incentives = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Risks = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Opportunities = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FollowUp = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RevueLegalTexts", x => x.LegalTextId);
                    table.ForeignKey(
                        name: "FK_RevueLegalTexts_RevueDeDirections_RevueId",
                        column: x => x.RevueId,
                        principalTable: "RevueDeDirections",
                        principalColumn: "RevueId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RevueLegalTexts_Texts_TextId",
                        column: x => x.TextId,
                        principalTable: "Texts",
                        principalColumn: "TextId");
                });

            migrationBuilder.CreateTable(
                name: "RevueRequirements",
                columns: table => new
                {
                    RequirementId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RevueId = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Implementation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Communication = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FollowUp = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RevueRequirements", x => x.RequirementId);
                    table.ForeignKey(
                        name: "FK_RevueRequirements_RevueDeDirections_RevueId",
                        column: x => x.RevueId,
                        principalTable: "RevueDeDirections",
                        principalColumn: "RevueId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RevueStakeholders",
                columns: table => new
                {
                    StakeholderId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RevueId = table.Column<int>(type: "int", nullable: false),
                    StakeholderName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RelationshipStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FollowUp = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RevueStakeholders", x => x.StakeholderId);
                    table.ForeignKey(
                        name: "FK_RevueStakeholders_RevueDeDirections_RevueId",
                        column: x => x.RevueId,
                        principalTable: "RevueDeDirections",
                        principalColumn: "RevueId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RevueActions_RevueId",
                table: "RevueActions",
                column: "RevueId");

            migrationBuilder.CreateIndex(
                name: "IX_RevueDeDirections_CompanyId",
                table: "RevueDeDirections",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_RevueDeDirections_CreatedById",
                table: "RevueDeDirections",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_RevueDeDirections_DomainId",
                table: "RevueDeDirections",
                column: "DomainId");

            migrationBuilder.CreateIndex(
                name: "IX_RevueLegalTexts_RevueId",
                table: "RevueLegalTexts",
                column: "RevueId");

            migrationBuilder.CreateIndex(
                name: "IX_RevueLegalTexts_TextId",
                table: "RevueLegalTexts",
                column: "TextId");

            migrationBuilder.CreateIndex(
                name: "IX_RevueRequirements_RevueId",
                table: "RevueRequirements",
                column: "RevueId");

            migrationBuilder.CreateIndex(
                name: "IX_RevueStakeholders_RevueId",
                table: "RevueStakeholders",
                column: "RevueId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RevueActions");

            migrationBuilder.DropTable(
                name: "RevueLegalTexts");

            migrationBuilder.DropTable(
                name: "RevueRequirements");

            migrationBuilder.DropTable(
                name: "RevueStakeholders");

            migrationBuilder.DropTable(
                name: "RevueDeDirections");
        }
    }
}
