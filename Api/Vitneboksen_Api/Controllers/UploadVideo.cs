using Azure.Storage.Blobs;
using Shared;

namespace Vitneboksen_Api.Controllers;

public static class UploadVideo
{
    public static async Task<IResult> Run(HttpRequest req, string videoType, string constring)
    {
        var blobService = new BlobServiceClient(constring);
        BlobContainerClient containerClient;

        if (videoType == Constants.VideoTypes.Testimonial)
        {
            var sessionKey = req.Query["sessionKey"];
            containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);
        }
        else
        {
            var sharedKey = req.Query["sharedKey"];
            containerClient = Helpers.GetContainerBySharedKey(blobService, sharedKey);
        }

        var formdata = await req.ReadFormAsync();
        var videoFile = req.Form.Files.FirstOrDefault(f => f.Name == "video");
        var subFile = req.Form.Files.FirstOrDefault(f => f.Name == "sub");
        if (videoFile == null || subFile == null)
        {
            return Results.BadRequest("No file, stupid.");
        }

        if (containerClient == null)
        {
            return Results.NotFound("Not found");
        }

        var tempFolder = Helpers.GetUnprocessedFileName(containerClient.Name, Guid.NewGuid(), videoType);
        var videoFileName = $"{tempFolder}.mp4";
        var subFileName = $"{tempFolder}.srt";

        var unprocessedContainer = Helpers.GetUnprocessedContainer(blobService);
        await unprocessedContainer.UploadBlobAsync(videoFileName, videoFile.OpenReadStream());
        await unprocessedContainer.UploadBlobAsync(subFileName, subFile.OpenReadStream());

        return Results.Created();
    }

}
