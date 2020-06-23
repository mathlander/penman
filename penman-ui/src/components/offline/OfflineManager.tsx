import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IRootState, IReplayableAction } from '../../store/types';
import { ping } from '../../store/actions/offlineActions';

const mapStateToProps = (state: IRootState) => {
    const mergedActions: IReplayableAction[] = state.book.offlineActionQueue
        .concat(state.chapter.offlineActionQueue)
        .concat(state.personification.offlineActionQueue)
        .concat(state.prompt.offlineActionQueue)
        .concat(state.short.offlineActionQueue)
        .concat(state.tag.offlineActionQueue)
        .concat(state.relationship.offlineActionQueue);
    const refreshActions: IReplayableAction[] = [...state.auth.offlineActionQueue];
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
    componentDidMount() {
        if (this.props.isOffline) {
            this.props.ping();
        }
    }

    render() {
        if (!this.props.isOffline) {
            const replayItem = this.props.refreshActionQueue.shift() || this.props.mergedActionQueue.shift();
            if (replayItem && this.props.user.token) {
                replayItem.playAction(this.props.user, false);
            }
        }
        return (
            <div 
                id="offline-manager"
                data-pending-action-count={this.props.mergedActionCount + this.props.refreshActionQueueCount}
                data-is-offline={this.props.isOffline}
                style={{ display: 'none' }} />
        );
    }
}

export default localConnector(OfflineManager);
