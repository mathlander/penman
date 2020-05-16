import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import { IRootState, IAuthenticatedUser, INewTimeline, ITimeline } from '../../store/types';
import { isAuthTokenExpired, refreshToken } from '../../store/actions/authActions';
import { create, read, readAll, update, deleteEntity } from '../../store/actions/timelineActions';
import { defaultDate, timelineConstants } from '../../config/constants';
import NewTimelineCard from './NewTimelineCard';
import TimelineCard from './TimelineCard';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        timelines: state.timeline.timelines,
        timelinesCount: Object.values(state.timeline.timelines).length,
        lastReadAll: state.timeline.lastReadAll || defaultDate,
        isOffline: state.offline.isOffline,
        isLoading: !state.offline.isOffline
            && state.timeline.pendingActions.length > 0
            && state.timeline.pendingActions[0].type === timelineConstants.READ_ALL_TIMELINES,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    const refresh = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => dispatch(refreshToken(user, suppressTimeoutAlert));
    return {
        isTokenExpired: (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => isAuthTokenExpired(user, suppressTimeoutAlert, refresh),
        create: (user: IAuthenticatedUser, newTimeline: INewTimeline, suppressTimeoutAlert: boolean) => dispatch(create(user, newTimeline, suppressTimeoutAlert)),
        read: (user: IAuthenticatedUser, timelineId: number, suppressTimeoutAlert: boolean) => dispatch(read(user, timelineId, suppressTimeoutAlert)),
        readAll: (user: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert: boolean) => dispatch(readAll(user, lastReadAll, suppressTimeoutAlert)),
        update: (user: IAuthenticatedUser, timeline: ITimeline, suppressTimeoutAlert: boolean) => dispatch(update(user, timeline, suppressTimeoutAlert)),
        deleteEntity: (user: IAuthenticatedUser, timeline: ITimeline, suppressTimeoutAlert: boolean) => dispatch(deleteEntity(user, timeline, suppressTimeoutAlert)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class TimelinesPage extends Component<Props> {
    componentDidMount() {
        this.props.readAll(this.props.authenticatedUser, this.props.lastReadAll, this.props.isOffline);
    }

    render() {
        const { authenticatedUser, isOffline, isTokenExpired } = this.props;
        const loaderDisplayStyle = (this.props.isLoading && this.props.timelinesCount === 0 ? 'block' : 'none');
        if (isTokenExpired(authenticatedUser, isOffline)) {
            push('/signin');
        }
        return (
            <div className="timelines container">
                <div className="timelines-work-area stories container grey-text text-darken-1 col s12 m6">
                    <NewTimelineCard />
                    <div className="timelines">
                        <div className="blue-text" style={{display: loaderDisplayStyle}}>
                            <div className="preloader-wrapper big active">
                                <div className="spinner-layer"><div className="circle" /></div>
                                <div className="gap-patch"><div className="circle" /></div>
                                <div className="circle-clipper right"><div className="circle"></div></div>
                            </div>
                        </div>
                        {Object.values(this.props.timelines).reverse().map(timeline =>
                            <TimelineCard
                                key={`timelineId:${timeline.timelineId}`}
                                timeline={timeline}
                                user={authenticatedUser}
                                isOffline={isOffline}
                                update={this.props.update}
                                deleteEntity={this.props.deleteEntity}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default localConnector(TimelinesPage);
