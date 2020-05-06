import React from 'react';
import { IAuthenticatedUser, IPrompt } from '../../store/types';

export interface IPromptCardProps {
    key: string;
    prompt: IPrompt;
    user: IAuthenticatedUser;
    update: (user: IAuthenticatedUser, prompt: IPrompt) => any;
    deleteEntity: (user: IAuthenticatedUser, prompt: IPrompt) => any;
};

const PromptCard = (props: IPromptCardProps) => {
    return (
        <div className="prompt card-panel white container">
            <div className="prompt-details row">
                <div className="prompt-title s12 m6">{props.prompt.title}</div>
                <div className="prompt-contents s12 m6">{props.prompt.body}</div>
            </div>
            <div className="secondary-content row">
                <div className="created-date s3">Created: {Date.now()}</div>
                <div className="modified-date s3">Modified: {Date.now()}</div>
                <div className="prompt-delete s6">
                    <i className="material-icons" onClick={() => props.deleteEntity(props.user, props.prompt)}>delete_outline</i>
                </div>
            </div>
        </div>
    );
};

export default PromptCard;
