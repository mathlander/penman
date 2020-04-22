using System;
using AutoMapper;
using PenmanApi.Dtos.Users;
using PenmanApi.Models;

namespace PenmanApi.Profiles.Users
{
    public class CreateUserProfile : Profile
    {
        public CreateUserProfile()
        {
            CreateMap<CreateUserDto, Author>();
            CreateMap<Author, CreateUserResponseDto>();
        }
    }
}
