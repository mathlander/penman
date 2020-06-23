using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Tags
{
    [Serializable]
    public class UpdateTagDto
    {
        [Required]
        public long TagId { get; set; }

        [Required]
        public long UserId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        [StringLength(50)]
        public string TagName { get; set; }

        public override string ToString()
        {
            return $"TagId: {TagId}, UserId: {UserId}, ClientId: {ClientId}, TagName: {TagName}";
        }
    }
}
