using Azure.Storage.Blobs;

namespace Vitneboksen_func
{
    public static class UploadTestemony
    {
        public static async Task<IResult> Run(HttpRequest req, string constring)
        {
            string? sessionKey = req.Query["sessionKey"];

            var formdata = await req.ReadFormAsync();
            var videoFile = req.Form.Files.FirstOrDefault(f => f.Name == "video");
            var subFile = req.Form.Files.FirstOrDefault(f => f.Name == "sub");
            if (videoFile == null || subFile == null)
            {
                return Results.BadRequest("No file, stupid.");
            }

            var blobService = new BlobServiceClient(constring);

            var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);
            if (containerClient == null)
            {
                return Results.NotFound("Not found");
            }

            //await Helpers.ExcuteFFmpegCommand("ffmpeg -i fil.mp4 -vf \"subtitles=fil.srt\" -c:a copy output.mp4");

            await containerClient.UploadBlobAsync(videoFile.FileName, videoFile.OpenReadStream());
            await containerClient.UploadBlobAsync(subFile.FileName, subFile.OpenReadStream());

            return Results.Ok("Ok");
        }

    }
}
