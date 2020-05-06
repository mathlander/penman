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
        lastReadAll: state.prompt.lastReadAll || defaultDate,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        isTokenExpired: (user: IAuthenticatedUser) => isAuthTokenExpired(user),
        create: (user: IAuthenticatedUser, newPrompt: INewPrompt) => dispatch(create(user, newPrompt)),
        read: (user: IAuthenticatedUser, promptId: number) => dispatch(read(user, promptId)),
        readAll: (user: IAuthenticatedUser, lastReadAll: Date) => dispatch(readAll(user, lastReadAll)),
        update: (user: IAuthenticatedUser, prompt: IPrompt) => dispatch(update(user, prompt)),
        deleteEntity: (user: IAuthenticatedUser, prompt: IPrompt) => dispatch(deleteEntity(user, prompt)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class PromptsPage extends Component<Props> {
    componentDidMount() {
        this.props.readAll(this.props.authenticatedUser, this.props.lastReadAll);
    }

    render() {
        const { authenticatedUser } = this.props;
        if (this.props.isTokenExpired(authenticatedUser)) {
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
                </div>
            </div>
        );
    }
}

export default localConnector(PromptsPage);
