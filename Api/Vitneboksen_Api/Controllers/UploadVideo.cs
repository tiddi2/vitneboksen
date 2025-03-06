using Azure.Storage.Blobs;
using Shared;
using Shared.Models;

namespace Vitneboksen_Api.Controllers;

public static class UploadVideo
{
    public static async Task<IResult> Run(HttpRequest req, string videoType, string constring)
    {
        var blobService = new BlobServiceClient(constring);
        BlobContainerClient containerClient;
        if (videoType == Constants.VideoTypes.Testimonial)
        {
            containerClient = Helpers.GetContainerBySessionKey(blobService, req.Query["sessionKey"]);
        }
        else
        {
            containerClient = Helpers.GetContainerBySharedKey(blobService, req.Query["sharedKey"]);
        }

        var sessionKey = containerClient.Name.Split("-").First();

        var formdata = await req.ReadFormAsync();
        var videoFile = req.Form.Files.FirstOrDefault(f => f.Name == "video");
        var subFile = req.Form.Files.FirstOrDefault(f => f.Name == "sub");
        if (videoFile == null || (videoType == Constants.VideoTypes.Testimonial && subFile == null))
        {
            return Results.BadRequest("No file, stupid.");
        }

        if (containerClient == null)
        {
            return Results.NotFound("Not found");
        }

        var videoMetadata = new VideoFileMetaData(
            id: Guid.NewGuid(),
            createdOn: DateTimeOffset.Now,
            videoType: videoType,
            sessionKey: sessionKey
            );

        var videoFileName = videoMetadata.GetVideoFileName();
        var subFileName = videoMetadata.GetSubFileName();

        var unprocessedContainer = Helpers.GetUnprocessedContainer(blobService);
        await unprocessedContainer.UploadBlobAsync(videoFileName, videoFile.OpenReadStream());
        if (subFile != null)
            await unprocessedContainer.UploadBlobAsync(subFileName, subFile.OpenReadStream());

        return Results.Created();
    }

}
