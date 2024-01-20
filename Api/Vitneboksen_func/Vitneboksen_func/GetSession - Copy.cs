
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace Vitneboksen_func
{
    public static class GetSharedSession
    {
        [FunctionName("get-shared-session")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)] HttpRequest req,
            ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            var constring = Environment.GetEnvironmentVariable("StorageConnectionString");
            var blobService = new BlobServiceClient(constring);

            var sharedKey = req.Query["sharedKey"];

            var containerClient = Helpers.GetContainerBySharedKey(blobService, sharedKey);
            if (containerClient == null)
            {
                return new NotFoundObjectResult("not found");
            }
            else
            {
                return new OkObjectResult("Ok");
            }

        }
    }
}

