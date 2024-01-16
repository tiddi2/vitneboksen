using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
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
            var tempFolder = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
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
            var totalDuration = 0;
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
            await ExcuteFFmpegCommand($"-f concat -safe 0 -i {fileListPath} -s 1920x1080 -qscale:v 1 -c:v copy -c:a aac {concatFilePath}", log);


            // var outputFilePath = Path.Combine(tempFolder, "output.mp4");
            //await ExcuteFFmpegCommand($"-i {concatFilePath} -vf \"subtitles='{srtFilePath}'\" {concatFilePath}", log);

            using var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                foreach (var file in new Dictionary<string, string>() { { "video.mp4", concatFilePath }, { "video.srt", srtFilePath } })
                {
                    var fileStream = File.OpenRead(file.Value);

                    // Create an entry in the zip file for each blob
                    var entry = archive.CreateEntry(file.Key, CompressionLevel.Fastest);

                    // Copy the blob content to the zip entry
                    using (var entryStream = entry.Open())
                    {
                        await fileStream.CopyToAsync(entryStream);
                    }
                }
            }


            // Set the position of the memory stream to the beginning
            memoryStream.Seek(0, SeekOrigin.Begin);
            var bytes = memoryStream.ToArray();

            // Return the zip file as the response
            return new FileContentResult(bytes, "application/zip")
            {
                FileDownloadName = "vitneboksen.zip"
            };
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
