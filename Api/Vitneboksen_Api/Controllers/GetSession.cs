namespace Vitneboksen_Api.Controllers;

public static class GetSession
{
    public static async Task<IResult> Run(HttpRequest req, string constring)
    {
        var blobService = new Azure.Storage.Blobs.BlobServiceClient(constring);

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
        var testimonials = blobs.Count(b => b.Name.Contains("testimonial.mp4"));
        var actionshots = blobs.Count(b => b.Name.Contains("actionshot.mp4"));

        var latestUploadTime = blobs.Where(b => b.Name != Constants.ConcatinatedVideoFileName).MaxBy(b => b.Properties.CreatedOn)?.Properties.CreatedOn;
        return Results.Ok(new SessionStatus(sessionKey, sharingKey, testimonials, actionshots, blobs.Any(b => b.Name == Constants.ConcatinatedVideoFileName), latestUploadTime));
    }
}

public record SessionStatus(string SessionKey, string SharingKey, int Testimonials, int Actionshots, bool ConcatCompleted, DateTimeOffset? LastUpload);

