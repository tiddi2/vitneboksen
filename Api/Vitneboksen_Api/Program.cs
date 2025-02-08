using Vitneboksen_Api;
using Vitneboksen_Api.Controllers;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
                      {
                          policy.AllowAnyOrigin().AllowAnyMethod();
                      });
});

builder.Services.AddApplicationInsightsTelemetry();

var app = builder.Build();
app.UseCors();
var storageConnectionString = builder.Configuration.GetSection("StorageConnectionString").Get<string>() ?? "";

app.MapPost("/upload-testemony", async Task<IResult> (HttpRequest request) => await UploadTestimony.Run(request, storageConnectionString));

app.MapPost("/upload-actionshot", async Task<IResult> (HttpRequest request) => await UploadActionShot.Run(request, storageConnectionString));

app.MapGet("/get-session", async Task<IResult> (HttpRequest request) => await GetSession.Run(request, storageConnectionString));

app.MapGet("/get-shared-session", async Task<IResult> (HttpRequest request) => await GetSharedSession.Run(request, storageConnectionString));

app.MapGet("/download-session-files", async Task<IResult> (HttpRequest request) => await DownloadSessionFiles.Run(request, storageConnectionString));

app.MapGet("/create-concatenated-video", async Task<IResult> (HttpRequest request) => await CreateConcatinatedVideo.Run(request, storageConnectionString));

app.MapGet("/download-concatenated-video", async Task<IResult> (HttpRequest request) => await DownloadConcatFile.Run(request, storageConnectionString));

app.MapDelete("/delete-session", async Task<IResult> (HttpRequest request) => await DeleteSession.Run(request, storageConnectionString));

app.Run();
