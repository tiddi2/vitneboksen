
using Azure.Storage.Blobs;

namespace Vitneboksen_Api.Controllers;

public static class GetSession
{
    public static async Task<IResult> Run(HttpRequest req, BlobServiceClient blobService)
    {
        var sessionKey = req.Query["sessionKey"];
        string sharingKey;

        var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);
        if (containerClient == null)
        {
            sharingKey = Guid.NewGuid().ToString().Substring(0, 8);
            containerClient = blobService.GetBlobContainerClient($"{sessionKey}-{sharingKey}");
            await containerClient.CreateAsync();
        }
        else
        {
            sharingKey = containerClient.Name.Split("-").Last();
        }

        var blobs = containerClient.GetBlobs();
        var videoCount = blobs.Count(b => b.Name.Contains(".mp4") && b.Name != Constants.ConcatinatedVideoFileName);
        var latestUploadTime = blobs.MaxBy(b => b.Properties.CreatedOn)?.Properties.CreatedOn;
        return Results.Ok(new SessionStatus(sessionKey, sharingKey, videoCount, blobs.Any(b => b.Name == Constants.ConcatinatedVideoFileName), latestUploadTime));
    }
}

public record SessionStatus(string SessionKey, string SharingKey, int VideoCount, bool ConcatCompleted, DateTimeOffset? LastUpload);

