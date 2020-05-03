using AutoMapper;
using PenmanApi.Dtos.Books;
using PenmanApi.Models;

namespace PenmanApi.Books
{
    public class BooksProfile : Profile
    {
        public BooksProfile()
        {
            CreateMap<CreateBookDto, Book>();
            CreateMap<Book, CreateBookResponseDto>();
            CreateMap<Book, UpdateBookResponseDto>();
            CreateMap<Book, ReadBookDto>();
        }
    }
}
