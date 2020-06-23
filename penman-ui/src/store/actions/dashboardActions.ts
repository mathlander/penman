import { useDispatch } from 'react-redux';
import { dashboardConstants } from '../../constants';

export const visitRecentItem = (scrollSpyId: string) => {
    const dispatch = useDispatch();
    const timestamp = Date.now();
    dispatch({ type: dashboardConstants.VISIT_RECENT_ITEM, payload: scrollSpyId, timestamp, suppressTimeoutAlert: true });
};

export const visitRecentItemClear = () => {
    const dispatch = useDispatch();
    const timestamp = Date.now();
    dispatch({ type: dashboardConstants.VISIT_RECENT_ITEM_CLEAR, timestamp, suppressTimeoutAlert: true });
};
