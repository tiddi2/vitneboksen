using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.IO.Compression;
using System.Threading.Tasks;

namespace Vitneboksen_func
{
    public static class DownloadSessionFiles
    {
        [FunctionName("download-session-files")]
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

            var blobs = containerClient.GetBlobsByHierarchyAsync().ConfigureAwait(false);

            // Create a MemoryStream to store the zip file
            using var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                await foreach (var blobItem in blobs)
                {
                    // Get the blob stream
                    var blobClient = containerClient.GetBlobClient(blobItem.Blob.Name);
                    var blobStream = await blobClient.OpenReadAsync();

                    // Create an entry in the zip file for each blob
                    var entry = archive.CreateEntry(blobClient.Name, CompressionLevel.Fastest);

                    // Copy the blob content to the zip entry
                    using (var entryStream = entry.Open())
                    {
                        await blobStream.CopyToAsync(entryStream);
                    }
                }
            }

            // Set the position of the memory stream to the beginning
            memoryStream.Seek(0, SeekOrigin.Begin);

            // Return the zip file as the response
            return new FileContentResult(memoryStream.ToArray(), "application/zip")
            {
                FileDownloadName = "vitneboksen.zip"
            };
        }
    }
}
