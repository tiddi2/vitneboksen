using Azure.Storage.Blobs;

namespace Vitneboksen_func
{
    public static class CreateConcatinatedVideo
    {
        public static async Task<IResult> Run(HttpRequest req, string constring)
        {
            string sessionKey = req.Query["sessionKey"];

            var blobService = new BlobServiceClient(constring);

            var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);
            if (containerClient == null)
            {
                return Results.NotFound("Not found");
            }

            var tempPath = Path.Combine(Environment.CurrentDirectory, $"vitne-{Guid.NewGuid()}");
            Directory.CreateDirectory(tempPath);
            var blobs = containerClient.GetBlobsAsync().ConfigureAwait(false);
            try
            {
                // Create a MemoryStream to store the zip file
                using var memoryStream = new MemoryStream();

                var fileListPath = Path.Combine(tempPath, "fileList.txt");
                using (var fileListWriter = new StreamWriter(fileListPath))
                {
                    await foreach (var blobItem in blobs)
                    {
                        if (blobItem.Name.EndsWith(".mp4"))
                        {
                            var blobClient = containerClient.GetBlobClient(blobItem.Name);
                            var downloadPath = Path.Combine(tempPath, blobItem.Name);
                            await blobClient.DownloadToAsync(downloadPath);
                            fileListWriter.WriteLine($"file '{downloadPath}'");
                        }
                    }
                }
                var concatFilePath = Path.Combine(tempPath, "concatenated.mp4");
                await Helpers.ExecuteFFmpegCommand($"-f concat -safe 0 -i {fileListPath} -c:v libx264 -c:a aac {concatFilePath}");

                var file = File.OpenRead(concatFilePath);
                await containerClient.UploadBlobAsync(concatFilePath, file);

                return Results.Ok();
            }
            catch (Exception)
            {

                throw;
            }
            finally
            {
                Directory.Delete(tempPath, true);
            }
        }
    }
}
