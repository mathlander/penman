using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace PenmanApi.Hubs
{
    [Authorize]
    public class PenmanHub : Hub
    {
        public async Task AddToGroup(string groupName) => await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        public async Task RemoveFromGroup(string groupName) => await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        // public override async Task OnConnectedAsync()
        // {
        //     /*
        //         Modify the users token to include subscription group memberships
        //         Access them with the _httpContextAccessor
        //     */
        //     await base.OnConnectedAsync();
        // }

        // public override async Task OnDisconnectedAsync(Exception exception)
        // {
        //     await base.OnDisconnectedAsync(exception);
        // }
    }
}
