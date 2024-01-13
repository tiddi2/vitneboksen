namespace Vitneboksen_func
{
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
        public static class CreateSession
        {
            [FunctionName("create-session")]
            public static async Task<IActionResult> Run(
                [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)] HttpRequest req,
                ILogger log)
            {
                log.LogInformation("C# HTTP trigger function processed a request.");

                var constring = Environment.GetEnvironmentVariable("StorageConnectionString");
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

                return new OkObjectResult(sharingKey);
            }

        }
    }

}
