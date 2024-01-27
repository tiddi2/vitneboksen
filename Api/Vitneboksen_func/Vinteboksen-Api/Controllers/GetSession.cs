
using Azure.Storage.Blobs;

namespace Vitneboksen_func
{
    public static class GetSession
    {
        public static async Task<IResult> Run(HttpRequest req, string constring)
        {
            var blobService = new BlobServiceClient(constring);

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
            var videoCount = blobs.Count(b => b.Name.Contains(".mp4") || b.Name.Contains(".webm"));
            var latestUploadTime = blobs.MaxBy(b => b.Properties.CreatedOn)?.Properties.CreatedOn;
            return Results.Ok(new SessionStatus(sessionKey, sharingKey, videoCount, latestUploadTime));
        }
    }

    public record SessionStatus(string SessionKey, string SharingKey, int VideoCount, DateTimeOffset? LastUpload);
}

