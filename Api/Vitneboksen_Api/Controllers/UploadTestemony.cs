namespace Vitneboksen_Api.Controllers;

public static class UploadTestimony
{
    public static async Task<IResult> Run(HttpRequest req, string constring)
    {
        var blobService = new Azure.Storage.Blobs.BlobServiceClient(constring);
        string? sessionKey = req.Query["sessionKey"];

        var formdata = await req.ReadFormAsync();
        var videoFile = req.Form.Files.FirstOrDefault(f => f.Name == "video");
        var subFile = req.Form.Files.FirstOrDefault(f => f.Name == "sub");
        if (videoFile == null || subFile == null)
        {
            return Results.BadRequest("No file, stupid.");
        }

        var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);
        if (containerClient == null)
        {
            return Results.NotFound("Not found");
        }

        var tempFolder = $"vitne-{Guid.NewGuid()}";
        var tempPath = Path.Combine(Environment.CurrentDirectory, tempFolder);
        Directory.CreateDirectory(tempPath);
        var videoFilePath = Path.Combine(tempPath, "file.mp4");
        var subFilePath = Path.Combine(tempPath, "file.srt");

        using (var fileStream = new FileStream(videoFilePath, FileMode.Create))
        {
            await videoFile.CopyToAsync(fileStream);
        }

        using (var fileStream = new FileStream(subFilePath, FileMode.Create))
        {
            await subFile.CopyToAsync(fileStream);
        }

        try
        {
            var outputFilePath = Path.Combine(tempPath, $"{DateTime.Now.ToFileTimeUtc()}-testimonial.mp4");

            var ffmpegCmd = OperatingSystem.IsWindows() ?
            $"-i \"{videoFilePath}\" -filter:a \"volume=3\" -vf \"scale=-1:1080,pad=1920:1080:(1920-iw)/2:(1080-ih)/2,subtitles='{subFilePath.Replace("\\", "\\\\").Replace(":", "\\:")}'\" -r 30 -c:v libx264 -c:a aac -ar 48000  \"{outputFilePath}\""
            : $"-i \"{videoFilePath}\" -filter:a \"volume=3\" -vf \"scale=-1:1080,pad=1920:1080:(1920-iw)/2:(1080-ih)/2,subtitles='{subFilePath}'\" -c:v libx264 -r 30 -c:a aac -ar 48000 \"{outputFilePath}\"";

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
        catch (Exception e)
        {
            Console.WriteLine(e);
        }
        finally
        {
            Directory.Delete(tempPath, true);
        }

        return Results.Created();
    }

}
