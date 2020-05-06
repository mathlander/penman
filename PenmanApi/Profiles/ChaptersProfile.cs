using AutoMapper;
using PenmanApi.Dtos.Chapters;
using PenmanApi.Models;

namespace PenmanApi.Chapters
{
    public class ChaptersProfile : Profile
    {
        public ChaptersProfile()
        {
            CreateMap<CreateChapterDto, Chapter>();
            CreateMap<Chapter, CreateChapterResponseDto>();
            CreateMap<Chapter, UpdateChapterResponseDto>();
            CreateMap<Chapter, ReadChapterResponseDto>();
        }
    }
}
