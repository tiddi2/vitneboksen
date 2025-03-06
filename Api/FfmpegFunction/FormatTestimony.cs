using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared;
using Shared.Models;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
namespace FfmpegFunction
{
    public class FormatTestimony
    {
        private readonly ILogger _logger;
        private readonly IConfiguration _configuration;
        public FormatTestimony(ILoggerFactory loggerFactory, IConfiguration configuration)
        {
            _logger = loggerFactory.CreateLogger<FormatTestimony>();
            _configuration = configuration;
        }

        [Function("FormatTestimony")]
        public async Task Run([BlobTrigger("unprocessed/{blobName}", Connection = "AzureWebJobsStorage")] byte[] blobContent, FunctionContext context, string blobName)
        {
            var fileMetaData = VideoFileMetaData.GetVideoFileMetaDataFromFileName(blobName);

            if (!blobName.EndsWith(".mp4"))
                return;

            using var blobContentStream = new MemoryStream(blobContent);

            var connectionString = _configuration.GetConnectionString("AzureWebJobsStorage");

            var blobService = new Azure.Storage.Blobs.BlobServiceClient(connectionString);
            var blobNameBase = blobName.Split('.').First();

            var unprocessedContainer = Helpers.GetUnprocessedContainer(blobService);
            if (unprocessedContainer == null)
            {
                throw new Exception("No container found");
            }

            var videofileBlobClient = unprocessedContainer.GetBlobClient(blobName);
            var subfileBlobclient = unprocessedContainer.GetBlobClient(fileMetaData.GetSubFileName());
            var tempFolder = $"{fileMetaData.SessionKey}-{fileMetaData.Id}";

            var tempPath = Path.Combine(Path.GetTempPath(), tempFolder);
            Directory.CreateDirectory(tempPath);
            var videoFilePath = Path.Combine(tempPath, "file.mp4");
            using (var fileStream = new FileStream(videoFilePath, FileMode.Create))
            {
                await blobContentStream.CopyToAsync(fileStream);
            }
            string? subtitleText = null;
            if (subfileBlobclient.Exists())
                subtitleText = (await subfileBlobclient.DownloadContentAsync()).Value.Content.ToString();

            var sessionContainer = Helpers.GetContainerBySessionKey(blobService, fileMetaData.SessionKey);
            try
            {
                string outputFilePath = Path.Combine(tempPath, $"{fileMetaData.CreatedOn.UtcDateTime.ToFileTimeUtc()}-{fileMetaData.VideoType}.mp4");

                string ffmpegCmd;

                if (subtitleText != null)
                {
                    ffmpegCmd = $"-i \"{videoFilePath}\" -filter:a \"volume=3\" -vf \"scale=-1:1080," +
                        $"pad=1920:1080:(1920-iw)/2:(1080-ih)/2," +
                        $"drawtext=text='{subtitleText}':fontcolor=white:fontsize=70:x=(w-text_w)/2:y=h-100:line_spacing=10:box=1:boxcolor=black@0.5\"" +
                        $" -r 30 -c:v libx264 -c:a aac -ar 48000  \"{outputFilePath}\"";
                    //ffmpegCmd = $"-i \"{videoFilePath}\" -filter:a \"volume=3\" -vf \"scale=-1:1080,pad=1920:1080:(1920-iw)/2:(1080-ih)/2,subtitles='{subFilePath.Replace("\\", "\\\\").Replace(":", "\\:")}'\" -r 30 -c:v libx264 -c:a aac -ar 48000  \"{outputFilePath}\"";
                }
                else
                {
                    ffmpegCmd = $"-i \"{videoFilePath}\" -filter:a \"volume=3\" -vf \"scale=-1:720,pad=1280:720:(1280-iw)/2:(720-ih)/2\" -r 30 -c:v libx264 -c:a aac -ar 48000 \"{outputFilePath}\"";
                }

                await Helpers.ExecuteFFmpegCommand(ffmpegCmd);

                var fileInfo = new FileInfo(outputFilePath);
                if (fileInfo.Exists && fileInfo.Length > 0)
                {
                    using var fileStream = new FileStream(outputFilePath, FileMode.Open);
                    await sessionContainer.UploadBlobAsync(Path.GetFileName(outputFilePath), fileStream);
                }
                else
                {
                    throw new Exception("FFmpeg processing failed.");
                }

                await videofileBlobClient.DeleteIfExistsAsync();
                await subfileBlobclient.DeleteIfExistsAsync();

                var blob = sessionContainer.GetBlobClient(Constants.FinalVideoFileName);
                await blob.DeleteIfExistsAsync();
            }
            finally
            {
                Directory.Delete(tempPath, true);
            }

            return;
        }

    }
}
