using System;

namespace PenmanApi.Dtos.Users
{
    [Serializable]
    public class ProfileResponseDto
    {
        public long UserId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public Guid ClientId { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsDeleted { get; set; }

        public override string ToString()
        {
            return $"UserId: {UserId}, Username: {Username}, Email: {Email}, ClientId: {ClientId}, FirstName: {FirstName}, MiddleName: {MiddleName}, LastName: {LastName}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}, IsDeleted: {IsDeleted}";
        }
    }
}
