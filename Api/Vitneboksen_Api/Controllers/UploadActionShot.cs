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

        var srtContent = "1\n00:00:00,000 --> 00:00:05,000\nhello\n";
        File.WriteAllText(subFilePath, srtContent);

        try
        {
            var outputFilePath = Path.Combine(tempPath, $"{DateTime.Now.ToFileTimeUtc()}.mp4");

            var ffmpegCmd = OperatingSystem.IsWindows() ?
                        $"-i \"{videoFilePath}\" -vf \"subtitles='{subFilePath.Replace("\\", "\\\\").Replace(":", "\\:")}'\" -r 30 -qscale:v 1 -c:v mpeg4 -c:a aac \"{outputFilePath}\""
                        : $"-i \"{videoFilePath}\" -vf \"subtitles='{subFilePath}'\" -c:v mpeg4 -r 30 -qscale:v 1 -c:a aac \"{outputFilePath}\"";

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
