using Azure.Storage.Blobs;
using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace Shared
{
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

        public static BlobContainerClient GetUnprocessedContainer(BlobServiceClient blobService) => blobService.GetBlobContainerClient(Constants.UnprocessedContainer);

        public static string GetUnprocessedFileName(string sessionKeyPair, Guid uploadId) => $"{sessionKeyPair}|{uploadId}";

        public static string GetSessionKeyPairFromUnprocessedFileName(string fileName) => fileName.Split('|').First();

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

        public static async Task UploadJsonToStorage(BlobClient blobClient, object objectToSave)
        {
            var serializedObject = JsonSerializer.Serialize(objectToSave);
            await blobClient.UploadAsync(BinaryData.FromString(serializedObject), overwrite: true);
        }

        public static async Task ExecuteFFmpegCommand(string arguments)
        {
            var ffmpegFileName = Path.Combine(Environment.CurrentDirectory,
                IsRunningOnWindows() ? "ffmpeg.exe" : "ffmpeg");

            var ffmpegStartInfo = new ProcessStartInfo
            {
                FileName = ffmpegFileName,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = ffmpegStartInfo };

            var outputBuilder = new StringBuilder();
            var errorBuilder = new StringBuilder();

            process.OutputDataReceived += (sender, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    outputBuilder.AppendLine(e.Data);
                }
            };

            process.ErrorDataReceived += (sender, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                {
                    errorBuilder.AppendLine(e.Data);
                }
            };

            process.Start();

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            // Await the process exit asynchronously.
            await process.WaitForExitAsync();

            // Check the exit code and handle errors if any.
            if (process.ExitCode != 0)
            {
                string errorOutput = errorBuilder.ToString();
                // Optionally, you can also log outputBuilder if needed.
                throw new Exception($"FFmpeg exited with code {process.ExitCode}: {errorOutput}");
            }
        }

        public static bool IsRunningOnWindows()
        {
            // Check if the OS is Windows
            return Environment.OSVersion.Platform == PlatformID.Win32NT;
        }
    }
}