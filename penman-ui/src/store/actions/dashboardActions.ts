import { dashboardConstants } from '../../config/constants';

export const visitRecentItem = (scrollspyId: string) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        dispatch({ type: dashboardConstants.VISIT_RECENT_ITEM, payload: scrollspyId, timestamp, suppressTimeoutAlert: true });
    };
};

export const visitRecentItemClear = () => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        dispatch({ type: dashboardConstants.VISIT_RECENT_ITEM_CLEAR, timestamp, suppressTimeoutAlert: true });
    };
};
