using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class updaterevuemodels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "RevueStakeholders",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CreatedById",
                table: "RevueStakeholders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "RevueRequirements",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CreatedById",
                table: "RevueRequirements",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "RevueLegalTexts",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CreatedById",
                table: "RevueLegalTexts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "RevueActions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "CreatedById",
                table: "RevueActions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_RevueStakeholders_CreatedById",
                table: "RevueStakeholders",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_RevueRequirements_CreatedById",
                table: "RevueRequirements",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_RevueLegalTexts_CreatedById",
                table: "RevueLegalTexts",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_RevueActions_CreatedById",
                table: "RevueActions",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_RevueActions_Users_CreatedById",
                table: "RevueActions",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_RevueLegalTexts_Users_CreatedById",
                table: "RevueLegalTexts",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_RevueRequirements_Users_CreatedById",
                table: "RevueRequirements",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_RevueStakeholders_Users_CreatedById",
                table: "RevueStakeholders",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RevueActions_Users_CreatedById",
                table: "RevueActions");

            migrationBuilder.DropForeignKey(
                name: "FK_RevueLegalTexts_Users_CreatedById",
                table: "RevueLegalTexts");

            migrationBuilder.DropForeignKey(
                name: "FK_RevueRequirements_Users_CreatedById",
                table: "RevueRequirements");

            migrationBuilder.DropForeignKey(
                name: "FK_RevueStakeholders_Users_CreatedById",
                table: "RevueStakeholders");

            migrationBuilder.DropIndex(
                name: "IX_RevueStakeholders_CreatedById",
                table: "RevueStakeholders");

            migrationBuilder.DropIndex(
                name: "IX_RevueRequirements_CreatedById",
                table: "RevueRequirements");

            migrationBuilder.DropIndex(
                name: "IX_RevueLegalTexts_CreatedById",
                table: "RevueLegalTexts");

            migrationBuilder.DropIndex(
                name: "IX_RevueActions_CreatedById",
                table: "RevueActions");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "RevueStakeholders");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "RevueStakeholders");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "RevueRequirements");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "RevueRequirements");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "RevueLegalTexts");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "RevueLegalTexts");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "RevueActions");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "RevueActions");
        }
    }
}
