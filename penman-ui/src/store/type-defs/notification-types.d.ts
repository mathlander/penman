import * as signalR from '@microsoft/signalr';

export interface INotificationAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload: any;
    error?: IError;
};

export interface INotificationState {
    hubConnectionsByUrl: Record<string, signalR.HubConnection>;
    subscriptionsByUrl: Record<string, string[]>;
    notificationErrorState: IError;
    pendingActions: INotificationAction[];
};
