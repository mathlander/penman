import M from 'materialize-css';
import { useDispatch } from 'react-redux';
import { IError } from '../type-defs/error-types';

export const processError = (errorState: IError, clearErrorType: string, showInternalError?: boolean) => {
    const dispatch = useDispatch();
    M.toast({ html: `${errorState.displayErrorMessage}` });
    if (showInternalError) {
        M.toast({ html: `Internal message: ${errorState.internalErrorMessage}` });
    }
    dispatch({ type: clearErrorType, timestamp: Date.now() });
};
