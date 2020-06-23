export interface IDashboardAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload?: any;
};

export interface IDashboardState {
    scrollSpyId: string | null;
};
