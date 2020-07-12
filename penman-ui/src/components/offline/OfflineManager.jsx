import React, { Component } from 'react';
import { connect } from 'react-redux';
import { ping } from '../../store/actions/offlineActions';
import { authConstants } from '../../constants';

const mapStateToProps = (state) => {
    const mergedActions = state.prompt.offlineActionQueue
        .concat(state.auth.offlineActionQueue.filter(queuedAction => queuedAction.type !== authConstants.REFRESH_TOKEN));
    const refreshActions = state.auth.offlineActionQueue
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

const mapDispatchToProps = (dispatch) => {
    return {
        ping: () => dispatch(ping()),
        replay: (replayItem, replayUser, isOffline) => dispatch(replayItem.playAction(replayUser, isOffline)),
    }
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

class OfflineManager extends Component {
    componentDidMount() {
        if (this.props.isOffline) {
            this.props.ping();
        }
    }

    render() {
        if (!this.props.isOffline) {
            const replayItem = this.props.refreshActionQueue.shift() || this.props.mergedActionQueue.shift();
            if (replayItem && this.props.user.token) {
                // replayItem.playAction(this.props.user.toReplayUser(), false);
                this.props.replay(replayItem, this.props.user.toReplayUser(), false);
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
