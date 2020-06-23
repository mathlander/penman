import { dashboardConstants } from '../../constants';
import { IDashboardState, IDashboardAction } from '../types';

const initState: IDashboardState = {
    scrollSpyId: null,
};

const dashboardReducer = (state: IDashboardState = initState, action: IDashboardAction): IDashboardState => {
    switch (action.type) {
        case dashboardConstants.VISIT_RECENT_ITEM:
            return {
                ...state,
                scrollSpyId: action.payload,
            };
        case dashboardConstants.VISIT_RECENT_ITEM_CLEAR:
            return {
                ...state,
                scrollSpyId: null,
            };
        default:
            return state;
    }
};

export default dashboardReducer;
