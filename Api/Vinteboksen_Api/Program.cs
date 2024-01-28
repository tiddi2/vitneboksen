using Vitneboksen_func;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
                      {
                          policy.WithOrigins("http://localhost:3000", "https://vitneboksen.no")
                          .AllowAnyMethod();
                      });
});

var app = builder.Build();
app.UseCors();
var storageConnectionString = builder.Configuration.GetSection("StorageConnectionString").Get<string>();

app.MapPost("/upload-testemony", async Task<IResult> (HttpRequest request) => await UploadTestemony.Run(request, storageConnectionString));

app.MapGet("/get-session", async Task<IResult> (HttpRequest request) => await GetSession.Run(request, storageConnectionString));

app.MapGet("/download-session-files", async Task<IResult> (HttpRequest request) => await DownloadSessionFiles.Run(request, storageConnectionString));

app.MapGet("/create-concatenated-video", async Task<IResult> (HttpRequest request) => await CreateConcatinatedVideo.Run(request, storageConnectionString));

app.MapDelete("/delete-session", async Task<IResult> (HttpRequest request) => await DeleteSession.Run(request, storageConnectionString));

app.Run();
