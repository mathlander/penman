import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IReplayableAction } from '../../store/type-defs/offline-types';
import { IRootState } from '../../store/type-defs/root-types';
import { ping } from '../../store/actions/offlineActions';
import { authConstants } from '../../constants';

const mapStateToProps = (state: IRootState) => {
    const mergedActions: IReplayableAction[] = state.prompt.offlineActionQueue
        .concat(state.auth.offlineActionQueue.filter(queuedAction => queuedAction.type !== authConstants.REFRESH_TOKEN));
    const refreshActions: IReplayableAction[] = state.auth.offlineActionQueue
        .filter(queuedAction => queuedAction.type === authConstants.REFRESH_TOKEN);
    return {
        user: state.auth.authenticatedUser,
        isOffline: state.offline.isOffline,
        mergedActionQueue: mergedActions.sort((left, right) => (left.timestamp - right.timestamp)),
        mergedActionCount: mergedActions.length,
        refreshActionQueue: refreshActions,
        refreshActionQueueCount: refreshActions.length,
    };
};

const localConnector = connect(mapStateToProps);

class OfflineManager extends Component<ConnectedProps<typeof localConnector>> {
    componentDidMount() {
        if (this.props.isOffline) {
            ping();
        }
    }

    render() {
        if (!this.props.isOffline) {
            const replayItem = this.props.refreshActionQueue.shift() || this.props.mergedActionQueue.shift();
            if (replayItem && this.props.user.token) {
                replayItem.playAction(this.props.user.toReplayUser(), false);
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
