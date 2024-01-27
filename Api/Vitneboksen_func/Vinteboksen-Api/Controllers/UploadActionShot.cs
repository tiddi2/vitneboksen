using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Mvc;

namespace Vitneboksen_func
{
    public static class UploadActionShot
    {
        public static async Task<IActionResult> Run(HttpRequest req, string constring)
        {
            string sharedKey = req.Query["sharedKey"];

            var formdata = await req.ReadFormAsync();
            var videoFile = req.Form.Files.FirstOrDefault(f => f.Name == "video");
            if (videoFile == null)
            {
                return new BadRequestObjectResult("No file, stupid.");
            }

            var blobService = new BlobServiceClient(constring);

            var containerClient = Helpers.GetContainerBySharedKey(blobService, sharedKey);
            if (containerClient == null)
            {
                return new NotFoundObjectResult("Not found");
            }

            await containerClient.UploadBlobAsync(videoFile.FileName, videoFile.OpenReadStream());

            return new OkObjectResult("Ok");
        }

    }
}
