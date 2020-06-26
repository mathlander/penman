using AutoMapper;
using PenmanApi.Dtos.Users;
using PenmanApi.Models;

namespace PenmanApi.Profiles
{
    public class UsersProfile : Profile
    {
        public UsersProfile()
        {
            CreateMap<CreateUserDto, User>();
            // CreateMap<User, AuthenticationResponseDto>();
            CreateMap<User, ProfileResponseDto>();
        }
    }
}
