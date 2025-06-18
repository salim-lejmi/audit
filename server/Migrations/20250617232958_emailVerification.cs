    using System;
    using Microsoft.EntityFrameworkCore.Migrations;

    #nullable disable

    namespace server.Migrations
    {
        /// <inheritdoc />
        public partial class emailVerification : Migration
        {
            /// <inheritdoc />
            protected override void Up(MigrationBuilder migrationBuilder)
            {
                migrationBuilder.AlterColumn<DateTime>(
                    name: "CreatedAt",
                    table: "Users",
                    type: "datetime2",
                    nullable: true,
                    oldClrType: typeof(DateTime),
                    oldType: "datetime2");

                migrationBuilder.AddColumn<string>(
                    name: "EmailVerificationToken",
                    table: "Users",
                    type: "nvarchar(max)",
                    nullable: true);

                migrationBuilder.AddColumn<DateTime>(
                    name: "EmailVerificationTokenExpiry",
                    table: "Users",
                    type: "datetime2",
                    nullable: true);

                migrationBuilder.AddColumn<bool>(
                    name: "IsEmailVerified",
                    table: "Users",
                    type: "bit",
                    nullable: false,
                    defaultValue: false);

                migrationBuilder.AddColumn<string>(
                    name: "Status",
                    table: "Users",
                    type: "nvarchar(max)",
                    nullable: false,
                    defaultValue: "Pending");

                migrationBuilder.AlterColumn<string>(
                    name: "Status",
                    table: "Companies",
                    type: "nvarchar(max)",
                    nullable: false,
                    defaultValue: "Pending",
                    oldClrType: typeof(string),
                    oldType: "nvarchar(max)");

                migrationBuilder.AddColumn<bool>(
                    name: "IsEmailVerified",
                    table: "Companies",
                    type: "bit",
                    nullable: false,
                    defaultValue: false);

                migrationBuilder.UpdateData(
                    table: "Users",
                    keyColumn: "UserId",
                    keyValue: 1,
                    columns: new[] { "EmailVerificationToken", "EmailVerificationTokenExpiry", "IsEmailVerified", "Status" },
                    values: new object[] { null, null, true, "Active" });
            }

            /// <inheritdoc />
            protected override void Down(MigrationBuilder migrationBuilder)
            {
                migrationBuilder.DropColumn(
                    name: "EmailVerificationToken",
                    table: "Users");

                migrationBuilder.DropColumn(
                    name: "EmailVerificationTokenExpiry",
                    table: "Users");

                migrationBuilder.DropColumn(
                    name: "IsEmailVerified",
                    table: "Users");

                migrationBuilder.DropColumn(
                    name: "Status",
                    table: "Users");

                migrationBuilder.DropColumn(
                    name: "IsEmailVerified",
                    table: "Companies");

                migrationBuilder.AlterColumn<DateTime>(
                    name: "CreatedAt",
                    table: "Users",
                    type: "datetime2",
                    nullable: false,
                    defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                    oldClrType: typeof(DateTime),
                    oldType: "datetime2",
                    oldNullable: true);

                migrationBuilder.AlterColumn<string>(
                    name: "Status",
                    table: "Companies",
                    type: "nvarchar(max)",
                    nullable: false,
                    oldClrType: typeof(string),
                    oldType: "nvarchar(max)",
                    oldDefaultValue: "Pending");
            }
        }
    }
