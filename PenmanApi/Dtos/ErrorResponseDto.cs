using System;

namespace PenmanApi.Dtos
{
    [Serializable]
    public class ErrorResponseDto
    {
        public ErrorResponseDto() {}

        public ErrorResponseDto(Exception ex)
        {
            InternalErrorMessage = ex.Message;
            DisplayErrorMessage = "An error has occurred while processing your request.";
        }

        public int ErrorCode { get; set; } = (int) ErrorCodes.Unknown;
        public string InternalErrorMessage { get; set; }
        public string DisplayErrorMessage { get; set; }
    }
}
