import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { signIn, isAuthTokenExpired } from '../../store/actions/authActions';

const mapStateToProps = (state) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        authErrorState: state.auth.authErrorState,
        isOffline: state.offline.isOffline,
        storageManager: state.storageManager,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        signIn: (storageManager, authDto) => dispatch(signIn(storageManager, authDto)),
        isAuthTokenExpired: (storageManager, replayUser, isOffline) => dispatch(isAuthTokenExpired(storageManager, replayUser, isOffline)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

class SignInPage extends Component {
    state = {
        username: '',
        password: '',

        isUsernameValid: null,
        isPasswordValid: null,

        isSubmitEnabled: false,
    };

    handleChange = (e) => {
        let nextState = { ...this.state, };
        console.log(`SignInPage.jsx => nextState`, nextState);
        console.log(`e => `, e);
        switch (e.currentTarget.id) {
            case 'username':
                nextState.username = e.currentTarget.value;
                console.log(`nextState.username => ${nextState.username.length}`);
                nextState.isUsernameValid = nextState.username.length > 0 && nextState.username.length <= 50;
                break;
            case 'password':
                nextState.password = e.currentTarget.value;
                console.log(`nextState.password => ${nextState.password.length}`);
                nextState.isPasswordValid = nextState.password.length >= 6 && nextState.password.length <= 64;
                break;

            default:
                break;
        }
        this.setState({
            ...nextState,
            isSubmitEnabled: nextState.isUsernameValid && nextState.isPasswordValid,
        });
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.signIn(this.props.storageManager, {
            username: this.state.username,
            password: this.state.password,
        });
    }

    render() {
        const { authenticatedUser, authErrorState, isOffline, storageManager } = this.props;
        if (authErrorState.internalErrorMessage) {
            console.error(authErrorState.internalErrorMessage);
        }
        const isTokenExpired = this.props.isAuthTokenExpired(storageManager, authenticatedUser, isOffline);
        console.log(`The goddammed token is expired => ${isTokenExpired}`);
        if (!isTokenExpired) {
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
                        <input id="password" type="password" className="validate" onChange={this.handleChange} />
                    </div>
                    <div className="input-field">
                        <button className="btn pink lighten-1 z-depth-0" disabled={!this.state.isSubmitEnabled && false}>Login</button>
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

export default localConnector(SignInPage);
