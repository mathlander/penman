import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { IAuthenticatedUser, IPrompt } from '../../store/types';
import PromptsPage from './PromptsPage';

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
            <div className="prompt-details">
                <div className="prompt-title">{props.prompt.title}</div>
                <div className="prompt-contents">{props.prompt.body}</div>
            </div>
            <div className="secondary-content row">
                <div className="prompt-delete s6">
                    <i className="material-icons" onClick={() => props.deleteEntity(props.user, props.prompt)}>delete_outline</i>
                </div>
            </div>
        </div>
    );
};

export default PromptCard;
