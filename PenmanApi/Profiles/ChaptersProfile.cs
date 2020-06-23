using AutoMapper;
using PenmanApi.Dtos.Chapters;
using PenmanApi.Models;

namespace PenmanApi.Profiles
{
    public class ChaptersProfile : Profile
    {
        public ChaptersProfile()
        {
            CreateMap<CreateChapterDto, Chapter>();
            CreateMap<Chapter, ChapterResponseDto>();
        }
    }
}
