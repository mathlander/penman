import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { signIn } from '../../store/actions/authActions';
import { IRootState, IAuthCredentials } from '../../store/types';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        authErrorState: state.auth.authErrorState,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        signIn: (credentials: IAuthCredentials) => dispatch(signIn(credentials)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class SignIn extends Component<Props> {
    state = {
        username: '',
        password: '',
    }

    handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            [e.currentTarget.id]: e.currentTarget.value,
        })
    }

    handleSubmit = (e: MouseEvent<HTMLFormElement>) => {
        e.preventDefault();
        this.props.signIn(this.state);
    }

    render() {
        const { authenticatedUser, authErrorState } = this.props;
        if (authErrorState.internalErrorMessage) {
            console.error(authErrorState.internalErrorMessage);
        }
        if (!!authenticatedUser && !!authenticatedUser.token) {
            return <Redirect to='/' />
        }
        return (
            <div className="container">
                <form onSubmit={this.handleSubmit} className="">
                    <h5 className="grey-text text-darken-3">Sign In</h5>
                    <div className="input-field">
                        <label htmlFor="username">Username</label>
                        <input type="text" id="username" onChange={this.handleChange} />
                    </div>
                    <div className="input-field">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" onChange={this.handleChange} />
                    </div>
                    <div className="input-field">
                        <button className="btn pink lighten-1 z-depth-0">Login</button>
                        <div className="red-text center">
                            { authErrorState.displayErrorMessage ? <p>{authErrorState.displayErrorMessage}</p> : null }
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}

export default localConnector(SignIn);
