using AutoMapper;
using PenmanApi.Dtos.Relationships;
using PenmanApi.Models;

namespace PenmanApi.Profiles
{
    public class RelationshipsProfile : Profile
    {
        public RelationshipsProfile()
        {
            CreateMap<CreateRelationshipDto, Relationship>();
            CreateMap<Relationship, RelationshipResponseDto>();
        }
    }
}
