using System;

namespace PenmanApi.Dtos.Personifications
{
    [Serializable]
    public class CreatePersonificationResponseDto
    {
        public long PersonificationId { get; set; }
        public long AuthorId { get; set; }
        public Guid ClientId { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public DateTime Birthday { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public override string ToString()
        {
            return $"PersonificationId: {PersonificationId}, AuthorId: {AuthorId}, ClientId: {ClientId}, FirstName: {FirstName}, MiddleName: {MiddleName}, LastName: {LastName}, Birthday: {Birthday}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}";
        }
    }
}
