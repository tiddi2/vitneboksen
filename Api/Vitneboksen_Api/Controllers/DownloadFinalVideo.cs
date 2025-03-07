using Shared;

namespace Vitneboksen_Api.Controllers;

public static class DownloadFinalVideo
{
    public static async Task<IResult> Run(HttpRequest req, string constring)
    {
        var blobService = new Azure.Storage.Blobs.BlobServiceClient(constring);

        string sessionKey = req.Query["sessionKey"];

        var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);
        if (containerClient == null)
        {
            return Results.NotFound("Not found");
        }

        var session = await Helpers.GetBlobFromStorage<Session>(containerClient, Constants.SessionInfoFileName);

        var blob = containerClient.GetBlobClient(Constants.FinalVideoFileName);
        var blobContent = await blob.DownloadContentAsync();

        return Results.File(blobContent.Value.Content.ToStream(), "video/mp4", $"vitneboksen-{session!.SessionName}.mp4");
    }
}