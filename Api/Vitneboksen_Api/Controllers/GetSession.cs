using Shared;
using System.Text.Json;

namespace Vitneboksen_Api.Controllers;

public static class GetSession
{
    public static async Task<IResult> Run(HttpRequest req, string constring)
    {
        var blobService = new Azure.Storage.Blobs.BlobServiceClient(constring);

        var sessionKey = req.Query["sessionKey"]!;
        string sharingKey;

        var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey!);
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
        var testimonials = blobs.Count(b => b.Name.Contains(Constants.VideoTypes.Testimonial));
        var actionshots = blobs.Count(b => b.Name.Contains(Constants.VideoTypes.ActionShot));

        var latestUploadTime = blobs.Where(b => b.Name != Constants.ConcatinatedVideoFileName).MaxBy(b => b.Properties.CreatedOn)?.Properties.CreatedOn;

        var blobClient = containerClient.GetBlobClient(Constants.SessionInfoFileName);
        var session = new Session("", []);
        if (blobClient.Exists())
        {
            var blob = await blobClient.DownloadContentAsync();
            var json = blob?.Value?.Content?.ToString();
            if (json != null)
                session = JsonSerializer.Deserialize<Session>(json);
        }
        else
        {
            session = new Session(
                string.Empty,
                []
                );
            await Helpers.UploadJsonToStorage(blobClient, session);
        }

        return Results.Ok(new SessionStatus(
            session.SessionName,
            sessionKey!,
            sharingKey,
            testimonials,
            actionshots,
            blobs.Any(b => b.Name == Constants.ConcatinatedVideoFileName),
            latestUploadTime,
            session.Questions));
    }
}
