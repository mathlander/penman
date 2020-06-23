using AutoMapper;
using PenmanApi.Dtos.Prompts;
using PenmanApi.Models;

namespace PenmanApi.Profiles
{
    public class PromptsProfile : Profile
    {
        public PromptsProfile()
        {
            CreateMap<CreatePromptDto, Prompt>();
            CreateMap<Prompt, PromptResponseDto>();
        }
    }
}
