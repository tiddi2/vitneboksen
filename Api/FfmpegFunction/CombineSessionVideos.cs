using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
namespace FfmpegFunction
{
    public class CombineSessionVideos
    {
        private readonly ILogger _logger;
        private readonly IConfiguration _configuration;
        public CombineSessionVideos(ILoggerFactory loggerFactory, IConfiguration configuration)
        {
            _logger = loggerFactory.CreateLogger<FormatTestimony>();
            _configuration = configuration;
        }

        [Function("CombineSessionVideos")]
        public async Task Run([BlobTrigger("{sessionContainer}/combineVideoStarted", Connection = "AzureWebJobsStorage")] byte[] blobContent, FunctionContext context, string blobName)
        {
            var sessionKey = "noe";
            var session = new Session("noe", []);
            using var blobContentStream = new MemoryStream(blobContent);

            var connectionString = _configuration.GetConnectionString("AzureWebJobsStorage");

            var blobService = new Azure.Storage.Blobs.BlobServiceClient(connectionString);
            var tempPath = Path.Combine(Path.GetTempPath(), $"vitne-{Guid.NewGuid()}");
            Directory.CreateDirectory(tempPath);

            await DownloadResources(blobService, tempPath);

            var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);

            var blobs = containerClient.GetBlobs().Where(blob => blob.Name.EndsWith(".mp4"));
            var transitions = await CreateTransitionsFromBlobs(blobs.ToList(), tempPath);
            try
            {
                var subFilePath = Path.Combine(tempPath, "intro.srt");

                var srtContent = $"1\n00:00:03,650 --> 00:00:06,800\n{session.SessionName?.ToUpper() ?? string.Empty}\n";
                File.WriteAllText(subFilePath, srtContent);

                var introSourcePath = Path.Combine(tempPath, Constants.IntroFileName);
                var introDestinationPath = Path.Combine(tempPath, "intro-with-sub.mp4");

                var ffmpegCmd = OperatingSystem.IsWindows() ?
                $"-i \"{introSourcePath}\" -vf \"subtitles='{subFilePath.Replace("\\", "\\\\").Replace(":", "\\:")}:force_style='Alignment=10'\" -c:v libx264 -c:a aac -ar 48000 \"{introDestinationPath}\""
                : $"-i \"{introSourcePath}\" -vf \"subtitles='{subFilePath}:force_style='Alignment=10'\" -c:v libx264 -c:a aac -ar 48000 \"{introDestinationPath}\"";
                await Helpers.ExecuteFFmpegCommand(ffmpegCmd);

                // Create a MemoryStream to store the zip file
                using var memoryStream = new MemoryStream();

                var fileListPath = Path.Combine(tempPath, "fileList.txt");
                using (var fileListWriter = new StreamWriter(fileListPath))
                {
                    fileListWriter.WriteLine($"file '{introDestinationPath}'");

                    foreach (var blobItem in blobs)
                    {
                        if (transitions.TryGetValue(blobItem.Name, out var transitionFileName))
                        {
                            fileListWriter.WriteLine($"file '{transitionFileName}'");
                        }
                        await AddBlobToFileList(fileListWriter, containerClient, blobItem.Name, tempPath);

                    }
                }

                var concatFilePath = Path.Combine(tempPath, Constants.ConcatinatedVideoFileName);
                await Helpers.ExecuteFFmpegCommand($"-f concat -safe 0 -i {fileListPath} -c:v copy -c:a aac -ar 48000 {concatFilePath}");

                var file = File.OpenRead(concatFilePath);
                await containerClient.UploadBlobAsync(Constants.ConcatinatedVideoFileName, file);
                file.Close();
            }
            finally
            {
                Directory.Delete(tempPath, true);
            }
            return;
        }

        private static async Task AddBlobToFileList(StreamWriter fileListWriter, BlobContainerClient containerClient, string blobName, string tempPath)
        {
            var blobClient = containerClient.GetBlobClient(blobName);
            var downloadPath = Path.Combine(tempPath, blobName);
            await blobClient.DownloadToAsync(downloadPath);
            fileListWriter.WriteLine($"file '{downloadPath}'");
        }

        private static async Task DownloadResources(BlobServiceClient blobService, string tempPath)
        {
            var introContainerClient = blobService.GetBlobContainerClient(Constants.ResourceContainer);
            var blobClient = introContainerClient.GetBlobClient(Constants.IntroFileName);
            await blobClient.DownloadToAsync(Path.Combine(tempPath, Constants.IntroFileName));

            var transitionBlobClient = introContainerClient.GetBlobClient(Constants.TransitionFileName);
            await transitionBlobClient.DownloadToAsync(Path.Combine(tempPath, Constants.TransitionFileName));
        }

        private static async Task<Dictionary<string, string>> CreateTransitionsFromBlobs(List<BlobItem> blobs, string tempPath)
        {
            var norwegianTimeZone = TimeZoneInfo.FindSystemTimeZoneById(OperatingSystem.IsWindows() ? "Central Europe Standard Time" : "Europe/Oslo");
            var transitions = new Dictionary<string, string>();

            var filteredElements = blobs
                .Where((blob, i) => i - 1 >= 0).ToList();

            foreach (var blob in filteredElements)
            {
                var subFilePath = Path.Combine(tempPath, $"transition-{blob.Name}.srt");
                // Get the Norwegian timezone

                // Convert the DateTimeOffset to Norwegian time
                var norwegianTime = TimeZoneInfo.ConvertTime(blob.Properties.CreatedOn!.Value, norwegianTimeZone);
                var srtContent = $"1\n00:00:00,000 --> 00:00:01,250\nkl. {norwegianTime.ToString("HH:mm")}\n";
                File.WriteAllText(subFilePath, srtContent);

                var transitionSourcePath = Path.Combine(tempPath, Constants.TransitionFileName);
                var transitionDestinationPath = Path.Combine(tempPath, $"transition-{blob.Name}");

                var ffmpegCmd = $"-i \"{transitionSourcePath}\" -vf \"subtitles='{subFilePath.Replace("\\", "\\\\").Replace(":", "\\:")}:force_style='Alignment=10'\" -c:v libx264 -c:a aac -ar 48000 \"{transitionDestinationPath}\""

                await Helpers.ExecuteFFmpegCommand(ffmpegCmd);

                transitions.Add(blob.Name, transitionDestinationPath);
            }

            return transitions;
        }
    }
}
