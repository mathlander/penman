using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace PenmanApi.Models
{
    public class PenmanContext : DbContext
    {
        public virtual DbSet<Author> Author { get; set; }
        public virtual DbSet<Book> Book { get; set; }
        public virtual DbSet<Chapter> Chapter { get; set; }
        public virtual DbSet<Personification> Personification { get; set; }
        public virtual DbSet<PersonificationTagJoin> PersonificationTagJoin { get; set; }
        public virtual DbSet<Prompt> Prompt { get; set; }
        public virtual DbSet<PromptPersonificationJoin> PromptPersonificationJoin { get; set; }
        public virtual DbSet<PromptTagJoin> PromptTagJoin { get; set; }
        public virtual DbSet<RefreshToken> RefreshToken { get; set; }
        public virtual DbSet<Short> Short { get; set; }
        public virtual DbSet<ShortPersonificationJoin> ShortPersonificationJoin { get; set; }
        public virtual DbSet<ShortPromptJoin> ShortPromptJoin { get; set; }
        public virtual DbSet<ShortTagJoin> ShortTagJoin { get; set; }
        public virtual DbSet<Tag> Tag { get; set; }
        public virtual DbSet<Timeline> Timeline { get; set; }

        public PenmanContext() { }

        public PenmanContext(DbContextOptions<PenmanContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Author>(entity =>
            {
                entity.ToTable("author");

                entity.HasIndex(e => e.Email)
                    .HasName("unique_author_email")
                    .IsUnique();

                entity.HasIndex(e => e.Username)
                    .HasName("unique_author_username")
                    .IsUnique();

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

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

            modelBuilder.Entity<Book>(entity =>
            {
                entity.ToTable("book");

                entity.Property(e => e.BookId).HasColumnName("book_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.TimelineId).HasColumnName("timeline_id");

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasColumnName("title")
                    .HasMaxLength(50);

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.Book)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_book_authorid");

                entity.HasOne(d => d.Timeline)
                    .WithMany(p => p.Book)
                    .HasForeignKey(d => d.TimelineId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("fk_book_timelineid");
            });

            modelBuilder.Entity<Chapter>(entity =>
            {
                entity.ToTable("chapter");

                entity.Property(e => e.ChapterId).HasColumnName("chapter_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.Property(e => e.BookId).HasColumnName("book_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.TimelineId).HasColumnName("timeline_id");

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasColumnName("title")
                    .HasMaxLength(50);

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.Chapter)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_chapter_authorid");

                entity.HasOne(d => d.Book)
                    .WithMany(p => p.Chapter)
                    .HasForeignKey(d => d.BookId)
                    .HasConstraintName("fk_chapter_bookid");

                entity.HasOne(d => d.Timeline)
                    .WithMany(p => p.Chapter)
                    .HasForeignKey(d => d.TimelineId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("fk_chapter_timelineid");
            });

            modelBuilder.Entity<Personification>(entity =>
            {
                entity.ToTable("personification");

                entity.Property(e => e.PersonificationId).HasColumnName("personification_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.Property(e => e.Birthday)
                    .HasColumnName("birthday")
                    .HasColumnType("timestamp with time zone");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.FirstName)
                    .IsRequired()
                    .HasColumnName("first_name")
                    .HasMaxLength(50);

                entity.Property(e => e.LastName)
                    .IsRequired()
                    .HasColumnName("last_name")
                    .HasMaxLength(50);

                entity.Property(e => e.MiddleName)
                    .IsRequired()
                    .HasColumnName("middle_name")
                    .HasMaxLength(50)
                    .HasDefaultValueSql("''::character varying");

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.Personification)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_personification_authorid");
            });

            modelBuilder.Entity<PersonificationTagJoin>(entity =>
            {
                entity.HasKey(e => new { e.PersonificationId, e.TagId })
                    .HasName("personification_tag_join_pkey");

                entity.ToTable("personification_tag_join");

                entity.Property(e => e.PersonificationId).HasColumnName("personification_id");

                entity.Property(e => e.TagId).HasColumnName("tag_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.PersonificationTagJoin)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_personificationtagjoin_authorid");

                entity.HasOne(d => d.Personification)
                    .WithMany(p => p.PersonificationTagJoin)
                    .HasForeignKey(d => d.PersonificationId)
                    .HasConstraintName("fk_personificationtagjoin_personificationid");

                entity.HasOne(d => d.Tag)
                    .WithMany(p => p.PersonificationTagJoin)
                    .HasForeignKey(d => d.TagId)
                    .HasConstraintName("fk_personificationtagjoin_tagid");
            });

            modelBuilder.Entity<Prompt>(entity =>
            {
                entity.ToTable("prompt");

                entity.Property(e => e.PromptId).HasColumnName("prompt_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.Property(e => e.Body)
                    .IsRequired()
                    .HasColumnName("body");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasColumnName("title")
                    .HasMaxLength(50);

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.Prompt)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_prompt_authorid");
            });

            modelBuilder.Entity<PromptPersonificationJoin>(entity =>
            {
                entity.HasKey(e => new { e.PromptId, e.PersonificationId })
                    .HasName("prompt_personification_join_pkey");

                entity.ToTable("prompt_personification_join");

                entity.Property(e => e.PromptId).HasColumnName("prompt_id");

                entity.Property(e => e.PersonificationId).HasColumnName("personification_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.PromptPersonificationJoin)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_promptpersonificationjoin_authorid");

                entity.HasOne(d => d.Personification)
                    .WithMany(p => p.PromptPersonificationJoin)
                    .HasForeignKey(d => d.PersonificationId)
                    .HasConstraintName("fk_promptpersonificationjoin_personificationid");

                entity.HasOne(d => d.Prompt)
                    .WithMany(p => p.PromptPersonificationJoin)
                    .HasForeignKey(d => d.PromptId)
                    .HasConstraintName("fk_promptpersonificationjoin_promptid");
            });

            modelBuilder.Entity<PromptTagJoin>(entity =>
            {
                entity.HasKey(e => new { e.PromptId, e.TagId })
                    .HasName("prompt_tag_join_pkey");

                entity.ToTable("prompt_tag_join");

                entity.Property(e => e.PromptId).HasColumnName("prompt_id");

                entity.Property(e => e.TagId).HasColumnName("tag_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.PromptTagJoin)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_prompttagjoin_authorid");

                entity.HasOne(d => d.Prompt)
                    .WithMany(p => p.PromptTagJoin)
                    .HasForeignKey(d => d.PromptId)
                    .HasConstraintName("fk_prompttagjoin_promptid");

                entity.HasOne(d => d.Tag)
                    .WithMany(p => p.PromptTagJoin)
                    .HasForeignKey(d => d.TagId)
                    .HasConstraintName("fk_prompttagjoin_tagid");
            });

            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.ToTable("refresh_token");

                entity.Property(e => e.RefreshTokenId).HasColumnName("refresh_token_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

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

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.RefreshToken)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_refreshtoken_authorid");
            });

            modelBuilder.Entity<Short>(entity =>
            {
                entity.ToTable("short");

                entity.Property(e => e.ShortId).HasColumnName("short_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.Property(e => e.Body)
                    .IsRequired()
                    .HasColumnName("body");

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

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasColumnName("title")
                    .HasMaxLength(50);

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.Short)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_short_authorid");
            });

            modelBuilder.Entity<ShortPersonificationJoin>(entity =>
            {
                entity.HasKey(e => new { e.ShortId, e.PersonificationId })
                    .HasName("short_personification_join_pkey");

                entity.ToTable("short_personification_join");

                entity.Property(e => e.ShortId).HasColumnName("short_id");

                entity.Property(e => e.PersonificationId).HasColumnName("personification_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.ShortPersonificationJoin)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_shortpersonificationjoin_authorid");

                entity.HasOne(d => d.Personification)
                    .WithMany(p => p.ShortPersonificationJoin)
                    .HasForeignKey(d => d.PersonificationId)
                    .HasConstraintName("fk_shortpersonificationjoin_personificationid");

                entity.HasOne(d => d.Short)
                    .WithMany(p => p.ShortPersonificationJoin)
                    .HasForeignKey(d => d.ShortId)
                    .HasConstraintName("fk_shortpersonificationjoin_shortid");
            });

            modelBuilder.Entity<ShortPromptJoin>(entity =>
            {
                entity.HasKey(e => new { e.ShortId, e.PromptId })
                    .HasName("short_prompt_join_pkey");

                entity.ToTable("short_prompt_join");

                entity.Property(e => e.ShortId).HasColumnName("short_id");

                entity.Property(e => e.PromptId).HasColumnName("prompt_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.ShortPromptJoin)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_shortpromptjoin_authorid");

                entity.HasOne(d => d.Prompt)
                    .WithMany(p => p.ShortPromptJoin)
                    .HasForeignKey(d => d.PromptId)
                    .HasConstraintName("fk_shortpromptjoin_promptid");

                entity.HasOne(d => d.Short)
                    .WithMany(p => p.ShortPromptJoin)
                    .HasForeignKey(d => d.ShortId)
                    .HasConstraintName("fk_shortpromptjoin_shortid");
            });

            modelBuilder.Entity<ShortTagJoin>(entity =>
            {
                entity.HasKey(e => new { e.ShortId, e.TagId })
                    .HasName("short_tag_join_pkey");

                entity.ToTable("short_tag_join");

                entity.Property(e => e.ShortId).HasColumnName("short_id");

                entity.Property(e => e.TagId).HasColumnName("tag_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.ShortTagJoin)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_shorttagjoin_authorid");

                entity.HasOne(d => d.Short)
                    .WithMany(p => p.ShortTagJoin)
                    .HasForeignKey(d => d.ShortId)
                    .HasConstraintName("fk_shorttagjoin_shortid");

                entity.HasOne(d => d.Tag)
                    .WithMany(p => p.ShortTagJoin)
                    .HasForeignKey(d => d.TagId)
                    .HasConstraintName("fk_shorttagjoin_tagid");
            });

            modelBuilder.Entity<Tag>(entity =>
            {
                entity.ToTable("tag");

                entity.Property(e => e.TagId).HasColumnName("tag_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("created_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.TagName)
                    .IsRequired()
                    .HasColumnName("tag_name")
                    .HasMaxLength(50);

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.Tag)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_tag_authorid");
            });

            modelBuilder.Entity<Timeline>(entity =>
            {
                entity.ToTable("timeline");

                entity.Property(e => e.TimelineId).HasColumnName("timeline_id");

                entity.Property(e => e.AuthorId).HasColumnName("author_id");

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

                entity.Property(e => e.ModifiedDate)
                    .HasColumnName("modified_date")
                    .HasColumnType("timestamp with time zone")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasColumnName("title")
                    .HasMaxLength(50);

                entity.HasOne(d => d.Author)
                    .WithMany(p => p.Timeline)
                    .HasForeignKey(d => d.AuthorId)
                    .HasConstraintName("fk_timeline_authorid");
            });
        }
    }
}
