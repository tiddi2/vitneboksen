namespace Vitneboksen_func
{
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

                var sessionKey = Guid.NewGuid();

                return new OkObjectResult(sessionKey);
            }

        }
    }

}
