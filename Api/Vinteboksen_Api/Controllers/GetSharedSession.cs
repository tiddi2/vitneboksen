
using Azure.Storage.Blobs;

namespace Vitneboksen_Api.Controllers;

public static class GetSharedSession
{
    public static async Task<IResult> Run(HttpRequest req, BlobServiceClient blobService)
    {
        var sharedKey = req.Query["sharedKey"];

        var containerClient = Helpers.GetContainerBySharedKey(blobService, sharedKey);
        if (containerClient == null)
        {
            return Results.NotFound("not found");
        }

        return Results.Ok("Ok");
    }
}

