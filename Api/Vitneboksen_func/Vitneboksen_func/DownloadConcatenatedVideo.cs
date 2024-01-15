using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
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

            // Download .mp4 and .srt files
            var blobs = containerClient.GetBlobsAsync();
            var tempFolder = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempFolder);
            var fileListPath = Path.Combine(tempFolder, "fileList.txt");
            using (var fileListWriter = new StreamWriter(fileListPath))
            {
                await foreach (var blobItem in blobs)
                {
                    if (blobItem.Name.EndsWith(".mp4") || blobItem.Name.EndsWith(".srt"))
                    {
                        var blobClient = containerClient.GetBlobClient(blobItem.Name);
                        var downloadPath = Path.Combine(tempFolder, blobItem.Name);
                        await blobClient.DownloadToAsync(downloadPath);
                        if (blobItem.Name.EndsWith(".mp4"))
                        {
                            fileListWriter.WriteLine($"file '{downloadPath}'");
                        }
                    }
                }
            }

            // Concatenate using FFmpeg and add subtitles
            var outputFilePath = Path.Combine(tempFolder, "output.mp4");
            var startInfo = new ProcessStartInfo
            {
                FileName = Path.Combine(Environment.CurrentDirectory, "ffmpeg.exe"),
                Arguments = BuildFfmpegArguments(tempFolder, fileListPath, outputFilePath),
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using (var process = Process.Start(startInfo))
            {
                process.WaitForExit();
                var output = process.StandardOutput.ReadToEnd();
                var error = process.StandardError.ReadToEnd();
                log.LogInformation(output);
                if (process.ExitCode != 0)
                {
                    log.LogError(error);
                    throw new InvalidOperationException("FFmpeg failed to concatenate the videos.");
                }
            }

            var fileBytes = File.ReadAllBytes(outputFilePath);
            Directory.Delete(tempFolder, true);
            return new FileContentResult(fileBytes, "video/mp4");
        }


        private static string BuildFfmpegArguments(string tempFolder, string fileListPath, string outputFilePath)
        {
            var ffmpegArgs = $"-f concat -safe 0 -i {{fileListPath}}";
            // Loop through the downloaded files to check for matching .mp4 and .srt files
            var files = Directory.GetFiles(tempFolder);
            foreach (var file in files)
            {
                if (file.EndsWith(".mp4"))
                {
                    var subtitleFile = Path.ChangeExtension(file, ".srt");
                    if (File.Exists(subtitleFile))
                    {
                        // If a matching subtitle file is found, add it to the FFmpeg command
                        ffmpegArgs += $"-i \"{subtitleFile}\" ";
                    }
                }
            }

            // Concatenate video files and embed subtitles
            ffmpegArgs += "-c:v libx264 -c:a copy -c:s mov_text ";
            foreach (var file in files.Where(f => f.EndsWith(".srt")))
            {
                var languageCode = "no"; // Assuming 'no' for Norwegian subtitles; modify as needed
                ffmpegArgs += $"-metadata:s:s:0 language={languageCode} -metadata:s:s:0 title=Question ";
            }

            // Specify the output file
            ffmpegArgs += $"\"{outputFilePath}\"";

            return ffmpegArgs;
        }
    }
}
