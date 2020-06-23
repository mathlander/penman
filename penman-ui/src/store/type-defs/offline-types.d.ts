export interface IReplayUser {
    token: string;
    refreshToken: string;
    userId: number;
};

export interface IReplayableAction {
    type: string;
    timestamp: number;
    serializedData: string;
    playAction: (authenticatedUser: IReplayUser, isOffline: boolean) => void;
};

export interface IOfflineState {
    isOffline: boolean;
};

export interface IOfflineAction {
    type: string;
};

// export interface IOfflineWorkItem<T> {
//     clientId: UUID;
//     onApiProcessed(successResponseData: T): T;
//     toSerializedJSON(): string;
// };
