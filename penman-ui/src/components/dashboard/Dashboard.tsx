import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { push } from 'connected-react-router';
import { IRootState, IAuthenticatedUser } from '../../store/types';
import { isAuthTokenExpired, refreshToken } from '../../store/actions/authActions';

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
                <div className="dashboard-work-area container grey-text text-darken-1 col s12 m6">
                    <div className="dashboard card-panel white row">
                        <div className="card">
                            <div className="card-content">
                                <ul className="collection with-header">
                                    <li className="collection-header"><h4>Get Started</h4></li>
                                    <li className="collection-item"><NavLink to="/books" className="waves-effect left-align">New Novel</NavLink></li>
                                    <li className="collection-item"><NavLink to="/shorts" className="waves-effect left-align">New Short</NavLink></li>
                                    <li className="collection-item"><NavLink to="/prompts" className="waves-effect left-align">New Prompt</NavLink></li>
                                    <li className="collection-item"><NavLink to="/personifications" className="waves-effect left-align">New Character</NavLink></li>
                                    <li className="collection-item"><NavLink to="/timelines" className="waves-effect left-align">New Timeline</NavLink></li>
                                </ul>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-content">
                                <span className="card-title">Recent</span> <br />
                                {/* <span className="new-novel">New Novel</span> <br />
                                <span className="new-short">New Short</span> <br /> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default localConnector(Dashboard);
