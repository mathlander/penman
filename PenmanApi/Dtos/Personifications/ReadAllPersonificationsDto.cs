using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Personifications
{
    [Serializable]
    public class ReadAllPersonificationsDto
    {
        [Required]
        public long AuthorId { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}";
        }
    }
}
