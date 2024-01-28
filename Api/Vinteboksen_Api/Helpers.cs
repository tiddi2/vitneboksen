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
        process.Start();

        // Asynchronously read the standard output and error
        var outputReadTask = process.StandardOutput.ReadToEndAsync();
        var errorReadTask = process.StandardError.ReadToEndAsync();

        // Wait for the FFmpeg process to complete execution
        await process.WaitForExitAsync();

        // Now await the tasks for reading output and error
        var output = await outputReadTask;
        var error = await errorReadTask;

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"FFmpeg failed with exit code {process.ExitCode}. Error: {error}");
        }
        Console.WriteLine(error);
        Console.WriteLine(output);
    }

}
