using Azure.Storage.Blobs;
using System.Diagnostics;

namespace Vitneboksen_Api;
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

    public static async Task ExecuteFFmpegCommand(string arguments)
    {
        var ffmpegStartInfo = new ProcessStartInfo
        {
            FileName = Path.Combine(Environment.CurrentDirectory, OperatingSystem.IsWindows() ? "ffmpeg.exe" : "ffmpeg"),
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = ffmpegStartInfo };

        process.OutputDataReceived += new DataReceivedEventHandler(
            (s, e) =>
            {
            }
        );
        process.ErrorDataReceived += new DataReceivedEventHandler(
            (s, e) =>
            {
            }
        );
        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        process.WaitForExit();
    }

}
