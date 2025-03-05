using Shared;

namespace Vitneboksen_Api.Controllers;

public static class UploadTestimonyV2
{
    public static async Task<IResult> Run(HttpRequest req, string constring)
    {
        var blobService = new Azure.Storage.Blobs.BlobServiceClient(constring);
        string? sessionKey = req.Query["sessionKey"];

        var formdata = await req.ReadFormAsync();
        var videoFile = req.Form.Files.FirstOrDefault(f => f.Name == "video");
        var subFile = req.Form.Files.FirstOrDefault(f => f.Name == "sub");
        if (videoFile == null || subFile == null)
        {
            return Results.BadRequest("No file, stupid.");
        }

        var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);
        if (containerClient == null)
        {
            return Results.NotFound("Not found");
        }

        var tempFolder = Helpers.GetUnprocessedFileName(containerClient.Name, Guid.NewGuid());
        var videoFileName = $"{tempFolder}.mp4";
        var subFileName = $"{tempFolder}.srt";

        var unprocessedContainer = Helpers.GetUnprocessedContainer(blobService);
        await unprocessedContainer.UploadBlobAsync(videoFileName, videoFile.OpenReadStream());
        await unprocessedContainer.UploadBlobAsync(subFileName, subFile.OpenReadStream());

        return Results.Created();
    }

}
