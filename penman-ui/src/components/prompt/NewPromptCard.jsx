import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import M from 'materialize-css';
import { create } from '../../store/actions/promptActions';
import { Prompt } from '../../store/types/promptTypes';
import { defaultDate } from '../../constants';
import { generateUuid } from '../../utilities';

function NewPromptCard(props) {
    const dispatch = useDispatch();
    const [newPrompt, setNewPrompt] = useState(new Prompt(props.storageManager, null));
    const [clientId, setClientId] = useState(generateUuid());
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [eventStartDate, setEventStartDate] = useState(defaultDate);
    const [eventEndDate, setEventEndDate] = useState(defaultDate);
    const [eventStartPickers, setEventStartDatePickers] = useState([]);
    const [eventEndPickers, setEventEndDatePickers] = useState([]);
    const [eventStartElement, setEventStartDateElement] = useState(document.createElement('input'));
    const [eventEndElement, setEventEndDateElement] = useState(document.createElement('input'));
    const handleTitleChange = (e) => setTitle(e.currentTarget.value);
    const handleBodyChange = (e) => {
        console.log(`handleBodyChange was invoked => innerHTML: ${e.currentTarget.innerHTML}`);
        setBody(e.currentTarget.innerHTML);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        newPrompt.userId = props.authenticatedUser.profile.userId;
        newPrompt.clientId = clientId;
        newPrompt.title = title;
        newPrompt.body = body;
        if (eventStartDate !== defaultDate) newPrompt.eventStartDate = eventStartDate;
        if (eventEndDate !== defaultDate) newPrompt.eventEndDate = eventEndDate;
        dispatch(create(props.storageManager, props.authenticatedUser.toReplayUser(), newPrompt, props.isOffline));
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
            const eventStartInputElement = document.getElementById('event-start');
            const eventEndInputElement = document.getElementById('event-end');
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
    }, [eventStartPickers, eventEndPickers]);
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
