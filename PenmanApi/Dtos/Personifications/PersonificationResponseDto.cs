using System;

namespace PenmanApi.Dtos.Personifications
{
    [Serializable]
    public class PersonificationResponseDto
    {
        public long PersonificationId { get; set; }
        public long UserId { get; set; }
        public Guid ClientId { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public DateTime Birthday { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsDeleted { get; set; }

        public override string ToString()
        {
            return $"PersonificationId: {PersonificationId}, UserId: {UserId}, ClientId: {ClientId}, FirstName: {FirstName}, MiddleName: {MiddleName}, LastName: {LastName}, Birthday: {Birthday}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}, IsDeleted: {IsDeleted}";
        }
    }
}
