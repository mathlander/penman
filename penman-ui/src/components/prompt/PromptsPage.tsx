import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import { IRootState, IAuthenticatedUser, INewPrompt, IPrompt } from '../../store/types';
import { isAuthTokenExpired } from '../../store/actions/authActions';
import { create, read, readAll, update, deleteEntity } from '../../store/actions/promptActions';
import NewPromptCard from './NewPromptCard';
import PromptCard from './PromptCard';

const expiredUser: IAuthenticatedUser = {
    token: '',
    refreshToken: '',
    tokenExpirationDate: new Date(),
    refreshTokenExpirationDate: new Date(),
    authorId: 0,
    username: '',
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    createdDate: new Date(),
    modifiedDate: new Date(),
};

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser || expiredUser,
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
            <div className="prompts container">
                <div className="prompts-work-area stories container grey-text text-darken-1 col s12 m6">
                    <NewPromptCard />
                    <div className="prompts">
                        {Object.values(this.props.prompts).map(prompt =>
                            <PromptCard
                                key={`promptId:${prompt.promptId}`}
                                prompt={prompt}
                                user={authenticatedUser}
                                update={this.props.update}
                                deleteEntity={this.props.deleteEntity}
                            />
                        )}
                    </div>
                    {/** Extract cards to component */}
                </div>
            </div>
        );
    }
}

export default localConnector(PromptsPage);
