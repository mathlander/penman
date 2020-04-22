using System;

namespace PenmanApi.Dtos.Users
{
    [Serializable]
    public class UpdateUserResponseDto
    {
        public long AuthorId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}, Username: {Username}, Email: {Email}, FirstName: {FirstName}, MiddleName: {MiddleName}, LastName: {LastName}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}";
        }
    }
}
