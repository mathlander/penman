using AutoMapper;
using PenmanApi.Dtos.Tags;
using PenmanApi.Models;

namespace PenmanApi.Profiles
{
    public class TagsProfile : Profile
    {
        public TagsProfile()
        {
            CreateMap<CreateTagDto, Tag>();
            CreateMap<Tag, TagResponseDto>();
        }
    }
}
