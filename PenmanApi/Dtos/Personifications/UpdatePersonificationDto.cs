using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Personifications
{
    [Serializable]
    public class UpdatePersonificationDto
    {
        [Required]
        public long PersonificationId { get; set; }

        [Required]
        public long AuthorId { get; set; }

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
            return $"AuthorId: {AuthorId}, FirstName: {FirstName}, MiddleName: {MiddleName}, LastName: {LastName}, Birthday: {Birthday}";
        }
    }
}
