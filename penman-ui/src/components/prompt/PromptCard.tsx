import React, { Component, ChangeEvent } from 'react';
import M from 'materialize-css';
import { IAuthenticatedUser, IPrompt } from '../../store/types';

export interface IPromptCardProps {
    key: string;
    prompt: IPrompt;
    user: IAuthenticatedUser;
    isOffline: boolean;
    update: (user: IAuthenticatedUser, prompt: IPrompt, suppressTimeoutAlert: boolean) => any;
    deleteEntity: (user: IAuthenticatedUser, prompt: IPrompt, suppressTimeoutAlert: boolean) => any;
};

interface IPromptCardState {
    toolTipInstances: M.Tooltip[];
    focusableElements: HTMLInputElement[];
    resizableElements: Element[];
    body: string;
    title: string;
    isEditing: boolean;
};

class PromptCard extends Component<IPromptCardProps> {
    state: IPromptCardState = {
        toolTipInstances: [],
        focusableElements: [],
        resizableElements: [],
        body: '',
        title: '',
        isEditing: false,
    }

    componentDidMount() {
        const tooltipped = document.querySelectorAll(`.tooltip-prompt-cc-${this.props.prompt.promptId}`);
        const toolTipInstances = M.Tooltip.init(
            tooltipped,
            {
                enterDelay: 500,
                exitDelay: 10,
                position: 'right',
            }
        );
        // put them in reverse order, with the last element in the collection representing the one that should be focused on first
        const promptId = this.props.prompt.promptId;
        const focusableElementsAsWildcards: any[] = [
            document.getElementById(`prompt-form-title-${promptId}`),
            document.getElementById(`prompt-form-body-${promptId}`),
        ];
        const focusableElements: HTMLInputElement[] = [];
        focusableElementsAsWildcards.forEach(inputElement => focusableElements.push(inputElement));
        const resizableElements: Element[] = [
            document.getElementById(`prompt-form-body-${promptId}`) || document.createElement('textarea'),
        ];
        this.setState({
            toolTipInstances,
            focusableElements,
            resizableElements,
            body: this.props.prompt.body,
            title: this.props.prompt.title,
        });
    }

    componentWillUnmount() {
        this.state.toolTipInstances.forEach((tooltip: M.Tooltip) => tooltip.destroy());
    }

    componentDidUpdate() {
        if (this.state.isEditing) {
            this.state.focusableElements.forEach(inputElement => inputElement.focus());
            this.state.resizableElements.forEach(textArea => M.textareaAutoResize(textArea));
        }
    }

    handleDelete = (e: any) => {
        e.preventDefault();
        this.props.deleteEntity(this.props.user, this.props.prompt, this.props.isOffline);
    }

    handleCancel = () => {
        this.setState({
            isEditing: false,
            title: this.props.prompt.title,
            body: this.props.prompt.body,
        });
    }

    handleUpdate = () => {
        const modifiedPrompt: IPrompt = {
            ...this.props.prompt,
            title: this.state.title,
            body: this.state.body,
            modifiedDate: new Date(),
        };
        this.props.update(this.props.user, modifiedPrompt, this.props.isOffline);
        this.setState({
            isEditing: false,
        });
    }

    handleInlineEdit = () => {
        if (!this.state.isEditing) {
            this.setState({
                isEditing: true,
                title: this.props.prompt.title,
                body: this.props.prompt.body,
            });
        }
    }

    handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            title: e.target.value
        });
    }

    handleBodyChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({
            body: e.target.value
        });
    }

    render() {
        const { promptId, title, body, createdDate, modifiedDate } = this.props.prompt;
        const ccTooltip = `
            <p className="created-date">Created: ${createdDate && createdDate.toLocaleDateString()}</p>
            <p className="modified-date">Modified: ${modifiedDate && modifiedDate.toLocaleDateString()}</p>
        `;
        return (
            <div className="prompt card-panel white row">
                <div className="card">
                    <div className={`card-content tooltip-prompt-cc-${promptId} inline-editable`} data-tooltip={ccTooltip} onClick={this.handleInlineEdit}>
                        <div style={{ display: (this.state.isEditing ? 'block' : 'none') }}>
                            <form>
                                <div className="input-field">
                                    <input id={`prompt-form-title-${promptId}`} type="text" className="validate" onChange={this.handleTitleChange} value={this.state.title} required />
                                    <label htmlFor={`prompt-form-title-${promptId}`}>Title</label>
                                </div>
                                <div className="input-field">
                                    <textarea id={`prompt-form-body-${promptId}`} className="validate materialize-textarea" data-length="100000000" onChange={this.handleBodyChange} value={this.state.body} required />
                                    <label htmlFor={`prompt-form-body-${promptId}`}>Prompt</label>
                                </div>
                                <div className="input-field center">
                                    <button className="btn-small" aria-label="Cancel" onClick={this.handleCancel}>Cancel</button>
                                    <button className="btn-small" aria-label="Update" onClick={this.handleUpdate}>Update</button>
                                </div>
                            </form>
                        </div>
                        <div style={{ display: (this.state.isEditing ? 'none' : 'block') }}>
                            <span className="card-title">{title}</span>
                            {
                                body.split(/\r?\n/)
                                    .map((paragraphContent, idx) => {
                                        return !paragraphContent
                                            ? (<br key={`prompt-${promptId}-linebreak-${idx}`} />)
                                            : (<p key={`prompt-${promptId}-paragraph-${idx}`}>{paragraphContent}</p>);
                                    })
                            }
                        </div>
                    </div>
                    <div className="card-action">
                        <div className="row">
                            <a href="/#" aria-label="Delete" onClick={this.handleDelete}>
                                <i className={`material-icons small tooltip-prompt-cc-${promptId}`} data-tooltip="Delete">delete_outline</i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default PromptCard;
