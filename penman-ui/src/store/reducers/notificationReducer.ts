import { notificationConstants } from '../../constants';
import { INotificationState, INotificationAction, IError, ErrorCodes, nullError, apiUnreachableError } from '../types';

const initState: INotificationState = {
    hubConnectionsByUrl: {},
    subscriptionsByUrl: {},
    notificationErrorState: nullError,
    pendingActions: [],
};

const notificationReducer = (state: INotificationState = initState, action: INotificationAction): INotificationState => {
    let nextState = state;
    switch (action.type) {
        case notificationConstants.NOTIFICATION_CLEAR_ERROR:
            nextState = {
                ...state,
                notificationErrorState: nullError,
            };
            return nextState;

        case notificationConstants.SUBSCRIBE_PENMAN_HUB:
            const subscribingHub: signalR.HubConnection = action.payload.penmanHubConnection;
            nextState = {
                ...state,
                hubConnectionsByUrl: {
                    ...state.hubConnectionsByUrl,
                    [subscribingHub.baseUrl]: subscribingHub,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            return nextState;
        case notificationConstants.SUBSCRIBE_PENMAN_HUB_ERROR:
            const missedConnection: signalR.HubConnection = action.payload.penmanHubConnection;
            nextState = {
                ...state,
                hubConnectionsByUrl: { ...state.hubConnectionsByUrl, },
                notificationErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to subscribe to the notifications hub.',
                    internalErrorMessage: 'The API returned an error while attempting to subscribe to the notifications hub.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.hubConnectionsByUrl[missedConnection.baseUrl];
            return nextState;
        case notificationConstants.SUBSCRIBE_PENMAN_HUB_SUCCESS:
            nextState = {
                ...state,
                notificationErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            return nextState;
        case notificationConstants.SUBSCRIBE_PENMAN_HUB_TIMEOUT:
            const timedOutConnection: signalR.HubConnection = action.payload.penmanHubConnection;
            nextState = {
                ...state,
                notificationErrorState: action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.hubConnectionsByUrl[timedOutConnection.baseUrl];
            delete nextState.subscriptionsByUrl[timedOutConnection.baseUrl];
            return nextState;

        case notificationConstants.UNSUBSCRIBE_PENMAN_HUB:
            const unsubscribePenmanHub: signalR.HubConnection = action.payload;
            unsubscribePenmanHub.baseUrl
            nextState = {
                ...state,
                hubConnectionsByUrl: {
                    ...state.hubConnectionsByUrl,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            delete nextState.hubConnectionsByUrl[unsubscribePenmanHub.baseUrl];
            return nextState;
        case notificationConstants.UNSUBSCRIBE_PENMAN_HUB_ERROR:
            nextState = {
                ...state,
                notificationErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to unsubscribe from the notifications hub.',
                    internalErrorMessage: 'The API returned an error while attempting to unsubscribe from the notifications hub.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            return nextState;
        case notificationConstants.UNSUBSCRIBE_PENMAN_HUB_SUCCESS:
            nextState = {
                ...state,
                notificationErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            return nextState;
        case notificationConstants.UNSUBSCRIBE_PENMAN_HUB_TIMEOUT:
            nextState = {
                ...state,
                notificationErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            return nextState;

        case notificationConstants.SUBSCRIBE_GROUP:
            const groupHub: signalR.HubConnection = action.payload.penmanHubConnection;
            nextState = {
                ...state,
                subscriptionsByUrl: {
                    ...state.subscriptionsByUrl,
                    [groupHub.baseUrl]: state.subscriptionsByUrl[groupHub.baseUrl]
                        ? [...state.subscriptionsByUrl[groupHub.baseUrl], action.payload.group]
                        : [action.payload.group],
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            return nextState;
        case notificationConstants.SUBSCRIBE_GROUP_ERROR:
            const failedGroupHub: signalR.HubConnection = action.payload.penmanHubConnection;
            nextState = {
                ...state,
                subscriptionsByUrl: {
                    ...state.subscriptionsByUrl,
                    [failedGroupHub.baseUrl]: state.subscriptionsByUrl[failedGroupHub.baseUrl].filter(groupName => groupName !== action.payload.group),
                },
                notificationErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to subscribe to notifications for the given group.',
                    internalErrorMessage: `The API returned an error while attempting to subscribe to notifications for the group '${action.payload.group}'.`,
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            return nextState;
        case notificationConstants.SUBSCRIBE_GROUP_SUCCESS:
            nextState = {
                ...state,
                notificationErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            return nextState;
        case notificationConstants.SUBSCRIBE_GROUP_TIMEOUT:
            const timedOutGroupHub: signalR.HubConnection = action.payload.penmanHubConnection;
            nextState = {
                ...state,
                subscriptionsByUrl: {
                    ...state.subscriptionsByUrl,
                    [timedOutGroupHub.baseUrl]: state.subscriptionsByUrl[timedOutGroupHub.baseUrl].filter(groupName => groupName !== action.payload.group),
                },
                notificationErrorState: action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            return nextState;

        case notificationConstants.UNSUBSCRIBE_GROUP:
            const unsubscribeGroupHub: signalR.HubConnection = action.payload.penmanHubConnection;
            nextState = {
                ...state,
                subscriptionsByUrl: {
                    ...state.subscriptionsByUrl,
                    [unsubscribeGroupHub.baseUrl]: state.subscriptionsByUrl[unsubscribeGroupHub.baseUrl].filter(groupName => groupName !== action.payload.group),
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            return nextState;
        case notificationConstants.UNSUBSCRIBE_GROUP_ERROR:
            nextState = {
                ...state,
                notificationErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to subscribe to notifications for the given group.',
                    internalErrorMessage: `The API returned an error while attempting to subscribe to notifications for the group '${action.payload.group}'.`,
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            return nextState;
        case notificationConstants.UNSUBSCRIBE_GROUP_SUCCESS:
            const removedGroupHub: signalR.HubConnection = action.payload.penmanHubConnection;
            nextState = {
                ...state,
                notificationErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            return nextState;
        case notificationConstants.UNSUBSCRIBE_GROUP_TIMEOUT:
            nextState = {
                ...state,
                notificationErrorState: action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            return nextState;

        /**
         * To  be implemented...
         */
        case notificationConstants.NOTIFICATION_USER_ACTIVATED:
            return state;

        case notificationConstants.NOTIFICATION_USER_MESSAGED:
            return state;

        case notificationConstants.NOTIFICATION_USER_CONNECTION_REQUEST:
            return state;

        case notificationConstants.NOTIFICATION_USER_SHARED_ENTITY:
            return state;

        default:
            return state;
    }
};

export default notificationReducer;
