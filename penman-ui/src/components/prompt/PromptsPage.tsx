import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import { IRootState, IAuthenticatedUser, INewPrompt, IPrompt } from '../../store/types';
import { isAuthTokenExpired } from '../../store/actions/authActions';
import { create, read, readAll, update, deleteEntity } from '../../store/actions/promptActions';
import NewPromptCard from './NewPromptCard';
import PromptCard from './PromptCard';
import { defaultDate } from '../../config/constants';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        prompts: state.prompt.prompts,
        promptsCount: Object.values(state.prompt.prompts).length,
        lastReadAll: state.prompt.lastReadAll || defaultDate,
        isOffline: state.offline.isOffline,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        isTokenExpired: (user: IAuthenticatedUser) => isAuthTokenExpired(user),
        create: (user: IAuthenticatedUser, newPrompt: INewPrompt, suppressTimeoutAlert: boolean) => dispatch(create(user, newPrompt, suppressTimeoutAlert)),
        read: (user: IAuthenticatedUser, promptId: number, suppressTimeoutAlert: boolean) => dispatch(read(user, promptId, suppressTimeoutAlert)),
        readAll: (user: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert: boolean) => dispatch(readAll(user, lastReadAll, suppressTimeoutAlert)),
        update: (user: IAuthenticatedUser, prompt: IPrompt, suppressTimeoutAlert: boolean) => dispatch(update(user, prompt, suppressTimeoutAlert)),
        deleteEntity: (user: IAuthenticatedUser, prompt: IPrompt, suppressTimeoutAlert: boolean) => dispatch(deleteEntity(user, prompt, suppressTimeoutAlert)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class PromptsPage extends Component<Props> {
    componentDidMount() {
        this.props.readAll(this.props.authenticatedUser, this.props.lastReadAll, this.props.isOffline);
    }

    render() {
        const { authenticatedUser, isOffline } = this.props;
        if (this.props.isTokenExpired(authenticatedUser)) {
            push('/signin');
        }
        return (
            <div className="prompts container">
                <div className="prompts-work-area stories container grey-text text-darken-1 col s12 m6">
                    <NewPromptCard />
                    <div className="prompts">
                        {Object.values(this.props.prompts).reverse().map(prompt =>
                            <PromptCard
                                key={`promptId:${prompt.promptId}`}
                                prompt={prompt}
                                user={authenticatedUser}
                                isOffline={isOffline}
                                update={this.props.update}
                                deleteEntity={this.props.deleteEntity}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default localConnector(PromptsPage);
