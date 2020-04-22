using System;
using AutoMapper;
using PenmanApi.Dtos.Users;
using PenmanApi.Models;

namespace PenmanApi.Profiles.Users
{
    public class AuthProfile : Profile
    {
        public AuthProfile()
        {
            CreateMap<Author, AuthResponseDto>();
            CreateMap<Author, RefreshResponseDto>();
        }
    }
}
