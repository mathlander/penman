import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import { signIn, isAuthTokenExpired } from '../../store/actions/authActions';
import { IRootState } from '../../store/types';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        authErrorState: state.auth.authErrorState,
        isOffline: state.offline.isOffline,
        signIn,
        isAuthTokenExpired,
    };
};

const localConnector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

interface ISignInState {
    username: string;
    password: string;

    isUsernameValid: boolean | null;
    isPasswordValid: boolean | null;

    isSubmitEnabled: boolean;
};

class SignIn extends Component<Props> {
    state: ISignInState = {
        username: '',
        password: '',

        isUsernameValid: null,
        isPasswordValid: null,

        isSubmitEnabled: false,
    };

    handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        let nextState = { ...this.state, };
        switch (e.currentTarget.id) {
            case 'username':
                nextState.username = e.currentTarget.value;
                nextState.isUsernameValid = nextState.username.length > 0 && nextState.username.length <= 50;
                break;
            case 'password':
                nextState.password = e.currentTarget.value;
                nextState.isPasswordValid = nextState.password.length >= 6 && nextState.password.length <= 64;
            default:
                break;
        }
        this.setState({
            ...nextState,
            isSubmitEnabled: nextState.isUsernameValid && nextState.isPasswordValid,
        });
    }

    handleSubmit = (e: MouseEvent<HTMLFormElement>) => {
        e.preventDefault();
        this.props.signIn({
            username: this.state.username,
            password: this.state.password,
        });
    }

    render() {
        const { authenticatedUser, authErrorState, isOffline } = this.props;
        if (authErrorState.internalErrorMessage) {
            console.error(authErrorState.internalErrorMessage);
        }
        if (!this.props.isAuthTokenExpired(authenticatedUser, isOffline)) {
            return push('/dashboard');
        }
        return (
            <div className="container">
                <form onSubmit={this.handleSubmit}>
                    <h5 className="grey-text text-darken-3">Sign In</h5>
                    <div className="input-field">
                        <label htmlFor="username">Username</label>
                        <input id="username" type="text" className="validate" onChange={this.handleChange} />
                    </div>
                    <div className="input-field">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="text" className="validate" onChange={this.handleChange} />
                    </div>
                    <div className="input-field">
                        <button className="btn pink lighten-1 z-depth-0" disabled={!this.state.isSubmitEnabled}>Login</button>
                        <div className="red-text center">
                            { !!authErrorState.displayErrorMessage
                                ? <p>{authErrorState.displayErrorMessage}</p>
                                : null }
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}

export default localConnector(SignIn);
