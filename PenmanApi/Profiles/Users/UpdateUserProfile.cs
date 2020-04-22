using System;
using AutoMapper;
using PenmanApi.Dtos.Users;
using PenmanApi.Models;

namespace PenmanApi.Profiles.Users
{
    public class UpdateUserProfile : Profile
    {
        public UpdateUserProfile()
        {
            CreateMap<Author, UpdateUserDto>();
        }
    }
}
