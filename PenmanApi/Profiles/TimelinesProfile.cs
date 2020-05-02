using AutoMapper;
using PenmanApi.Dtos.Timelines;
using PenmanApi.Models;

namespace PenmanApi.Profiles
{
    public class TimelinesProfile : Profile
    {
        public TimelinesProfile()
        {
            CreateMap<CreateTimelineDto, Timeline>();
            CreateMap<Timeline, CreateTimelineResponseDto>();
            CreateMap<Timeline, UpdateTimelineResponseDto>();
            CreateMap<Timeline, ReadTimelineDto>();
        }
    }
}
