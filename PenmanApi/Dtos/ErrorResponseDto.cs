using System;

namespace PenmanApi
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

        public string InternalErrorMessage { get; set; }
        public string DisplayErrorMessage { get; set; }
    }
}
