import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IRootState, IAuthenticatedUser, IReplayableAction } from '../../store/types';
import { replayMementos, ping } from '../../store/actions/offlineActions';

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

    const refreshActions: IReplayableAction[] = [];
    state.auth.offlineActionQueue
        .forEach(action => refreshActions.push({
            memento: action.memento || ((user: IAuthenticatedUser, suppressTimeout: boolean) => {}),
            timestamp: action.timestamp,
        }));

    return {
        user: state.auth.authenticatedUser,
        isOffline: state.offline.isOffline,
        mergedActionQueue: mergedActions.sort((left, right) => (left.timestamp - right.timestamp)),
        mergedActionCount: mergedActions.length,
        refreshActionQueue: refreshActions,
        refreshActionQueueCount: refreshActions.length,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        ping: () => dispatch(ping),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class OfflineManager extends Component<Props> {
    componentDidUpdate() {
        if (this.props.isOffline) {
            this.props.ping();
        }
    }

    render() {
        if (!this.props.isOffline) {
            // prioritize re-authentication over every other action
            replayMementos(
                this.props.user,
                this.props.refreshActionQueueCount > 0 ? this.props.refreshActionQueue : this.props.mergedActionQueue,
                true
            );
        }
        return (
            <div data-pendingActionCount={this.props.mergedActionCount + this.props.refreshActionQueueCount} data-isOffline={this.props.isOffline} style={{display: 'none'}} />
        );
    }
}

export default localConnector(OfflineManager);
