import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IRootState, IAuthenticatedUser, IReplayableAction } from '../../store/types';
import { replayMementos } from '../../store/actions/offlineActions';

const mapStateToProps = (state: IRootState) => {
    const mergedActions: IReplayableAction[] = [];
    state.book.offlineActionQueue
        .forEach(action => mergedActions.push({
            memento: action.memento || ((user: IAuthenticatedUser, suppressTimeout: boolean) => {}),
            timestamp: action.timestamp,
        }));
    state.chapter.offlineActionQueue
        .forEach(action => mergedActions.push({
            memento: action.memento || ((user: IAuthenticatedUser, suppressTimeout: boolean) => {}),
            timestamp: action.timestamp,
        }));
    state.personification.offlineActionQueue
        .forEach(action => mergedActions.push({
            memento: action.memento || ((user: IAuthenticatedUser, suppressTimeout: boolean) => {}),
            timestamp: action.timestamp,
        }));
    state.prompt.offlineActionQueue
        .forEach(action => mergedActions.push({
            memento: action.memento || ((user: IAuthenticatedUser, suppressTimeout: boolean) => {}),
            timestamp: action.timestamp,
        }));
    state.short.offlineActionQueue
        .forEach(action => mergedActions.push({
            memento: action.memento || ((user: IAuthenticatedUser, suppressTimeout: boolean) => {}),
            timestamp: action.timestamp,
        }));
    state.timeline.offlineActionQueue
        .forEach(action => mergedActions.push({
            memento: action.memento || ((user: IAuthenticatedUser, suppressTimeout: boolean) => {}),
            timestamp: action.timestamp,
        }));
    state.timeline.offlineActionQueue
        .forEach(action => mergedActions.push({
            memento: action.memento || ((user: IAuthenticatedUser, suppressTimeout: boolean) => {}),
            timestamp: action.timestamp,
        }));
    return {
        user: state.auth.authenticatedUser,
        // isOffline: state.offline.isOffline,
        isOffline: false,
        mergedActionQueue: mergedActions.sort((left, right) => (left.timestamp - right.timestamp)),
        mergedActionCount: mergedActions.length,
    };
};

const localConnector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class OfflineManager extends Component<Props> {
    render() {
        if (!this.props.isOffline) {
            replayMementos(this.props.user, this.props.mergedActionQueue, true);
        }
        return (
            <div data-pendingActionCount={this.props.mergedActionCount} style={{display: 'none'}} />
        );
    }
}

export default localConnector(OfflineManager);
