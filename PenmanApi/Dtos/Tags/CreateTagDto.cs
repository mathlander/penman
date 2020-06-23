using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Tags
{
    [Serializable]
    public class CreateTagDto
    {
        [Required]
        public long UserId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        public string TagName { get; set; }

        public override string ToString()
        {
            return $"UserId: {UserId}, ClientId: {ClientId}, TagName: {TagName}";
        }
    }
}
