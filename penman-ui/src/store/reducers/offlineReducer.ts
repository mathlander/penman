import {
    offlineConstants,
    authConstants,
    bookConstants,
    chapterConstants,
    personificationConstants,
    promptConstants,
    shortConstants,
    timelineConstants,
    welcomeConstants
} from '../../config/constants';
import { IOfflineState, IOfflineReducerAction } from '../types';

const initState: IOfflineState = {
    isOffline: false,
};

const offlineReducer = (state: IOfflineState = initState, action: IOfflineReducerAction): IOfflineState => {
    switch (action.type) {
        case offlineConstants.GO_OFFLINE:
            return {
                ...state,
                isOffline: true,
            };

        case authConstants.LOGIN_SUCCESS:
        case authConstants.REFRESH_TOKEN_SUCCESS:
        case authConstants.CREATE_NEW_USER_SUCCESS:
        case bookConstants.READ_BOOK_SUCCESS:
        case bookConstants.DELETE_BOOK_SUCCESS:
        case bookConstants.UPDATE_BOOK_SUCCESS:
        case bookConstants.READ_ALL_BOOKS_SUCCESS:
        case bookConstants.CREATE_NEW_BOOK_SUCCESS:
        case chapterConstants.READ_CHAPTER_SUCCESS:
        case chapterConstants.DELETE_CHAPTER_SUCCESS:
        case chapterConstants.UPDATE_CHAPTER_SUCCESS:
        case chapterConstants.READ_ALL_CHAPTERS_SUCCESS:
        case chapterConstants.CREATE_NEW_CHAPTER_SUCCESS:
        case personificationConstants.READ_PERSONIFICATION_SUCCESS:
        case personificationConstants.UPDATE_PERSONIFICATION_SUCCESS:
        case personificationConstants.DELETE_PERSONIFICATION_SUCCESS:
        case personificationConstants.READ_ALL_PERSONIFICATIONS_SUCCESS:
        case personificationConstants.CREATE_NEW_PERSONIFICATION_SUCCESS:
        case promptConstants.READ_PROMPT_SUCCESS:
        case promptConstants.DELETE_PROMPT_SUCCESS:
        case promptConstants.UPDATE_PROMPT_SUCCESS:
        case promptConstants.READ_ALL_PROMPTS_SUCCESS:
        case promptConstants.CREATE_NEW_PROMPT_SUCCESS:
        case shortConstants.READ_SHORT_SUCCESS:
        case shortConstants.UPDATE_SHORT_SUCCESS:
        case shortConstants.DELETE_SHORT_SUCCESS:
        case shortConstants.READ_ALL_SHORTS_SUCCESS:
        case shortConstants.CREATE_NEW_SHORT_SUCCESS:
        case timelineConstants.READ_TIMELINE_SUCCESS:
        case timelineConstants.DELETE_TIMELINE_SUCCESS:
        case timelineConstants.UPDATE_TIMELINE_SUCCESS:
        case timelineConstants.READ_ALL_TIMELINES_SUCCESS:
        case timelineConstants.CREATE_NEW_TIMELINE_SUCCESS:
        case welcomeConstants.EMAIL_SUCCESS:
            return {
                ...state,
                isOffline: false,
            }

        default:
            return state;
    }
}

export default offlineReducer;
