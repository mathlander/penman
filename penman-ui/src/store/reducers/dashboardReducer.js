import { dashboardConstants } from '../../constants';

const initState = { scrollSpyId: null };

const dashboardReducer = (state = initState, action) => {
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
