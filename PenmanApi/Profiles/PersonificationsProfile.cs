using AutoMapper;
using PenmanApi.Dtos.Personifications;
using PenmanApi.Models;

namespace PenmanApi.Profiles
{
    public class PersonificationsProfile : Profile
    {
        public PersonificationsProfile()
        {
            CreateMap<CreatePersonificationDto, Personification>();
            CreateMap<Personification, PersonificationResponseDto>();
        }
    }
}
