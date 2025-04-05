using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddTaxonomyModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Domain",
                table: "Texts");

            migrationBuilder.DropColumn(
                name: "SubTheme",
                table: "Texts");

            migrationBuilder.DropColumn(
                name: "Theme",
                table: "Texts");

            migrationBuilder.AddColumn<int>(
                name: "DomainId",
                table: "Texts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SubThemeId",
                table: "Texts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ThemeId",
                table: "Texts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Domains",
                columns: table => new
                {
                    DomainId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Domains", x => x.DomainId);
                    table.ForeignKey(
                        name: "FK_Domains_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "Themes",
                columns: table => new
                {
                    ThemeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DomainId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Themes", x => x.ThemeId);
                    table.ForeignKey(
                        name: "FK_Themes_Domains_DomainId",
                        column: x => x.DomainId,
                        principalTable: "Domains",
                        principalColumn: "DomainId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Themes_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "SubThemes",
                columns: table => new
                {
                    SubThemeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ThemeId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedById = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubThemes", x => x.SubThemeId);
                    table.ForeignKey(
                        name: "FK_SubThemes_Themes_ThemeId",
                        column: x => x.ThemeId,
                        principalTable: "Themes",
                        principalColumn: "ThemeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubThemes_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.InsertData(
                table: "Domains",
                columns: new[] { "DomainId", "CreatedAt", "CreatedById", "Name" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 3, 10, 1, 2, 0, 0, DateTimeKind.Utc), null, "Santé et sécurité au travail" },
                    { 2, new DateTime(2025, 3, 10, 1, 2, 0, 0, DateTimeKind.Utc), null, "Environnement" },
                    { 3, new DateTime(2025, 3, 10, 1, 2, 0, 0, DateTimeKind.Utc), null, "Qualité" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Texts_DomainId",
                table: "Texts",
                column: "DomainId");

            migrationBuilder.CreateIndex(
                name: "IX_Texts_SubThemeId",
                table: "Texts",
                column: "SubThemeId");

            migrationBuilder.CreateIndex(
                name: "IX_Texts_ThemeId",
                table: "Texts",
                column: "ThemeId");

            migrationBuilder.CreateIndex(
                name: "IX_Domains_CreatedById",
                table: "Domains",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_SubThemes_CreatedById",
                table: "SubThemes",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_SubThemes_ThemeId",
                table: "SubThemes",
                column: "ThemeId");

            migrationBuilder.CreateIndex(
                name: "IX_Themes_CreatedById",
                table: "Themes",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Themes_DomainId",
                table: "Themes",
                column: "DomainId");

            migrationBuilder.AddForeignKey(
                name: "FK_Texts_Domains_DomainId",
                table: "Texts",
                column: "DomainId",
                principalTable: "Domains",
                principalColumn: "DomainId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Texts_SubThemes_SubThemeId",
                table: "Texts",
                column: "SubThemeId",
                principalTable: "SubThemes",
                principalColumn: "SubThemeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Texts_Themes_ThemeId",
                table: "Texts",
                column: "ThemeId",
                principalTable: "Themes",
                principalColumn: "ThemeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Texts_Domains_DomainId",
                table: "Texts");

            migrationBuilder.DropForeignKey(
                name: "FK_Texts_SubThemes_SubThemeId",
                table: "Texts");

            migrationBuilder.DropForeignKey(
                name: "FK_Texts_Themes_ThemeId",
                table: "Texts");

            migrationBuilder.DropTable(
                name: "SubThemes");

            migrationBuilder.DropTable(
                name: "Themes");

            migrationBuilder.DropTable(
                name: "Domains");

            migrationBuilder.DropIndex(
                name: "IX_Texts_DomainId",
                table: "Texts");

            migrationBuilder.DropIndex(
                name: "IX_Texts_SubThemeId",
                table: "Texts");

            migrationBuilder.DropIndex(
                name: "IX_Texts_ThemeId",
                table: "Texts");

            migrationBuilder.DropColumn(
                name: "DomainId",
                table: "Texts");

            migrationBuilder.DropColumn(
                name: "SubThemeId",
                table: "Texts");

            migrationBuilder.DropColumn(
                name: "ThemeId",
                table: "Texts");

            migrationBuilder.AddColumn<string>(
                name: "Domain",
                table: "Texts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SubTheme",
                table: "Texts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Theme",
                table: "Texts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
