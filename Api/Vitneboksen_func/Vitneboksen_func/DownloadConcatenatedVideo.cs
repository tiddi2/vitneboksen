using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace Vitneboksen_func
{
    public static class DownloadConcatenatedVideo
    {
        [FunctionName("download-concatenated-video")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)] HttpRequest req,
            ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            string sessionKey = req.Query["sessionKey"];

            var constring = Environment.GetEnvironmentVariable("StorageConnectionString");
            var blobService = new BlobServiceClient(constring);

            var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);
            if (containerClient == null)
            {
                return new NotFoundObjectResult("Not found");
            }

            // Download .mp4 files
            var blobs = containerClient.GetBlobsAsync();
            var tempFolder = Path.Combine(Environment.CurrentDirectory, "temp");
            Directory.CreateDirectory(tempFolder);
            var fileListPath = Path.Combine(tempFolder, "fileList.txt");
            using (var fileListWriter = new StreamWriter(fileListPath))
            {
                await foreach (var blobItem in blobs)
                {
                    if (blobItem.Name.EndsWith(".mp4"))
                    {
                        var blobClient = containerClient.GetBlobClient(blobItem.Name);
                        var downloadPath = Path.Combine(tempFolder, blobItem.Name);
                        await blobClient.DownloadToAsync(downloadPath);
                        fileListWriter.WriteLine($"file '{downloadPath}'");
                    }
                }
            }

            // Additional code to parse JSON files and generate SRT file
            var totalDuration = 1;
            var srtFilePath = Path.Combine(tempFolder, "subtitles.srt");
            var srtFileIndex = 1;

            using (var srtFileWriter = new StreamWriter(srtFilePath))
            {
                await foreach (var blobItem in blobs)
                {
                    if (blobItem.Name.EndsWith(".json"))
                    {
                        var jsonBlobClient = containerClient.GetBlobClient(blobItem.Name);
                        var jsonDownloadPath = Path.Combine(tempFolder, blobItem.Name);
                        await jsonBlobClient.DownloadToAsync(jsonDownloadPath);

                        var jsonContent = await File.ReadAllTextAsync(jsonDownloadPath);
                        var subtitle = JsonConvert.DeserializeObject<SubtitleItem>(jsonContent);

                        var startTime = TimeSpan.FromSeconds(totalDuration);
                        var endTime = TimeSpan.FromSeconds(totalDuration + subtitle.Duration);
                        srtFileWriter.WriteLine(srtFileIndex++);
                        srtFileWriter.WriteLine($"{FormatTimeSpan(startTime)} --> {FormatTimeSpan(endTime)}");
                        srtFileWriter.WriteLine(subtitle.Text);
                        srtFileWriter.WriteLine();
                        totalDuration += subtitle.Duration;
                    }
                }
            }

            // Concatenate using FFmpeg
            var concatFilePath = Path.Combine(tempFolder, "concated.mp4");
            await ExcuteFFmpegCommand($"-f concat -safe 0 -i {fileListPath} -c:v mpeg4 -c:a copy {concatFilePath}", log);

            var outputFilePath = Path.Combine(tempFolder, "output.mp4");
            await ExcuteFFmpegCommand($"-i {concatFilePath} -vf \"subtitles='temp/subtitles.srt'\" {outputFilePath}", log);

            var fileBytes = File.ReadAllBytes(outputFilePath);
            Directory.Delete(tempFolder, true);

            return new FileContentResult(fileBytes, "video / mp4");
        }

        private static async Task ExcuteFFmpegCommand(string arguments, ILogger log)
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

            using var process = Process.Start(ffmpegStartInfo);
            try
            {

                await process.WaitForExitAsync();
                var output = process.StandardOutput.ReadToEnd();
                var error = process.StandardError.ReadToEnd();
                log.LogInformation(output);
                if (process.ExitCode != 0)
                {
                    log.LogError(error);
                    throw new InvalidOperationException("FFmpeg failed to concatenate the videos.");
                }
                process.Dispose();
            }
            catch (Exception e)
            {
                log.LogError(e.Message);
            }
            finally
            {
                process.Dispose();
            }
        }

        private class SubtitleItem
        {
            public int Duration { get; set; }
            public string Text { get; set; }
        }

        private static string FormatTimeSpan(TimeSpan timeSpan)
        {
            return timeSpan.ToString(@"hh\:mm\:ss\,fff");
        }
    }
}
