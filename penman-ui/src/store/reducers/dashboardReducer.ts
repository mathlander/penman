import { dashboardConstants } from '../../config/constants';
import { IDashboardState, IDashboardReducerAction } from '../types';

const initState: IDashboardState = {
    scrollspyId: null,
};

const dashboardReducer = (state: IDashboardState = initState, action: IDashboardReducerAction): IDashboardState => {
    switch (action.type) {
        case dashboardConstants.VISIT_RECENT_ITEM:
            return {
                ...state,
                scrollspyId: action.payload,
            };
        case dashboardConstants.VISIT_RECENT_ITEM_CLEAR:
            return {
                ...state,
                scrollspyId: null,
            };

        default:
            return state;
    }
}

export default dashboardReducer;
