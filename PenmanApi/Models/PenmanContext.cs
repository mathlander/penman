using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace PenmanApi.Models
{
    public class PenmanContext : DbContext
    {
        public virtual DbSet<Book> Books { get; set; }
        public virtual DbSet<Chapter> Chapters { get; set; }
        public virtual DbSet<Personification> Personifications { get; set; }
        public virtual DbSet<Prompt> Prompts { get; set; }
        public virtual DbSet<RefreshToken> RefreshTokens { get; set; }
        public virtual DbSet<Relationship> Relationships { get; set; }
        public virtual DbSet<Short> Shorts { get; set; }
        public virtual DbSet<Tag> Tags { get; set; }
        public virtual DbSet<User> Users { get; set; }

        public PenmanContext() {}

        public PenmanContext(DbContextOptions<PenmanContext> options) : base(options) {}

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Chapter>(entity =>
            {
                entity.HasKey(e => e.ChapterId)
                    .HasName("chapters_pkey");

                entity.ToTable("chapters");

                entity.HasIndex(e => e.ClientId)
                    .HasName("chapters_client_id_key")
                    .IsUnique();

                entity.Property(e => e.ChapterId).HasColumnName("chapter_id");

                entity.Property(e => e.Body)
                    .IsRequired()
                    .HasColumnName("body");

                entity.Property(e => e.ClientId).HasColumnName("client_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.EventEnd)
                    .HasColumnName("event_end")
                    .HasColumnType("timestamp with time zone");

                entity.Property(e => e.EventStart)
                    .HasColumnName("event_start")
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

                entity.Property(e => e.SortOrder)
                    .IsRequired()
                    .HasColumnName("sort_order");

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Chapters)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("fk_chapter_userid");

                entity.Property(e => e.BookId).HasColumnName("book_id");

                entity.HasOne(d => d.Book)
                    .WithMany(p => p.Chapters)
                    .HasForeignKey(d => d.BookId)
                    .HasConstraintName("fk_chapter_bookid");
            });

            modelBuilder.Entity<Book>(entity =>
            {
                entity.HasKey(e => e.BookId)
                    .HasName("books_pkey");

                entity.ToTable("books");

                entity.HasIndex(e => e.ClientId)
                    .HasName("books_client_id_key")
                    .IsUnique();

                entity.Property(e => e.BookId).HasColumnName("book_id");

                entity.Property(e => e.ClientId).HasColumnName("client_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.EventEnd)
                    .HasColumnName("event_end")
                    .HasColumnType("timestamp with time zone");

                entity.Property(e => e.EventStart)
                    .HasColumnName("event_start")
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
                    .WithMany(p => p.Books)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("fk_book_userid");
            });

            modelBuilder.Entity<Personification>(entity =>
            {
                entity.HasKey(e => e.PersonificationId)
                    .HasName("personifications_pkey");

                entity.ToTable("personifications");

                entity.HasIndex(e => e.ClientId)
                    .HasName("personifications_client_id_key")
                    .IsUnique();

                entity.Property(e => e.PersonificationId).HasColumnName("personification_id");

                entity.Property(e => e.Birthday)
                    .HasColumnName("birthday")
                    .HasColumnType("timestamp with time zone");

                entity.Property(e => e.ClientId).HasColumnName("client_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.FirstName)
                    .IsRequired()
                    .HasColumnName("first_name")
                    .HasMaxLength(50);

                entity.Property(e => e.IsDeleted)
                    .IsRequired()
                    .HasColumnName("is_deleted")
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

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Personifications)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("fk_personification_userid");
            });

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

                entity.Property(e => e.EventEnd)
                    .HasColumnName("event_end")
                    .HasColumnType("timestamp with time zone");

                entity.Property(e => e.EventStart)
                    .HasColumnName("event_start")
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

            modelBuilder.Entity<Relationship>(entity =>
            {
                entity.HasNoKey();

                entity.ToTable("relationships");

                entity.HasIndex(e => e.ClientId)
                    .HasName("chapters_client_id_key")
                    .IsUnique();

                entity.Property(e => e.ClientId).HasColumnName("client_id");

                entity.Property(e => e.ChipClientId).HasColumnName("chip_client_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.IsDeleted)
                    .IsRequired()
                    .HasColumnName("is_deleted")
                    .HasDefaultValueSql("(0)::boolean");

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.ObjectClientId).HasColumnName("object_client_id");

                entity.Property(e => e.RelationshipId)
                    .HasColumnName("relationship_id")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("fk_relationship_userid");
            });

            modelBuilder.Entity<Short>(entity =>
            {
                entity.HasKey(e => e.ShortId)
                    .HasName("shorts_pkey");

                entity.ToTable("shorts");

                entity.HasIndex(e => e.ClientId)
                    .HasName("shorts_client_id_key")
                    .IsUnique();

                entity.Property(e => e.ShortId).HasColumnName("short_id");

                entity.Property(e => e.Body)
                    .IsRequired()
                    .HasColumnName("body");

                entity.Property(e => e.ClientId).HasColumnName("client_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.EventEnd)
                    .HasColumnName("event_end")
                    .HasColumnType("timestamp with time zone");

                entity.Property(e => e.EventStart)
                    .HasColumnName("event_start")
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
                    .WithMany(p => p.Shorts)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("fk_short_userid");
            });

            modelBuilder.Entity<Tag>(entity =>
            {
                entity.HasKey(e => e.TagId)
                    .HasName("tags_pkey");

                entity.ToTable("tags");

                entity.HasIndex(e => e.ClientId)
                    .HasName("tags_client_id_key")
                    .IsUnique();

                entity.Property(e => e.TagId).HasColumnName("tag_id");

                entity.Property(e => e.ClientId).HasColumnName("client_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.IsDeleted)
                    .IsRequired()
                    .HasColumnName("is_deleted")
                    .HasDefaultValueSql("(0)::boolean");

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.TagName)
                    .IsRequired()
                    .HasColumnName("tag_name")
                    .HasMaxLength(50);

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.Tags)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("fk_tag_userid");
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId)
                    .HasName("users_pkey");

                entity.ToTable("users");

                entity.HasIndex(e => e.Email)
                    .HasName("users_email_key")
                    .IsUnique();

                entity.HasIndex(e => e.Username)
                    .HasName("users_username_key")
                    .IsUnique();

                entity.Property(e => e.UserId).HasColumnName("user_id");

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
