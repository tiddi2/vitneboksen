using Azure.Storage.Blobs;

namespace Vitneboksen_Api.Controllers;

public static class DeleteSession
{
    public static async Task<IResult> Run(HttpRequest req, BlobServiceClient blobService)
    {
        var sessionKey = req.Query["sessionKey"];

        var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey);
        if (containerClient == null)
        {
            return Results.NotFound("Not found");
        }

        await containerClient.DeleteAsync();

        return Results.Ok("Deleted");
    }
}

