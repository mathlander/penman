using AutoMapper;
using PenmanApi.Dtos.Shorts;
using PenmanApi.Models;

namespace PenmanApi.Profiles
{
    public class ShortsProfile : Profile
    {
        public ShortsProfile()
        {
            CreateMap<CreateShortDto, Short>();
            CreateMap<Short, CreateShortResponseDto>();
            CreateMap<Short, UpdateShortResponseDto>();
            CreateMap<Short, ReadShortDto>();
        }
    }
}
