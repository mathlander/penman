import React, { Component } from 'react';
import M from 'materialize-css';
import { IAuthenticatedUser, IPrompt } from '../../store/types';

export interface IPromptCardProps {
    key: string;
    prompt: IPrompt;
    user: IAuthenticatedUser;
    update: (user: IAuthenticatedUser, prompt: IPrompt) => any;
    deleteEntity: (user: IAuthenticatedUser, prompt: IPrompt) => any;
};

interface IPromptCardState {
    toolTipInstance?: M.Tooltip | null,
};

class PromptCard extends Component<IPromptCardProps> {
    state: IPromptCardState = {
        toolTipInstance: null,
    }

    componentDidMount() {
        const { createdDate, modifiedDate } = this.props.prompt;
        const tooltipped = document.querySelectorAll(`.tooltip-prompt-cc-${this.props.prompt.promptId}`);
        const toolTipInstance = M.Tooltip.init(
                tooltipped,
                {
                    enterDelay: 500,
                    exitDelay: 10,
                    html: `
                        <p className="created-date">Created: ${createdDate && createdDate.toLocaleDateString()}</p>
                        <p className="modified-date">Modified: ${modifiedDate && modifiedDate.toLocaleDateString()}</p>
                    `,
                }
            ).shift();
        this.setState({
            toolTipInstance
        });
    }

    componentWillUnmount() {
        this.state.toolTipInstance?.destroy();
    }

    render() {
        const { prompt, user, deleteEntity } = this.props;
        const { promptId, title, body } = prompt;
        return (
            <div className="prompt card-panel white row">
                <div className="card">
                    <div className={`card-content tooltip-prompt-cc-${promptId}`}>
                        <span className="card-title">{title}</span>
                        <p>{body}</p>
                    </div>
                    <div className="card-action">
                        <div className="row">
                            <a href="/dashboard">
                                <i className="material-icons small" onClick={() => deleteEntity(user, prompt)}>delete_outline</i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default PromptCard;
