using Azure.Storage.Blobs;
using System.IO.Compression;

namespace Vitneboksen_Api;

public static class DownloadSessionFiles
{
    public static async Task<IResult> Run(HttpRequest req, BlobServiceClient blobService)
    {
        string sessionKey = req.Query["sessionKey"];

        var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);
        if (containerClient == null)
        {
            return Results.NotFound("Not found");
        }

        var blobs = containerClient.GetBlobsByHierarchyAsync().ConfigureAwait(false);

        // Create a MemoryStream to store the zip file
        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            await foreach (var blobItem in blobs)
            {
                if (blobItem.Blob.Name == Constants.ConcatinatedVideoFileName)
                {
                    continue;
                }

                // Get the blob stream
                var blobClient = containerClient.GetBlobClient(blobItem.Blob.Name);
                var blobStream = await blobClient.OpenReadAsync();

                // Create an entry in the zip file for each blob
                var entry = archive.CreateEntry(blobClient.Name, CompressionLevel.Fastest);

                // Copy the blob content to the zip entry
                using var entryStream = entry.Open();
                await blobStream.CopyToAsync(entryStream);
            }
        }
        // Set the position of the memory stream to the beginning
        memoryStream.Seek(0, SeekOrigin.Begin);

        // Return the zip file as the response
        return Results.File(memoryStream.ToArray(), "application/zip", "vitneboksen.zip");
    }
}
