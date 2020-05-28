import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import M from 'materialize-css';
import { IRootState, Prompt, generateUuid } from '../../store/types';
import { create } from '../../store/actions/promptActions';
// import { relate, deleteEntity } from '../../store/actions/relationshipActions';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        promptErrorState: state.prompt.promptErrorState,
        isOffline: state.offline.isOffline,
    };
};

const localConnector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

interface INewPromptCardState {
    resizableElements: Element[];
    body: string;
    title: string;
};

class NewPromptCard extends Component<Props> {
    state: INewPromptCardState = {
        resizableElements: [],
        title: '',
        body: '',
    }

    componentDidMount() {
        const resizableElements: Element[] = [
            document.getElementById(`body`) || document.createElement('textarea'),
        ];
        this.setState({
            resizableElements,
        });
    }

    componentDidUpdate() {
        if (!this.state.body.length) {
            this.state.resizableElements.forEach(textArea => M.textareaAutoResize(textArea));
        }
    }

    handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            [e.target.id]: e.target.value
        });
    }

    handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({
            [e.target.id]: e.target.value,
        });
    }

    handleSubmit = (e: MouseEvent<HTMLFormElement>) => {
        e.preventDefault();
        const timestamp = Date.now();
        if (this.state.body.length && this.state.title.length) {
            const newPrompt = new Prompt({
                title: this.state.title,
                body: this.state.body,
                authorId: this.props.authenticatedUser.authorId,
                createdDate: new Date(timestamp),
                modifiedDate: new Date(timestamp),
                promptId: 0,
                clientId: generateUuid(),
            });
            create(this.props.authenticatedUser, newPrompt, this.props.isOffline);
        }
        this.setState({
            title: '',
            body: '',
        });
    }

    render() {
        const { promptErrorState } = this.props;
        return (
            <div className="prompts-create card-panel story white row">
                <form onSubmit={this.handleSubmit} className="">
                    <h6>New Prompt</h6>
                    <div className="divider"></div>
                    <div className="input-field">
                        <input id="title" type="text" className="validate" onChange={this.handleInputChange} value={this.state.title} required autoFocus />
                        <label htmlFor="title">Title</label>
                    </div>
                    <div className="input-field">
                        <textarea id="body" className="validate materialize-textarea" data-length="100000000" onChange={this.handleTextAreaChange} value={this.state.body} required />
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
