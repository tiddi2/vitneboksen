using System.Text.Json;

namespace Vitneboksen_Api.Controllers;

public class SetName
{
    public static async Task<IResult> Run(HttpRequest req, string constring)
    {
        var blobService = new Azure.Storage.Blobs.BlobServiceClient(constring);

        var sessionKey = req.Query["sessionKey"]!;
        var newSessionName = req.Query["name"]!;
        var containerClient = Helpers.GetContainerBySessionKey(blobService, sessionKey!);

        var blobClient = containerClient.GetBlobClient(Constants.SessionInfoFileName);
        if (!blobClient.Exists())
        {
            return Results.NotFound("Not found");
        }
        var blob = await blobClient.DownloadContentAsync();
        var json = blob?.Value?.Content?.ToString();
        var existingSession = JsonSerializer.Deserialize<Session>(json);

        var updatedSession = new Session(
            SessionName: newSessionName.ToString(),
            Questions: existingSession.Questions
        );
        var serializedUpdatedSession = JsonSerializer.Serialize(updatedSession);

        await blobClient.UploadAsync(BinaryData.FromString(serializedUpdatedSession), overwrite: true);
        return Results.NoContent();
    }
}
