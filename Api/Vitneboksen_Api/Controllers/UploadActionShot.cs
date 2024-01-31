namespace Vitneboksen_Api.Controllers;

public static class UploadActionShot
{
    public static async Task<IResult> Run(HttpRequest req, string constring)
    {
        var blobService = new Azure.Storage.Blobs.BlobServiceClient(constring);
        string sharedKey = req.Query["sharedKey"];

        var formdata = await req.ReadFormAsync();
        var videoFile = req.Form.Files.FirstOrDefault(f => f.Name == "video");
        if (videoFile == null)
        {
            return Results.BadRequest("No file, stupid.");
        }

        var containerClient = Helpers.GetContainerBySharedKey(blobService, sharedKey);
        if (containerClient == null)
        {
            return Results.NotFound("Not found");
        }

        var tempFolder = $"action-{Guid.NewGuid()}";
        var tempPath = Path.Combine(Environment.CurrentDirectory, tempFolder);
        Directory.CreateDirectory(tempPath);
        var videoFilePath = Path.Combine(tempPath, "file.mp4");
        var subFilePath = Path.Combine(tempPath, "file.srt");

        using (var fileStream = new FileStream(videoFilePath, FileMode.Create))
        {
            await videoFile.CopyToAsync(fileStream);
        }

        try
        {
            var outputFilePath = Path.Combine(tempPath, $"{DateTime.Now.ToFileTimeUtc()}-actionshot.mp4");

            var ffmpegCmd = $"-i \"{videoFilePath}\" -vf \"scale=-1:720,pad=1280:720:(1280-iw)/2:(720-ih)/2\" -r 30 -c:v libx264 -c:a aac -ar 48000 \"{outputFilePath}\"";

            await Helpers.ExecuteFFmpegCommand(ffmpegCmd);

            var fileInfo = new FileInfo(outputFilePath);
            if (fileInfo.Exists && fileInfo.Length > 0)
            {
                using var fileStream = new FileStream(outputFilePath, FileMode.Open);
                await containerClient.UploadBlobAsync(Path.GetFileName(outputFilePath), fileStream);
            }
            else
            {
                return Results.BadRequest("FFmpeg processing failed.");
            }

            var blob = containerClient.GetBlobClient(Constants.ConcatinatedVideoFileName);
            if (blob.Exists())
            {
                await blob.DeleteAsync();
            }

        }
        finally
        {
            Directory.Delete(tempPath, true);
        }

        return Results.Created();
    }

}
