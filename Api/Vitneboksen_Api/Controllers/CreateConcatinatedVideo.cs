using Azure.Storage.Blobs;

namespace Vitneboksen_Api.Controllers;

public static class CreateConcatinatedVideo
{
    public static async Task<IResult> Run(HttpRequest req, string constring)
    {
        var blobService = new Azure.Storage.Blobs.BlobServiceClient(constring);

        string sessionKey = req.Query["sessionKey"];
        string sessionName = req.Query["sessionName"];

        var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);
        if (containerClient == null)
        {
            return Results.NotFound("Not found");
        }

        var tempPath = Path.Combine(Environment.CurrentDirectory, $"vitne-{Guid.NewGuid()}");
        Directory.CreateDirectory(tempPath);

        var introContainerClient = blobService.GetBlobContainerClient(Constants.IntroContainer);

        var blobs = containerClient.GetBlobsAsync().ConfigureAwait(false);
        try
        {
            var subFilePath = Path.Combine(tempPath, "intro.srt");

            var srtContent = $"1\n00:00:03,650 --> 00:00:06,800\n{sessionName?.ToUpper() ?? string.Empty}\n";
            File.WriteAllText(subFilePath, srtContent);

            var introSourcePath = Path.Combine(tempPath, "intro.mp4");
            var introDestinationPath = Path.Combine(tempPath, "intro-with-sub.mp4");

            var blobClient = introContainerClient.GetBlobClient(Constants.IntroFileName);
            await blobClient.DownloadToAsync(introSourcePath);
            var ffmpegCmd = OperatingSystem.IsWindows() ?
            $"-i \"{introSourcePath}\" -vf \"subtitles='{subFilePath.Replace("\\", "\\\\").Replace(":", "\\:")}:force_style='Alignment=10'\" -c:v libx264 -c:a copy \"{introDestinationPath}\""
            : $"-i \"{introSourcePath}\" -vf \"subtitles='{subFilePath}:force_style='Alignment=10'\" -c:v libx264 -c:a copy \"{introDestinationPath}\"";
            await Helpers.ExecuteFFmpegCommand(ffmpegCmd);

            // Create a MemoryStream to store the zip file
            using var memoryStream = new MemoryStream();

            var fileListPath = Path.Combine(tempPath, "fileList.txt");
            using (var fileListWriter = new StreamWriter(fileListPath))
            {
                fileListWriter.WriteLine($"file '{introDestinationPath}'");

                await foreach (var blobItem in blobs)
                {
                    if (blobItem.Name.EndsWith(".mp4"))
                    {
                        await AddToFileList(fileListWriter, containerClient, blobItem.Name, tempPath);
                    }
                }
            }

            var concatFilePath = Path.Combine(tempPath, Constants.ConcatinatedVideoFileName);
            await Helpers.ExecuteFFmpegCommand($"-f concat -safe 0 -i {fileListPath} -c:v copy -c:a aac {concatFilePath}");

            var file = File.OpenRead(concatFilePath);
            await containerClient.UploadBlobAsync(Constants.ConcatinatedVideoFileName, file);
            file.Close();
        }
        catch (Exception e)
        {
            return Results.Problem(e.InnerException.Message);
            Console.WriteLine(e);
        }
        finally
        {
            Directory.Delete(tempPath, true);
        }
        return Results.Ok();
    }

    private static async Task AddToFileList(StreamWriter fileListWriter, BlobContainerClient containerClient, string blobName, string tempPath)
    {
        var blobClient = containerClient.GetBlobClient(blobName);
        var downloadPath = Path.Combine(tempPath, blobName);
        await blobClient.DownloadToAsync(downloadPath);
        fileListWriter.WriteLine($"file '{downloadPath}'");
    }
}
