import { offlineConstants } from '../../constants';

const initState = { isOffline: false };

const offlineReducer = (state = initState, action) => {
    if (action.type === offlineConstants.GO_OFFLINE || action.type.endsWith('_TIMEOUT')) {
        return {
            ...state,
            isOffline: true,
        };
    } else if (action.type === offlineConstants.GO_ONLINE || action.type.endsWith('_SUCCESS')) {
        return {
            ...state,
            isOffline: false,
        };
    }
    return state;
};

export default offlineReducer;
