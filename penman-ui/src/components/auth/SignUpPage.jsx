import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import M from 'materialize-css';
import { signUp, isAuthTokenExpired } from '../../store/actions/authActions';
import { AuthenticatedUser } from '../../store/types/authTypes';

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
        signUp: (storageManager, newUser, password) => dispatch(signUp(storageManager, newUser, password)),
        isAuthTokenExpired: (storageManager, replayUser, isOffline) => dispatch(isAuthTokenExpired(storageManager, replayUser, isOffline)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);
const emailRegex = RegExp(/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$/);

class SignUpPage extends Component {
    state = {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        middleName: '',
        lastName: '',

        isUsernameValid: null,
        isEmailValid: null,
        isPasswordValid: null,
        isConfirmPasswordValid: null,
        isFirstNameValid: null,
        isMiddleNameValid: null,
        isLastNameValid: null,
        isSubmitEnabled: false,

        characterCounterInstances: [],
    };

    componentDidMount() {
        const characterCounterElements = document.querySelectorAll('input.validate');
        const characterCounterInstances = M.CharacterCounter.init(characterCounterElements);
        this.setState({
            characterCounterInstances,
        });
    }

    componentWillUnmount() {
        this.state.characterCounterInstances.forEach(instance => instance.destroy());
    }

    handleChange = (e) => {
        let nextState = { ...this.state, };
        switch (e.currentTarget.id) {
            case 'username':
                nextState.username = e.currentTarget.value;
                nextState.isUsernameValid = nextState.username.length > 0 && nextState.username.length <= 50;
                break;
            case 'email':
                nextState.email = e.currentTarget.value;
                nextState.isEmailValid = emailRegex.test(nextState.email) && nextState.email.length <= 320;
                break;
            case 'password':
                nextState.password = e.currentTarget.value;
                nextState.isPasswordValid = nextState.password.length >= 6 && nextState.password.length <= 64;
                break;
            case 'confirmPassword':
                nextState.confirmPassword = e.currentTarget.value;
                nextState.isPasswordValid = nextState.confirmPassword.length >= 6 &&
                    nextState.confirmPassword.length <= 64 &&
                    nextState.password === nextState.confirmPassword;
                break;
            case 'firstName':
                nextState.firstName = e.currentTarget.value;
                nextState.isFirstNameValid = nextState.firstName.length > 0 && nextState.firstName.length <= 50;
                break;
            case 'middleName':
                nextState.middleName = e.currentTarget.value;
                nextState.isMiddleNameValid = nextState.middleName.length > 0 && nextState.middleName.length <= 50;
                break;
            case 'lastName':
                nextState.lastName = e.currentTarget.value;
                nextState.isLastNameValid = nextState.lastName.length > 0 && nextState.lastName.length <= 50;
                break;
            default:
                break;
        }
        this.setState({
            ...nextState,
            isSubmitEnabled: nextState.isUsernameValid &&
                nextState.isEmailValid &&
                nextState.isPasswordValid &&
                nextState.isConfirmPasswordValid &&
                nextState.isFirstNameValid &&
                nextState.isMiddleNameValid &&
                nextState.isLastNameValid,
        });
    }

    handleSubmit = (e) => {
        e.preventDefault();
        const newUser = new AuthenticatedUser(this.props.storageManager, {
            username: this.state.username,
            email: this.state.email,
            firstName: this.state.firstName,
            middleName: this.state.middleName,
            lastName: this.state.lastName,
        });
        this.props.signUp(this.props.storageManager, newUser, this.state.password);
    }

    render() {
        const { authenticatedUser, authErrorState, isOffline, storageManager } = this.props;
        if (authErrorState.internalErrorMessage) {
            console.error(authErrorState.internalErrorMessage);
        }
        if (!this.props.isAuthTokenExpired(storageManager, authenticatedUser, isOffline)) {
            return push('/dashboard');
        }
        return (
            <div className="container">
                <form onSubmit={this.handleSubmit}>
                    <h6>Registration</h6>

                    <div className="divider" />

                    <div className="input-field">
                        <input id="username" type="text" className="validate" onChange={this.handleChange} data-length="50" required />
                        <label htmlFor="username">Username</label>
                    </div>
                    <div className="input-field">
                        <input id="email" type="email" className="validate" onChange={this.handleChange} data-length="320" required />
                        <label htmlFor="email">Email</label>
                    </div>
                    <div className="input-field">
                        <input id="password" type="password" className="validate" onChange={this.handleChange} data-length="64" required />
                        <label htmlFor="password">Password</label>
                    </div>
                    <div className="input-field">
                        <input id="confirmPassword" type="password" className="validate" onChange={this.handleChange} data-length="64" required />
                        <label htmlFor="confirmPassword">Confirm Password</label>
                    </div>
                    <div className="input-field">
                        <input id="firstName" type="text" className="validate" onChange={this.handleChange} data-length="50" required />
                        <label htmlFor="firstName">First Name</label>
                    </div>
                    <div className="input-field">
                        <input id="middleName" type="text" className="validate" onChange={this.handleChange} data-length="50" required />
                        <label htmlFor="middleName">Middle Name</label>
                    </div>
                    <div className="input-field">
                        <input id="lastName" type="text" className="validate" onChange={this.handleChange} data-length="50" required />
                        <label htmlFor="lastName">Last Name</label>
                    </div>

                    <div className="input-field">
                        <button className="btn-small" disabled={!this.state.isSubmitEnabled && false}>Sign Up</button>
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

export default localConnector(SignUpPage);
