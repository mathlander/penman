import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IRootState, IAuthenticatedUser, IReplayableAction } from '../../store/types';
import { replayMementos, ping } from '../../store/actions/offlineActions';

const mapStateToProps = (state: IRootState) => {
    const mergedActions: IReplayableAction[] = state.book.offlineActionQueue
        .concat(state.chapter.offlineActionQueue)
        .concat(state.personification.offlineActionQueue)
        .concat(state.prompt.offlineActionQueue)
        .concat(state.short.offlineActionQueue)
        .concat(state.timeline.offlineActionQueue)
        .concat(state.timeline.offlineActionQueue)
    const refreshActions: IReplayableAction[] = state.auth.offlineActionQueue;
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
            <div data-pendingactioncount={this.props.mergedActionCount + this.props.refreshActionQueueCount} data-isoffline={this.props.isOffline} style={{display: 'none'}} />
        );
    }
}

export default localConnector(OfflineManager);
