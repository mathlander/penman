using AutoMapper;
using PenmanApi.Dtos.Users;
using PenmanApi.Models;

namespace PenmanApi.Profiles
{
    public class UsersProfile : Profile
    {
        public UsersProfile()
        {
            CreateMap<CreateUserDto, Author>();
            CreateMap<Author, CreateUserResponseDto>();
            CreateMap<Author, UpdateUserResponseDto>();
            CreateMap<Author, AuthResponseDto>();
            CreateMap<Author, RefreshResponseDto>();
        }
    }
}
