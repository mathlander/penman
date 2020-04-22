Rebuilding the models:

dotnet ef dbcontext scaffold "Server=127.0.0.1;Port=5432;Database=penman;Username=penman;Password=************" Npgsql.EntityFrameworkCore.PostgreSQL -o Models



Publish the project:

dotnet publish --configuration Release --output bin\out\

