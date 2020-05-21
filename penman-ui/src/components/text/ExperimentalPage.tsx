import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import { IRootState, IAuthenticatedUser } from '../../store/types';
import { isAuthTokenExpired, refreshToken } from '../../store/actions/authActions';
import HyperTextArea from './HyperTextArea';

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

class ExperimentalPage extends Component<Props> {
    render() {
        const { authenticatedUser, isOffline, isTokenExpired } = this.props;
        if (isTokenExpired(authenticatedUser, isOffline)) {
            push('/signin');
        }
        return (
            <div className="experimental">
                <div className="experimental-work-area grey-text text-darken-1 col s12 m6">
                    <HyperTextArea
                        // key={`experimental-hta`}
                        innerHtml={`Lorem ipsum`}
                        showControls={true}
                        update={(richText: string) => console.log(`received the following update from HTA: ${richText}`)} />
                </div>
            </div>
        );
    }
}

export default localConnector(ExperimentalPage);
