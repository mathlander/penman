import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { signUp } from '../../store/actions/authActions';
import { IRootState, INewUser } from '../../store/types';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        authErrorState: state.auth.authErrorState,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        signUp: (newUser: INewUser) => dispatch(signUp(newUser)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class SignUp extends Component<Props> {
    state = {
        username: '',
        email: '',
        password: '',
        firstName: '',
        middleName: '',
        lastName: '',
    }

    handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            [e.target.id]: e.target.value
        });
    }

    handleSubmit = (e: MouseEvent<HTMLFormElement>) => {
        e.preventDefault();
        this.props.signUp(this.state);
    }

    render() {
        const { authenticatedUser, authErrorState } = this.props;
        if (!!authenticatedUser && !!authenticatedUser.token) {
            return <Redirect to='/' />
        }
        return (
            <div className="container">
                <form onSubmit={this.handleSubmit} className="">
                    <h6>Registration</h6>
                    <div className="divider"></div>
                    <div className="input-field">
                        <input id="username" type="text" className="validate" onChange={this.handleChange} />
                        <label htmlFor="username">Username</label>
                    </div>
                    <div className="input-field">
                        <input id="email" type="email" className="validate" onChange={this.handleChange} />
                        <label htmlFor="email">Email</label>
                    </div>
                    <div className="input-field">
                        <input id="password" type="password" className="validate" onChange={this.handleChange} />
                        <label htmlFor="password">Password</label>
                    </div>
                    <div className="input-field">
                        <input id="firstName" type="text" className="validate" onChange={this.handleChange} />
                        <label htmlFor="firstName">First Name</label>
                    </div>
                    <div className="input-field">
                        <input id="middleName" type="text" className="validate" onChange={this.handleChange} />
                        <label htmlFor="middleName">Middle Name</label>
                    </div>
                    <div className="input-field">
                        <input id="lastName" type="text" className="validate" onChange={this.handleChange} />
                        <label htmlFor="lastName">Last Name</label>
                    </div>
                    <div className="input-field center">
                        <button className="btn-small">Sign Up</button>
                        <div className="red-text center">
                            { authErrorState && authErrorState.displayErrorMessage &&
                                <p>{authErrorState.displayErrorMessage}</p>
                            }
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}

export default localConnector(SignUp);
