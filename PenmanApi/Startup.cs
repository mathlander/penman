using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using PenmanApi.Config;
using PenmanApi.Hubs;
using PenmanApi.Models;
using PenmanApi.Services;

namespace PenmanApi
{
    public class Startup
    {
        public IConfiguration Configuration { get; }

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            // Indicate that we would like to use AutoMapper to transcribe data between the data models (PenmanApi.Models)
            // and the data transfer objects (PenmanApi.Dtos).
            services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

            // Allow CORS but the policy must be well-defined to enable token authentication via SignalR requests.
            // Specifically, the connection requests will fail if the origins are not specified.
            var corsPolicyConfigSection = Configuration.GetSection("CorsPolicyConfig");
            var allowedOrigins = corsPolicyConfigSection.GetValue<string>("AllowedOrigins");
            services.AddCors(options => options.AddDefaultPolicy(policyBuilder => {
                policyBuilder.AllowAnyMethod()
                    .AllowCredentials()
                    .AllowAnyHeader()
                    .WithOrigins(allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries));
            }));

            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_3_0);
            services.AddSignalR();

            // Pull in the connections string from the environment variables.
            // On Windows environments this value may be set via:
            //      Control Panel => System Security => System => Advanced System Settings => Environment Variables
            // On Linux environments this may be set in the file:
            //      /etc/environment
            var connectionString = Environment.GetEnvironmentVariable("PENMAN_CONNECTION_STRING");
            services.AddDbContext<PenmanContext>(options => options.UseNpgsql(connectionString));

            // The appsettings.json and appsettings.<environmentName>.json configuration files were read in
            // Program.cs initialization.  Call Configuration.GetSection("<SectionName>") to access the configured
            // values.
            var jwtSection = Configuration.GetSection("JwtConfig");
            var authConfig = jwtSection.Get<AuthConfig>();
            var secretKey = Encoding.ASCII.GetBytes(authConfig.Secret);
            services.AddAuthentication(options => {
                // Indicate that requests should be challenged by default using a JWT bearer authentication scheme,
                // i.e. check the "Authentication" http/https header for a value of "Bearer <encodedJwtToken>" on
                // every request where the controller or the action has an [Authorize] attribute (unless overridden
                // with the [AllowAnonymous] attribute).
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options => {
                options.RequireHttpsMetadata = false;
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    // Encoded info must indicate it was issued by the JwtConfig.Issuer value defined in appsettings.json
                    ValidIssuer = authConfig.Issuer,
                    // Encoded info must indicate it is being used by the JwtConfig.Audience value defined in appsettings.
                    ValidAudience = authConfig.Audience,
                    // This valud is used to encrypt/decrypt the JWT token returned to the user on sign-in and, while the
                    // encoded token is sent to the user, the security key is not.
                    IssuerSigningKey = new SymmetricSecurityKey(secretKey),

                    ValidateIssuerSigningKey = true,
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                };
                // handler for SignalR events against privileged routes
                options.Events = new JwtBearerEvents
                {
                    // Allow the JWT authentication handler to access the token from the query string when
                    // the client (SignalR) is unable to include it in the Authorization header directly.
                    OnMessageReceived = context => {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        var isPenmanHubPath = path.StartsWithSegments(Constants.PenmanHubRoute);
                        if (!String.IsNullOrEmpty(accessToken) && isPenmanHubPath)
                            context.Token = accessToken;
                        return Task.CompletedTask;
                    },
                };
            });

            // services.AddAuthorization(options => {
            //     options.AddPolicy("User");
            //     options.AddPolicy("Support");
            // });

            // Take advantage of the built-in dependency injection model via the services IServiceCollection.
            // Singleton instances are shared for every request over the life of the hosted process.
            services.AddSingleton<IAuthConfig>(authConfig);

            // Register the HttpConnectionContext accessor to implicitly retrieve userId on SignalR communications.
            // Alternatively, the EmailBasedIdProvider may be used if the email claim should be used as the userId,
            // but this goes against the design of the current API, since user's may modify the email specified in
            // their profile.
            services.AddSingleton<IUserIdProvider, NameUserIdProvider>();

            // Scoped instances are generated anew for each request.
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IBookService, BookService>();
            services.AddScoped<IPersonificationService, PersonificationService>();
            services.AddScoped<IPromptService, PromptService>();
            services.AddScoped<IShortService, ShortService>();
            services.AddScoped<ITagService, TagService>();
            services.AddScoped<IRelationshipService, RelationshipService>();
            // services.AddScoped<ICollaborationService, CollaborationService>();
            // services.AddScoped<IRichTextService, RichTextService>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            var currentDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = new PhysicalFileProvider(Path.Combine(currentDirectory, "www", "dev")),
                    RequestPath = "/dev",
                    ServeUnknownFileTypes = true,
                    DefaultContentType = "text/plain",
                });
            }

            // Set the global cors policy.
            app.UseCors();

            // Enable the hosting of static files and define a root directory.
            app.UseDefaultFiles(new DefaultFilesOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(currentDirectory, "www")),
            });
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(currentDirectory, "www")),
                RequestPath = String.Empty,
            });
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(currentDirectory, "www", "static", "js")),
                RequestPath = "/static/js",
                ServeUnknownFileTypes = false,
                DefaultContentType = "text/javascript",
                OnPrepareResponse = (context) => {
                    if (context.File.Name.Equals("service-worker.js", StringComparison.CurrentCultureIgnoreCase)) {
                        Microsoft.AspNetCore.StaticFiles.StaticFileResponseContext foo = context;
                        context.Context.Response.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
                    }
                },
            });
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(currentDirectory, "www", "static", "css")),
                RequestPath = "/static/css",
                ServeUnknownFileTypes = false,
                DefaultContentType = "text/css"
            });
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(currentDirectory, "www", "static", "media")),
                RequestPath = "/static/media",
                ServeUnknownFileTypes = false,
                DefaultContentType = "image/png",
                HttpsCompression = HttpsCompressionMode.DoNotCompress,
            });

            // Indicates that the action taken by the API should respond to the route, i.e. https://penman.mathlander/{this}/{part}
            // which is almost certainly what would always be expected.
            app.UseRouting();

            // Indicate that the hosted application should use the configured default authentication scheme.
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapHub<PenmanHub>(Constants.PenmanHubRoute);
                endpoints.MapControllers();
            });
        }
    }
}
