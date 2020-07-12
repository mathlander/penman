import M from 'materialize-css';
// import { useDispatch } from 'react-redux';

export const processError = (errorState, clearErrorType, showInternalError = false) => {
    return (dispatch) => {
        // const dispatch = useDispatch();
        M.toast({ html: `${errorState.displayErrorMessage}` });
        if (showInternalError) {
            M.toast({ html: `Internal message: ${errorState.internalErrorMessage}` });
        }
        dispatch({ type: clearErrorType, timestamp: Date.now() });
    };
};
