namespace Vitneboksen_func
{
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
        public static class CreateSession
        {
            [FunctionName("create-session")]
            public static async Task<IActionResult> Run(
                [HttpTrigger(AuthorizationLevel.Function, "get", Route = null)] HttpRequest req,
                ILogger log)
            {
                log.LogInformation("C# HTTP trigger function processed a request.");

                var sessionKey = req.Query["sessionKey"];

                var sharingKey = Guid.NewGuid().ToString().Substring(0, 8);
                var constring = Environment.GetEnvironmentVariable("StorageConnectionString");
                var blobService = new BlobServiceClient(constring);
                var containerClient = blobService.GetBlobContainerClient($"{sessionKey}-{sharingKey}");
                await containerClient.CreateIfNotExistsAsync();

                return new OkObjectResult(sharingKey);
            }

        }
    }

}
