import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import { IRootState, IAuthenticatedUser, INewTimeline, ITimeline } from '../../store/types';
import { isAuthTokenExpired } from '../../store/actions/authActions';
import bookImg from '../../img/book.jpg';
import { create, read, readAll, update, deleteEntity } from '../../store/actions/timelineActions';
import { defaultDate } from '../../config/constants';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        timelines: state.timeline.timelines,
        lastReadAll: state.timeline.lastReadAll || defaultDate,
        isOffline: state.offline.isOffline,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        isTokenExpired: (user: IAuthenticatedUser) => isAuthTokenExpired(user),
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
        const { authenticatedUser } = this.props;
        if (this.props.isTokenExpired(authenticatedUser)) {
            push('/signin');
        }
        return (
            <div className="dashboard container">
                <div className="dashboard-work-area stories container grey-text text-darken-1 col s12 m6">
                    {/** Extract cards to component */}
                    <div className="card-panel story white row">
                        <img src={bookImg} alt="A book" />
                        <div className="story-details">
                            <div className="story-title">Some Title</div>
                            <div className="story-contents">The makings of a story.</div>
                        </div>
                        <div className="story-delete secondary-content">
                            <i className="material-icons">delete_outline</i>
                        </div>
                    </div>
                </div>
                <div className="dashboard-notifications-area col s12 m5 offset-m1">
                    <span>Example notification</span>
                </div>
            </div>
        );
    }
}

export default localConnector(TimelinesPage);
