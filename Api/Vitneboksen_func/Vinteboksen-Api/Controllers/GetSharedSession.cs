
using Azure.Storage.Blobs;

namespace Vitneboksen_func
{
    public static class GetSharedSession
    {
        public static async Task<IResult> Run(HttpRequest req, string constring)
        {
            var blobService = new BlobServiceClient(constring);

            var sharedKey = req.Query["sharedKey"];

            var containerClient = Helpers.GetContainerBySharedKey(blobService, sharedKey);
            if (containerClient == null)
            {
                return Results.NotFound("not found");
            }

            return Results.Ok("Ok");
        }
    }
}

