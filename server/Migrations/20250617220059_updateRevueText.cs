using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class updateRevueText : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TextRequirementId",
                table: "RevueRequirements",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_RevueRequirements_TextRequirementId",
                table: "RevueRequirements",
                column: "TextRequirementId");

            migrationBuilder.AddForeignKey(
                name: "FK_RevueRequirements_TextRequirements_TextRequirementId",
                table: "RevueRequirements",
                column: "TextRequirementId",
                principalTable: "TextRequirements",
                principalColumn: "RequirementId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RevueRequirements_TextRequirements_TextRequirementId",
                table: "RevueRequirements");

            migrationBuilder.DropIndex(
                name: "IX_RevueRequirements_TextRequirementId",
                table: "RevueRequirements");

            migrationBuilder.DropColumn(
                name: "TextRequirementId",
                table: "RevueRequirements");
        }
    }
}
