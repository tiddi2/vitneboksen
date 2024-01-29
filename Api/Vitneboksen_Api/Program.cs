using Azure.Storage.Blobs;
using Vitneboksen_Api;
using Vitneboksen_Api.Controllers;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
                      {
                          policy.AllowAnyOrigin();
                      });
});

var app = builder.Build();
app.UseCors();
var storageConnectionString = builder.Configuration.GetSection("StorageConnectionString").Get<string>();
var blobService = new BlobServiceClient(storageConnectionString);

app.MapPost("/upload-testemony", async Task<IResult> (HttpRequest request) => await UploadTestemony.Run(request, blobService));

app.MapPost("/upload-actionshot", async Task<IResult> (HttpRequest request) => await UploadActionShot.Run(request, blobService));

app.MapGet("/get-session", async Task<IResult> (HttpRequest request) => await GetSession.Run(request, blobService));

app.MapGet("/get-shared-session", async Task<IResult> (HttpRequest request) => await GetSharedSession.Run(request, blobService));

app.MapGet("/download-session-files", async Task<IResult> (HttpRequest request) => await DownloadSessionFiles.Run(request, blobService));

app.MapGet("/create-concatenated-video", async Task<IResult> (HttpRequest request) => await CreateConcatinatedVideo.Run(request, blobService));

app.MapGet("/download-concatenated-video", async Task<IResult> (HttpRequest request) => await DownloadConcatFile.Run(request, blobService));

app.MapDelete("/delete-session", async Task<IResult> (HttpRequest request) => await DeleteSession.Run(request, blobService));

app.Run();
