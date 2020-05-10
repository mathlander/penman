import M from 'materialize-css';
import {
    authConstants,
    bookConstants,
    chapterConstants,
    personificationConstants,
    promptConstants,
    timelineConstants,
    welcomeConstants,
    shortConstants
} from '../../config/constants';
import {
    IAuthenticationErrorState,
    IBookErrorState,
    IChapterErrorState,
    IPersonificationErrorState,
    IPromptErrorState,
    IShortErrorState,
    ITimelineErrorState,
    IWelcomeErrorState
} from '../types';

export const processAuthError = (errorState: IAuthenticationErrorState, showInternalError?: boolean) => {
    return (dispatch: any) => {
        M.toast({ html: `${errorState.displayErrorMessage}` });
        if (showInternalError) {
            M.toast({ html: `${errorState.internalErrorMessage}` });
        }
        dispatch({ type: authConstants.AUTH_CLEAR_ERROR, timestamp: Date.now() });
    };
};

export const processBookError = (errorState: IBookErrorState, showInternalError?: boolean) => {
    return (dispatch: any) => {
        M.toast({ html: `${errorState.displayErrorMessage}` });
        if (showInternalError) {
            M.toast({ html: `${errorState.internalErrorMessage}` });
        }
        dispatch({ type: bookConstants.BOOK_CLEAR_ERROR, timestamp: Date.now() });
    };
};

export const processChapterError = (errorState: IChapterErrorState, showInternalError?: boolean) => {
    return (dispatch: any) => {
        M.toast({ html: `${errorState.displayErrorMessage}` });
        if (showInternalError) {
            M.toast({ html: `${errorState.internalErrorMessage}` });
        }
        dispatch({ type: chapterConstants.CHAPTER_CLEAR_ERROR, timestamp: Date.now() });
    };
};

export const processPersonificationError = (errorState: IPersonificationErrorState, showInternalError?: boolean) => {
    return (dispatch: any) => {
        M.toast({ html: `${errorState.displayErrorMessage}` });
        if (showInternalError) {
            M.toast({ html: `${errorState.internalErrorMessage}` });
        }
        dispatch({ type: personificationConstants.PERSONIFICATION_CLEAR_ERROR, timestamp: Date.now() });
    };
};

export const processPromptError = (errorState: IPromptErrorState, showInternalError?: boolean) => {
    return (dispatch: any) => {
        M.toast({ html: `${errorState.displayErrorMessage}` });
        if (showInternalError) {
            M.toast({ html: `${errorState.internalErrorMessage}` });
        }
        dispatch({ type: promptConstants.PROMPT_CLEAR_ERROR, timestamp: Date.now() });
    };
};

export const processShortError = (errorState: IShortErrorState, showInternalError?: boolean) => {
    return (dispatch: any) => {
        M.toast({ html: `${errorState.displayErrorMessage}` });
        if (showInternalError) {
            M.toast({ html: `${errorState.internalErrorMessage}` });
        }
        dispatch({ type: shortConstants.SHORT_CLEAR_ERROR, timestamp: Date.now() });
    };
};

export const processTimelineError = (errorState: ITimelineErrorState, showInternalError?: boolean) => {
    return (dispatch: any) => {
        M.toast({ html: `${errorState.displayErrorMessage}` });
        if (showInternalError) {
            M.toast({ html: `${errorState.internalErrorMessage}` });
        }
        dispatch({ type: timelineConstants.TIMELINE_CLEAR_ERROR, timestamp: Date.now() });
    };
};

export const processWelcomeError = (errorState: IWelcomeErrorState, showInternalError?: boolean) => {
    return (dispatch: any) => {
        M.toast({ html: `${errorState.displayErrorMessage}` });
        if (showInternalError) {
            M.toast({ html: `${errorState.internalErrorMessage}` });
        }
        dispatch({ type:welcomeConstants.WELCOME_CLEAR_ERROR, timestamp: Date.now() });
    };
};

