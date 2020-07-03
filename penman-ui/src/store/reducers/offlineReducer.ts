import { offlineConstants } from '../../constants';
import { IOfflineState, IOfflineAction } from '../type-defs/offline-types';
import { IPenmanAction } from '../type-defs/action-types';

const initState: IOfflineState = {
    isOffline: false,
};

const offlineReducer = (state: IOfflineState = initState, action: IOfflineAction): IOfflineState => {
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
