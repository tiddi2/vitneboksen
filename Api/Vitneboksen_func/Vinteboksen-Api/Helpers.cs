using Azure.Storage.Blobs;
using System.Diagnostics;

namespace Vitneboksen_func;
public static class Helpers
{
    public static BlobContainerClient? GetContainerBySessionKey(BlobServiceClient blobService, string sessionKey)
    {

        var containers = blobService.GetBlobContainers();
        var container = containers.FirstOrDefault(c => c.Name.StartsWith(sessionKey));

        if (container == null)
        {
            return null;
        }

        return blobService.GetBlobContainerClient(container.Name);
    }

    public static BlobContainerClient? GetContainerBySharedKey(BlobServiceClient blobService, string sharedKey)
    {

        var containers = blobService.GetBlobContainers();
        var container = containers.FirstOrDefault(c => c.Name.EndsWith(sharedKey));

        if (container == null)
        {
            return null;
        }

        return blobService.GetBlobContainerClient(container.Name);
    }

    public static async Task ExcuteFFmpegCommand(string arguments, ILogger log)
    {
        var ffmpegStartInfo = new ProcessStartInfo
        {
            FileName = Path.Combine(Environment.CurrentDirectory, "ffmpeg.exe"),
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using (var process = new Process
        {
            StartInfo = ffmpegStartInfo
        })
        {
            process.Start();
            await process.WaitForExitAsync();

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();
            log.LogError(error);
            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException("FFmpeg failed with exit code: " + error);
            }
            process.Dispose();
        }
    }
}
