import M from 'materialize-css';
import { IError } from '../types';

export const processError = (errorState: IError, clearErrorType: string, showInternalError?: boolean) => {
    return (dispatch: any) => {
        M.toast({ html: `${errorState.displayErrorMessage}` });
        if (showInternalError) {
            M.toast({ html: `${errorState.internalErrorMessage}` });
        }
        dispatch({ type: clearErrorType, timestamp: Date.now() });
    };
};
