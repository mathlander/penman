using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Personifications
{
    [Serializable]
    public class CreatePersonificationDto
    {
        [Required]
        public long UserId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(50)]
        public string MiddleName { get; set; }

        [Required]
        [StringLength(50)]
        public string LastName { get; set; }

        [Required]
        public DateTime Birthday { get; set; }

        public override string ToString()
        {
            return $"UserId: {UserId}, ClientId: {ClientId}, FirstName: {FirstName}, MiddleName: {MiddleName}, LastName: {LastName}, Birthday: {Birthday}";
        }
    }
}
