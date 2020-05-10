import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import { IRootState, IAuthenticatedUser } from '../../store/types';
import { isAuthTokenExpired, refreshToken } from '../../store/actions/authActions';
import bookImg from '../../img/book.jpg';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        isOffline: state.offline.isOffline,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    const refresh = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => dispatch(refreshToken(user, suppressTimeoutAlert));
    return {
        isTokenExpired: (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => isAuthTokenExpired(user, suppressTimeoutAlert, refresh),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class Dashboard extends Component<Props> {
    render() {
        const { authenticatedUser, isOffline, isTokenExpired } = this.props;
        if (isTokenExpired(authenticatedUser, isOffline)) {
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

export default localConnector(Dashboard);
