using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using IdentityModel.AspNetCore;
using Npgsql.EntityFrameworkCore.PostgreSQL.Extensions;
using PenmanApi.Config;
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
            services.AddCors(options => options.AddDefaultPolicy(policyBuilder =>
            {
                policyBuilder.AllowAnyMethod()
                    .AllowCredentials()
                    .AllowAnyHeader()
                    .WithOrigins(allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries));
            }));

            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_3_0);
            //services.AddSignalR();

            // Pull in the connections string from the environment variables.
            // On Windows environments this may be set via:
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
            services.AddAuthentication(options =>
            {
                // Indicate that requests should be challenged by default using a JWT bearer authentication scheme,
                // i.e. check the "Authentication" http/https header for a value of "Bearer <encodedJwtToken>" on
                // every request where the controller or the action has an [Authorize] attribute (unless overridden
                // with the [AllowAnonymous] attribute).
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false;
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    // Encoded info must indicate it was issued by the JwtConfig.Issuer value defined in appsettings.
                    ValidIssuer = authConfig.Issuer,
                    // Encoded info must indicate it is being used by the JwtConfig.Audience value defined in appsettings.
                    ValidAudience = authConfig.Audience,
                    // This value is used to encrypt/decrypt the JWT token returned to the user on sign-in and, while the
                    // encoded token is sent to the user, the security key is not.
                    IssuerSigningKey = new SymmetricSecurityKey(secretKey),
                    // Define the method to check that before the token is not expired.  The default implementation has proven to work.
                    // LifetimeValidator = (before, expires, token, param) => expires > DateTime.UtcNow,

                    ValidateIssuerSigningKey = true,
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true
                };
                // handler for SignalR events against privileged routes
                // options.Events = new JwtBearerEvents
                // {
                //     // Allow the JWT authentication handler to access the token from the query string when
                //     // the client (SignalR) is unable to include it in the Authorization header directly.
                //     OnMessageReceived = context =>
                //     {
                //         var accessToken = context.Request.Query["access_token"];
                //         var path = context.HttpContext.Request.Path;
                //         var isProjectHubPath = path.StartsWithSegments(Constants.ProjectsHubRoute);
                //         var isUsersHubPath = path.StartsWithSegments(Constants.UsersHubRoute);
                //         if (!String.IsNullOrEmpty(accessToken) && (isProjectHubPath || isUsersHubPath))
                //             context.Token = accessToken;
                //         return Task.CompletedTask;
                //     },
                // };
            });

            // services.AddAuthorization(options =>
            // {
            //     options.AddPolicy()
            // });

            // Take advantage of the built-in dependency injection model via the services IServiceCollection.
            // Singleton instances are shared for every request over the life of the hosted process.
            services.AddSingleton<IAuthConfig>(authConfig);

            // Register the HttpContextAccessor to enable us to retrieve claims from the JWT, such as UserId.
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

            // Register the HubConnectionContext accessor to implicitly retrieve authorId on SignalR communications.
            // Alternatively, the EmailBasedIdProvider may be used if the email claim should be used as the authorId,
            // but that is not inline with how this API is setup (i.e. email addresses may be updated with an Author record).
            // services.AddSingleton<IUserIdProvider, NameUserIdProvider>();

            // Scoped instances are generated anew for each request.
            services.AddScoped<IAuthorService, AuthorService>();
            services.AddScoped<IBookService, BookService>();
            services.AddScoped<IPersonificationService, PersonificationService>();
            services.AddScoped<IPromptService, PromptService>();
            services.AddScoped<IRelationshipService, RelationshipService>();
            services.AddScoped<IShortService, ShortService>();
            services.AddScoped<ITagService, TagService>();
            services.AddScoped<ITimelineService, TimelineService>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            // Set the global cors policy.
            app.UseCors();

            // app.UseHttpsRedirection();

            // Indicates that the action taken by the API should respond to the route, i.e. http://url.com/{this}/{part}
            // which is almost certainly what would always be expected.
            app.UseRouting();

            // Indicate that the hosted application should use the configured default authentication scheme (JWT).
            app.UseAuthentication();
            app.UseAuthorization();

            // app.UseSignalR(routes =>
            // {
            //     routes.MapHub<ProjectsHub>(Constants.ProjectsHubRoute);
            // });

            app.UseEndpoints(endpoints =>
            {
                // endpoints.MapHub()
                endpoints.MapControllers();
            });
        }
    }
}
