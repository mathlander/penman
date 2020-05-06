import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import { IRootState, IAuthenticatedUser, INewPrompt, IPrompt } from '../../store/types';
import { create, read, readAll, update, deleteEntity } from '../../store/actions/promptActions';

const mapStateToProps = (state: IRootState) => {
    if (!state.auth.authenticatedUser)
        throw 'Authenticated user must not be null at this point.';
    return {
        authenticatedUser: state.auth.authenticatedUser,
        promptErrorState: state.prompt.promptErrorState,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        create: (user: IAuthenticatedUser, newPrompt: INewPrompt) => dispatch(create(user, newPrompt)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class NewPromptCard extends Component<Props> {
    state = {
        title: '',
        body: '',
    }

    handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            [e.target.id]: e.target.value
        });
    }

    handleSubmit = (e: MouseEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (this.state.body.length && this.state.title.length) {
            this.props.create(this.props.authenticatedUser, {
                ...this.state,
                authorId: this.props.authenticatedUser.authorId,
            });
        }
    }

    render() {
        const { promptErrorState } = this.props;
        return (
            <div className="prompts-create card-panel story white row">
                <form onSubmit={this.handleSubmit} className="">
                    <h6>New Prompt</h6>
                    <div className="divider"></div>
                    <div className="input-field">
                        <input id="title" type="text" className="validate" onChange={this.handleChange} required autoFocus />
                        <label htmlFor="title">Title</label>
                    </div>
                    <div className="input-field">
                        <input id="body" type="email" className="validate" onChange={this.handleChange} required />
                        <label htmlFor="body">Prompt</label>
                    </div>
                    <div className="input-field center">
                        <button className="btn-small">Create</button>
                        <div className="red-text center">
                            { promptErrorState && promptErrorState.displayErrorMessage &&
                                <p>{promptErrorState.displayErrorMessage}</p>
                            }
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}

export default localConnector(NewPromptCard);
