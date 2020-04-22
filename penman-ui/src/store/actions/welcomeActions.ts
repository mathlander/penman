import axios from 'axios';
import { apiConstants, welcomeConstants } from '../../config/constants';
import { ILeadEmail, IWelcomeErrorState } from '../types';

export const submitLead = (lead: ILeadEmail) => {
    return (dispatch: any) => {
        const url = `${apiConstants.leadsController}/email`;
        const data = lead;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            }
        };
        dispatch({ type: welcomeConstants.EMAIL, payload: lead });
        axios.post(
            url,
            data,
            config
        ).then((response) => {
            dispatch({ type: welcomeConstants.EMAIL_SUCCESS });
        }).catch((err) => {
            const error: IWelcomeErrorState = {
                internalErrorMessage: `Received the following error while attempting to submit the client email: ${err}`,
                displayErrorMessage: `Email submission failed.  Please try again.`
            }
            dispatch({ type: welcomeConstants.EMAIL_ERROR, error: error });
        });
    };
};
