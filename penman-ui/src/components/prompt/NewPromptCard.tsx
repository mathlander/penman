import React, { ChangeEvent, useState, useEffect, FormEvent } from 'react';
import M from 'materialize-css';
import { create } from '../../store/actions/promptActions';
import { AuthenticatedUser } from '../../store/type-defs/auth-types';
import { Prompt } from '../../store/type-defs/prompt-types';
import { defaultDate } from '../../constants';
import { generateUuid } from '../../utilities';
import { IStorageManager } from '../../store/type-defs/storage-types';

interface INewPromptCardProps {
    authenticatedUser: AuthenticatedUser;
    isOffline: boolean;
    storageManager: IStorageManager;
};

const emptyPickers: M.Datepicker[] = [];

function NewPromptCard(props: INewPromptCardProps) {
    const [newPrompt, setNewPrompt] = useState(new Prompt(props.storageManager, null));
    const [clientId, setClientId] = useState(generateUuid());
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [eventStartDate, setEventStartDate] = useState(defaultDate);
    const [eventEndDate, setEventEndDate] = useState(defaultDate);
    const [eventStartPickers, setEventStartDatePickers] = useState(emptyPickers);
    const [eventEndPickers, setEventEndDatePickers] = useState(emptyPickers);
    const [eventStartElement, setEventStartDateElement] = useState(document.createElement('input'));
    const [eventEndElement, setEventEndDateElement] = useState(document.createElement('input'));
    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => setTitle(e.currentTarget.value);
    const handleBodyChange = (e: ChangeEvent<HTMLDivElement>) => {
        console.log(`handleBodyChange was invoked => innerHTML: ${e.currentTarget.innerHTML}`);
        setBody(e.currentTarget.innerHTML);
    };
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        newPrompt.userId = props.authenticatedUser.profile.userId;
        newPrompt.clientId = clientId;
        newPrompt.title = title;
        newPrompt.body = body;
        if (eventStartDate !== defaultDate) newPrompt.eventStartDate = eventStartDate;
        if (eventEndDate !== defaultDate) newPrompt.eventEndDate = eventEndDate;
        create(props.storageManager, props.authenticatedUser.toReplayUser(), newPrompt, props.isOffline);
        // reset everything
        setNewPrompt(new Prompt(props.storageManager, null));
        setClientId(generateUuid());
        setTitle('');
        setBody('');
        setEventStartDate(defaultDate);
        setEventEndDate(defaultDate);
        eventStartElement.value = '';
        eventEndElement.value = '';
    };
    useEffect(() => {
        if (eventStartPickers.length === 0) {
            const eventStartInputElement = document.getElementById('event-start') as HTMLInputElement;
            const eventEndInputElement = document.getElementById('event-end') as HTMLInputElement;
            const eventStartNodeList = document.querySelectorAll(`.datepicker-newprompt-cc-event-start`);
            const eventEndNodeList = document.querySelectorAll(`.datepicker-newprompt-cc-event-end`);
            const now = new Date();
            setEventStartDatePickers(M.Datepicker.init(eventStartNodeList, {
                defaultDate: now,
                onSelect: setEventStartDate,
            }));
            setEventEndDatePickers(M.Datepicker.init(eventEndNodeList, {
                defaultDate: now,
                onSelect: setEventEndDate,
            }));
            if (eventStartInputElement) setEventStartDateElement(eventStartInputElement);
            if (eventEndInputElement) setEventEndDateElement(eventEndInputElement);
        }
        return () => {
            eventStartPickers.forEach(instance => instance.destroy());
            eventEndPickers.forEach(instance => instance.destroy());
        };
    });
    return (
        <div className="card-panel white row">
            <form onSubmit={handleSubmit}>
                <h6>New Prompt</h6>
                <div className="divider" />
                <div className="input-field">
                    <input id="title" type="text" className="validate" value={title} onChange={handleTitleChange} required autoFocus />
                    <label htmlFor="title">Title</label>
                </div>
                <div className="input-field">
                    <input id="event-start" type="text" className="datepicker datepicker-newprompt-cc-event-start" />
                    <label htmlFor="event-start">Start Date</label>
                </div>
                <div className="input-field">
                    <input id="event-end" type="text" className="datepicker datepicker-newprompt-cc-event-end" />
                    <label htmlFor="event-end">End Date</label>
                </div>
                <div className="input-field">
                    <div id="body" className="validate" contentEditable={true} data-length="100000000" onChange={handleBodyChange} dangerouslySetInnerHTML={{ __html: body }} />
                    <label htmlFor="body">Prompt</label>
                </div>
                {/* <TagLine
                    authenticatedUser={props.authenticatedUser}
                    isOffline={props.isOffline}
                    objectId={newPrompt.clientId}
                    relationships={useSelector((state: IRootState) => Object.values(state.relationship.objectUuidLookup[newPrompt.clientId]))}
                    /> */}
                <div className="input-field center">
                    <button className="btn-small" disabled={title.length === 0}>Create</button>
                </div>
            </form>
        </div>
    );
}

export default NewPromptCard;
