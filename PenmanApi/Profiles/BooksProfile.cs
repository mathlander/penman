using AutoMapper;
using PenmanApi.Dtos.Books;
using PenmanApi.Models;

namespace PenmanApi.Profiles
{
    public class BooksProfile : Profile
    {
        public BooksProfile()
        {
            CreateMap<CreateBookDto, Book>();
            CreateMap<Book, BookResponseDto>();
        }
    }
}
