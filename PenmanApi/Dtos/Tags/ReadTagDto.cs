using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Tags
{
    [Serializable]
    public class ReadTagDto
    {
        [Required]
        public long TagId { get; set; }

        public override string ToString()
        {
            return $"TagId: {TagId}";
        }
    }
}
