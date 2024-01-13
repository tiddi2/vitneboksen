using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Vitneboksen_func
{
    public static class UploadActionShot
    {
        [FunctionName("upload-actionshot")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            string sharedKey = req.Query["sharedKey"];

            var formdata = await req.ReadFormAsync();
            var videoFile = req.Form.Files.FirstOrDefault(f => f.Name == "video");
            if (videoFile == null)
            {
                return new BadRequestObjectResult("No file, stupid.");
            }

            var constring = Environment.GetEnvironmentVariable("StorageConnectionString");
            var blobService = new BlobServiceClient(constring);

            var containers = blobService.GetBlobContainers();
            var container = containers.FirstOrDefault(c => c.Name.EndsWith(sharedKey));

            if (container == null)
            {
                return new NotFoundObjectResult("Not found");
            }

            var containerClient = blobService.GetBlobContainerClient(container.Name);

            await containerClient.UploadBlobAsync(videoFile.FileName, videoFile.OpenReadStream());

            return new OkObjectResult("Ok");
        }

    }
}
