using Azure.Storage.Blobs;
using System.Linq;

namespace Vitneboksen_func;
public static class Helpers
{
    public static BlobContainerClient GetContainerBySessionKey(BlobServiceClient blobService, string sessionKey)
    {

        var containers = blobService.GetBlobContainers();
        var container = containers.FirstOrDefault(c => c.Name.StartsWith(sessionKey));

        if (container == null)
        {
            return null;
        }

        return blobService.GetBlobContainerClient(container.Name);
    }

    public static BlobContainerClient GetContainerBySharedKey(BlobServiceClient blobService, string sharedKey)
    {

        var containers = blobService.GetBlobContainers();
        var container = containers.FirstOrDefault(c => c.Name.EndsWith(sharedKey));

        if (container == null)
        {
            return null;
        }

        return blobService.GetBlobContainerClient(container.Name);
    }
}
