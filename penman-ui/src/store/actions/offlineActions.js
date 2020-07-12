import axios from 'axios';
// import { useDispatch } from 'react-redux';
import { apiConstants, offlineConstants } from '../../constants';

export const ping = () => {
    return (dispatch) => {
        // const dispatch = useDispatch();
        const url = apiConstants.ping;
        const config = {
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        axios.get(
            url,
            config
        ).then(() => {
            dispatch({ type: offlineConstants.GO_ONLINE, timestamp });
        }).catch(() => {
            dispatch({ type: offlineConstants.GO_OFFLINE, timestamp });
        });
    };
};
