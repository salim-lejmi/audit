using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Actions_TextRequirements_RequirementId",
                table: "Actions");

            migrationBuilder.DropForeignKey(
                name: "FK_Actions_Texts_TextId",
                table: "Actions");

            migrationBuilder.DropForeignKey(
                name: "FK_Actions_Users_CreatedById",
                table: "Actions");

            migrationBuilder.DropForeignKey(
                name: "FK_Actions_Users_ResponsibleId",
                table: "Actions");

            migrationBuilder.DropForeignKey(
                name: "FK_ComplianceEvaluations_TextRequirements_RequirementId",
                table: "ComplianceEvaluations");

            migrationBuilder.DropForeignKey(
                name: "FK_ComplianceEvaluations_Texts_TextId",
                table: "ComplianceEvaluations");

            migrationBuilder.DropForeignKey(
                name: "FK_ComplianceEvaluations_Users_UserId",
                table: "ComplianceEvaluations");

            migrationBuilder.DropForeignKey(
                name: "FK_SubThemes_Themes_ThemeId",
                table: "SubThemes");

            migrationBuilder.DropForeignKey(
                name: "FK_Texts_Users_CreatedById",
                table: "Texts");

            migrationBuilder.DropForeignKey(
                name: "FK_Themes_Domains_DomainId",
                table: "Themes");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Texts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "TextId",
                table: "Actions",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Actions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Texts_CompanyId",
                table: "Texts",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Actions_CompanyId",
                table: "Actions",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Actions_Companies_CompanyId",
                table: "Actions",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Actions_TextRequirements_RequirementId",
                table: "Actions",
                column: "RequirementId",
                principalTable: "TextRequirements",
                principalColumn: "RequirementId");

            migrationBuilder.AddForeignKey(
                name: "FK_Actions_Texts_TextId",
                table: "Actions",
                column: "TextId",
                principalTable: "Texts",
                principalColumn: "TextId");

            migrationBuilder.AddForeignKey(
                name: "FK_Actions_Users_CreatedById",
                table: "Actions",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Actions_Users_ResponsibleId",
                table: "Actions",
                column: "ResponsibleId",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ComplianceEvaluations_TextRequirements_RequirementId",
                table: "ComplianceEvaluations",
                column: "RequirementId",
                principalTable: "TextRequirements",
                principalColumn: "RequirementId");

            migrationBuilder.AddForeignKey(
                name: "FK_ComplianceEvaluations_Texts_TextId",
                table: "ComplianceEvaluations",
                column: "TextId",
                principalTable: "Texts",
                principalColumn: "TextId");

            migrationBuilder.AddForeignKey(
                name: "FK_ComplianceEvaluations_Users_UserId",
                table: "ComplianceEvaluations",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_SubThemes_Themes_ThemeId",
                table: "SubThemes",
                column: "ThemeId",
                principalTable: "Themes",
                principalColumn: "ThemeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Texts_Companies_CompanyId",
                table: "Texts",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "CompanyId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Texts_Users_CreatedById",
                table: "Texts",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Themes_Domains_DomainId",
                table: "Themes",
                column: "DomainId",
                principalTable: "Domains",
                principalColumn: "DomainId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Actions_Companies_CompanyId",
                table: "Actions");

            migrationBuilder.DropForeignKey(
                name: "FK_Actions_TextRequirements_RequirementId",
                table: "Actions");

            migrationBuilder.DropForeignKey(
                name: "FK_Actions_Texts_TextId",
                table: "Actions");

            migrationBuilder.DropForeignKey(
                name: "FK_Actions_Users_CreatedById",
                table: "Actions");

            migrationBuilder.DropForeignKey(
                name: "FK_Actions_Users_ResponsibleId",
                table: "Actions");

            migrationBuilder.DropForeignKey(
                name: "FK_ComplianceEvaluations_TextRequirements_RequirementId",
                table: "ComplianceEvaluations");

            migrationBuilder.DropForeignKey(
                name: "FK_ComplianceEvaluations_Texts_TextId",
                table: "ComplianceEvaluations");

            migrationBuilder.DropForeignKey(
                name: "FK_ComplianceEvaluations_Users_UserId",
                table: "ComplianceEvaluations");

            migrationBuilder.DropForeignKey(
                name: "FK_SubThemes_Themes_ThemeId",
                table: "SubThemes");

            migrationBuilder.DropForeignKey(
                name: "FK_Texts_Companies_CompanyId",
                table: "Texts");

            migrationBuilder.DropForeignKey(
                name: "FK_Texts_Users_CreatedById",
                table: "Texts");

            migrationBuilder.DropForeignKey(
                name: "FK_Themes_Domains_DomainId",
                table: "Themes");

            migrationBuilder.DropIndex(
                name: "IX_Texts_CompanyId",
                table: "Texts");

            migrationBuilder.DropIndex(
                name: "IX_Actions_CompanyId",
                table: "Actions");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Texts");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Actions");

            migrationBuilder.AlterColumn<int>(
                name: "TextId",
                table: "Actions",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Actions_TextRequirements_RequirementId",
                table: "Actions",
                column: "RequirementId",
                principalTable: "TextRequirements",
                principalColumn: "RequirementId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Actions_Texts_TextId",
                table: "Actions",
                column: "TextId",
                principalTable: "Texts",
                principalColumn: "TextId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Actions_Users_CreatedById",
                table: "Actions",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Actions_Users_ResponsibleId",
                table: "Actions",
                column: "ResponsibleId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ComplianceEvaluations_TextRequirements_RequirementId",
                table: "ComplianceEvaluations",
                column: "RequirementId",
                principalTable: "TextRequirements",
                principalColumn: "RequirementId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ComplianceEvaluations_Texts_TextId",
                table: "ComplianceEvaluations",
                column: "TextId",
                principalTable: "Texts",
                principalColumn: "TextId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ComplianceEvaluations_Users_UserId",
                table: "ComplianceEvaluations",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SubThemes_Themes_ThemeId",
                table: "SubThemes",
                column: "ThemeId",
                principalTable: "Themes",
                principalColumn: "ThemeId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Texts_Users_CreatedById",
                table: "Texts",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Themes_Domains_DomainId",
                table: "Themes",
                column: "DomainId",
                principalTable: "Domains",
                principalColumn: "DomainId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
