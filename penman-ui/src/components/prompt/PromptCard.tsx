import React, { ChangeEvent, MouseEvent, useState, useEffect } from 'react';
import M from 'materialize-css';
import { update, deleteEntity } from '../../store/actions/promptActions';
import { AuthenticatedUser } from '../../store/type-defs/auth-types';
import { Prompt } from '../../store/type-defs/prompt-types';
import { defaultDate } from '../../constants';
import { IStorageManager } from '../../store/type-defs/storage-types';

interface IPromptCardProps {
    k: string;
    authenticatedUser: AuthenticatedUser;
    isOffline: boolean;
    prompt: Prompt;
    storageManager: IStorageManager;
};

const emptyPickers: M.Datepicker[] = [];

function PromptCard(props: IPromptCardProps) {
    const [timestamp] = useState(Date.now());
    const [title, setTitle] = useState(props.prompt.title);
    const [body, setBody] = useState(props.prompt.body);
    const [eventStartDate, setEventStartDate] = useState(props.prompt.eventStartDate || defaultDate);
    const [eventEndDate, setEventEndDate] = useState(props.prompt.eventEndDate || defaultDate);
    const [eventStartDatePickers, setEventStartDatePickers] = useState(emptyPickers);
    const [eventEndDatePickers, setEventEndDatePickers] = useState(emptyPickers);
    const [eventStartDateElement, setEventStartDateElement] = useState(document.createElement('input'));
    const [eventEndDateElement, setEventEndDateElement] = useState(document.createElement('input'));
    const [isEditing, setIsEditing] = useState(false);
    const tooltip = `
        <p class="created-date">Created: ${props.prompt.createdDate.toLocaleDateString()}</p>
        <p class="modified-date">Modified: ${props.prompt.modifiedDate.toLocaleDateString()}</p>
    `;
    const handleDeletePrompt = () => {
        console.log(`PromptCard.handleDeletePrompt`);
        deleteEntity(props.storageManager, props.authenticatedUser.toReplayUser(), props.prompt, props.isOffline);
    };
    const handleBodyChange = (e: ChangeEvent<HTMLDivElement>) => {
        console.log(`handleBodyChange was invoked => innerHTML: ${e.currentTarget.innerHTML}`);
        setBody(e.currentTarget.innerHTML);
    };
    const handleCancel = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setTitle(props.prompt.title);
        setEventStartDate(props.prompt.eventStartDate || defaultDate);
        setEventEndDate(props.prompt.eventEndDate || defaultDate);
        setBody(props.prompt.body);
        setIsEditing(false);
    };
    const handleUpdate = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const prompt = props.prompt;
        prompt.title = title;
        prompt.body = body;
        if (eventStartDate === new Date(eventStartDateElement.value)) prompt.eventStartDate = eventStartDate;
        if (eventEndDate === new Date(eventEndDateElement.value)) prompt.eventEndDate = eventEndDate;
        update(props.storageManager, props.authenticatedUser.toReplayUser(), props.prompt, props.isOffline);
        setIsEditing(false);
    };
    useEffect(() => {
        if (eventStartDatePickers.length === 0) {
            const eventStartDateInputElement = document.getElementById(`prompt-event-start-${timestamp}`) as HTMLInputElement;
            const eventEndDateInputElement = document.getElementById(`prompt-event-end-${timestamp}`) as HTMLInputElement;
            const eventStartDateNodeList = document.querySelectorAll(`.datepicker-prompt-event-start-${timestamp}`);
            const eventEndDateNodeList = document.querySelectorAll(`.datepicker-prompt-event-end-${timestamp}`);
            const now = new Date();
            setEventStartDatePickers(M.Datepicker.init(eventStartDateNodeList, {
                defaultDate: props.prompt.eventStartDate || now,
                onSelect: (selectedDate: Date) => props.prompt.eventStartDate = selectedDate,
            }));
            setEventEndDatePickers(M.Datepicker.init(eventEndDateNodeList, {
                defaultDate: props.prompt.eventEndDate || now,
                onSelect: (selectedDate: Date) => props.prompt.eventEndDate = selectedDate,
            }));
            if (eventStartDateInputElement) {
                setEventStartDateElement(eventStartDateInputElement);
                if (props.prompt.eventStartDate) eventStartDateInputElement.value = props.prompt.eventStartDate.toLocaleDateString();
            }
            if (eventEndDateInputElement) {
                setEventEndDateElement(eventEndDateInputElement);
                if (props.prompt.eventEndDate) eventEndDateInputElement.value = props.prompt.eventEndDate.toLocaleDateString();
            }
        }
        return () => {
            eventStartDatePickers.forEach(instance => instance.destroy());
            eventEndDatePickers.forEach(instance => instance.destroy());
        };
    });
    return (
        <div className="prompt card-panel white row">
            <div id={`prompt-card-${props.prompt.promptId}`} className="card scrollspy">
                <div
                    className={`card-content tooltip-prompt-${props.prompt.promptId} inline-editable`}
                    data-tooltip={tooltip}
                    onClick={() => {if (!isEditing) setIsEditing(true);}}
                    >
                    <div style={{ display: (isEditing ? 'block' : 'none') }}>
                        <form>
                            <div className="input-field">
                                <input
                                    id={`prompt-edit-title-${props.prompt.promptId}`}
                                    type="text"
                                    className="validate"
                                    value={props.prompt.title}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.currentTarget.value)}
                                    />
                                <label htmlFor={`prompt-edit-title-${props.prompt.promptId}`} className={props.prompt.title && 'active'}>Title</label>
                            </div>
                            <div className="input-field">
                                <input
                                    id={`datepicker-prompt-event-start-${props.prompt.promptId}`}
                                    type="text"
                                    className={`datepicker datepicker-prompt-event-start ${props.prompt.eventStartDate ? 'active' : ''}`}
                                    />
                                <label htmlFor={`datepicker-prompt-event-start-${props.prompt.promptId}`}>Timeline Start Date</label>
                            </div>
                            <div className="input-field">
                                <input
                                    id={`datepicker-prompt-event-end-${props.prompt.promptId}`}
                                    type="text"
                                    className={`datepicker datepicker-prompt-event-end ${props.prompt.eventEndDate ? 'active' : ''}`}
                                    />
                                <label htmlFor={`datepicker-prompt-event-end-${props.prompt.promptId}`}>Timeline End Date</label>
                            </div>
                            <div className="input-field">
                                <div
                                    id="body"
                                    className="validate"
                                    contentEditable={true}
                                    data-length="100000000"
                                    onChange={handleBodyChange}
                                    dangerouslySetInnerHTML={{ __html: body }}
                                    />
                                <label htmlFor="body">Prompt</label>
                            </div>
                            <div className="input-field center">
                                <button className="btn-small" aria-label="Cancel" onClick={handleCancel}>Cancel</button>
                                <button className="btn-small" aria-label="Update" onClick={handleUpdate} disabled={!!title}>Update</button>
                            </div>
                        </form>
                    </div>
                    <div style={{ display: (isEditing ? 'none' : 'block') }}>
                        <span className="card-title">{props.prompt.title}</span>
                        <span className="event-start-date">{props.prompt.eventStartDate && props.prompt.eventStartDate.toDateString()}</span>
                        <span className="event-end-date">{props.prompt.eventEndDate && props.prompt.eventEndDate.toDateString()}</span>
                        <div className="card-body" dangerouslySetInnerHTML={{ __html: props.prompt.body }} />
                    </div>
                    <div className="card-action">
                        <div className="row">
                            <a href="/#" area-label="Delete" onClick={handleDeletePrompt}>
                                <i className="material-icons">delete_outline</i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PromptCard;
