import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import { IRootState, IAuthenticatedUser, INewPrompt, IPrompt } from '../../store/types';
import { isAuthTokenExpired } from '../../store/actions/authActions';
import bookImg from '../../img/book.jpg';
import { create, read, readAll, update, deleteEntity } from '../../store/actions/promptActions';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        prompts: state.prompt.prompts,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        isTokenExpired: (user: IAuthenticatedUser) => isAuthTokenExpired(user),
        create: (user: IAuthenticatedUser, newPrompt: INewPrompt) => dispatch(create(user, newPrompt)),
        read: (user: IAuthenticatedUser, promptId: number) => dispatch(read(user, promptId)),
        readAll: (user: IAuthenticatedUser) => dispatch(readAll(user)),
        update: (user: IAuthenticatedUser, prompt: IPrompt) => dispatch(update(user, prompt)),
        deleteEntity: (user: IAuthenticatedUser, prompt: IPrompt) => dispatch(deleteEntity(user, prompt)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class PromptsPage extends Component<Props> {
    render() {
        const { authenticatedUser } = this.props;
        if (!authenticatedUser || this.props.isTokenExpired(authenticatedUser)) {
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

export default localConnector(PromptsPage);
