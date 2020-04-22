import { welcomeConstants } from '../../config/constants';
import { IWelcomeState, IWelcomeErrorState, IWelcomeReducerAction } from '../types';

const nullErrorState: IWelcomeErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};
const initState: IWelcomeState = {
    welcomeErrorState: nullErrorState,
};

const welcomeReducer = (state: IWelcomeState = initState, action: IWelcomeReducerAction): IWelcomeState => {
    switch (action.type) {
        case welcomeConstants.EMAIL:
            return state;
        case welcomeConstants.EMAIL_SUCCESS:
            return {
                ...state,
                welcomeErrorState: nullErrorState,
            };
        case welcomeConstants.EMAIL_ERROR:
            return {
                ...state,
                welcomeErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the inquiry.',
                    displayErrorMessage: 'An error occurred while attempting to send your email.',
                }
            };

        default:
            return state;
    }
}

export default welcomeReducer;
