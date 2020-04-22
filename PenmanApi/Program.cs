using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace PenmanApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder
                        .ConfigureAppConfiguration((hostingContext, config) => {
                            var environmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? String.Empty;
                            config.SetBasePath(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location));
                            config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: false);
                            config.AddJsonFile($"appsettings.{environmentName}.json", optional: true, reloadOnChange: false);
                        })
                        .UseStartup<Startup>();
                });
    }
}
