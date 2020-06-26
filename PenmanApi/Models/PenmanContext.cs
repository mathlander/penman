using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace PenmanApi.Models
{
    public class PenmanContext : DbContext
    {
        public virtual DbSet<Prompt> Prompts { get; set; }
        public virtual DbSet<RefreshToken> RefreshTokens { get; set; }
        public virtual DbSet<User> Users { get; set; }

        public PenmanContext() {}
        public PenmanContext(DbContextOptions<PenmanContext> options) : base(options) {}

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Prompt>(entity =>
            {
                entity.HasKey(e => e.PromptId)
                    .HasName("prompts_pkey");

                entity.ToTable("prompts");

                entity.HasIndex(e => e.ClientId)
                    .HasName("prompts_client_id_key")
                    .IsUnique();

                entity.Property(e => e.PromptId).HasColumnName("prompt_id");

                entity.Property(e => e.Body)
                    .IsRequired()
                    .HasColumnName("body");

                entity.Property(e => e.ClientId).HasColumnName("client_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.EventEndDate)
                    .HasColumnName("event_end_date")
                    .HasColumnType("timestamp with time zone");

                entity.Property(e => e.EventStartDate)
                    .HasColumnName("event_start_date")
                    .HasColumnType("timestamp with time zone");

                entity.Property(e => e.IsDeleted)
                    .IsRequired()
                    .HasColumnName("is_deleted")
                    .HasDefaultValueSql("(0)::boolean");

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasColumnName("title")
                    .HasMaxLength(50);

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Prompts)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("fk_prompt_user");
            });

            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.RefreshTokenId)
                    .HasName("refresh_tokens_pkey");

                entity.ToTable("refresh_tokens");

                entity.Property(e => e.RefreshTokenId).HasColumnName("refresh_token_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.EncryptionKey)
                    .IsRequired()
                    .HasColumnName("encryption_key");

                entity.Property(e => e.InitialVector)
                    .IsRequired()
                    .HasColumnName("initial_vector");

                entity.Property(e => e.IsRevoked)
                    .IsRequired()
                    .HasColumnName("is_revoked")
                    .HasDefaultValueSql("(0)::boolean");

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.RefreshTokenExpiryDate)
                    .HasColumnName("refresh_token_expiry_date")
                    .HasColumnType("timestamp with time zone");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.RefreshTokens)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("fk_refreshtoken_userid");
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId)
                    .HasName("users_pkey");

                entity.ToTable("users");

                entity.HasIndex(e => e.ClientId)
                    .HasName("users_client_id_key")
                    .IsUnique();

                entity.HasIndex(e => e.Email)
                    .HasName("users_email_key")
                    .IsUnique();

                entity.HasIndex(e => e.Username)
                    .HasName("users_username_key")
                    .IsUnique();

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.Property(e => e.ClientId).HasColumnName("client_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasColumnName("email")
                    .HasMaxLength(320);

                entity.Property(e => e.FirstName)
                    .IsRequired()
                    .HasColumnName("first_name")
                    .HasMaxLength(50);

                entity.Property(e => e.IsDeleted)
                    .IsRequired()
                    .HasColumnName("is_deleted")
                    .HasDefaultValueSql("(0)::boolean");

                entity.Property(e => e.IsLocked)
                    .IsRequired()
                    .HasColumnName("is_locked")
                    .HasDefaultValueSql("(0)::boolean");

                entity.Property(e => e.LastName)
                    .IsRequired()
                    .HasColumnName("last_name")
                    .HasMaxLength(50);

                entity.Property(e => e.MiddleName)
                    .IsRequired()
                    .HasColumnName("middle_name")
                    .HasMaxLength(50);

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.PasswordHash)
                    .IsRequired()
                    .HasColumnName("password_hash");

                entity.Property(e => e.PasswordSalt)
                    .IsRequired()
                    .HasColumnName("password_salt");

                entity.Property(e => e.Username)
                    .IsRequired()
                    .HasColumnName("username")
                    .HasMaxLength(50);
            });
        }
    }
}
