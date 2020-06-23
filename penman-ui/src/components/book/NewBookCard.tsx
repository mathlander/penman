import React, { ChangeEvent, MouseEvent, useState, useEffect, FormEvent } from 'react';
import { useSelector } from 'react-redux';
import M from 'materialize-css';
import { create } from '../../store/actions/bookActions';
import { IRootState, AuthenticatedUser, Book, Tag, Relationship, UUID } from '../../store/types';
import { defaultDate } from '../../constants';
import { generateUuid } from '../../store/utilities';
import TagLine from '../tag/TagLine';

interface INewBookCardProps {
    authenticatedUser: AuthenticatedUser;
    isOffline: boolean;
};

const emptyPickers: M.Datepicker[] = [];

function NewBookCard(props: INewBookCardProps) {
    const [newBook, setNewBook] = useState(new Book());
    const [clientId, setClientId] = useState(generateUuid());
    const [title, setTitle] = useState('');
    const [eventStart, setEventStart] = useState(defaultDate);
    const [eventEnd, setEventEnd] = useState(defaultDate);
    const [eventStartPickers, setEventStartPickers] = useState(emptyPickers);
    const [eventEndPickers, setEventEndPickers] = useState(emptyPickers);
    const [eventStartElement, setEventStartElement] = useState(document.createElement('input'));
    const [eventEndElement, setEventEndElement] = useState(document.createElement('input'));
    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => setTitle(e.currentTarget.value);
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        newBook.userId = props.authenticatedUser.userId;
        newBook.clientId = clientId;
        newBook.title = title;
        if (eventStart !== defaultDate) newBook.eventStart = eventStart;
        if (eventEnd !== defaultDate) newBook.eventEnd = eventEnd;
        create(props.authenticatedUser, newBook, props.isOffline);
        // reset everything
        setNewBook(new Book());
        setClientId(generateUuid());
        setTitle('');
        setEventStart(defaultDate);
        setEventEnd(defaultDate);
        eventStartElement.value = '';
        eventEndElement.value = '';
    };
    useEffect(() => {
        if (eventStartPickers.length === 0) {
            const eventStartInputElement = document.getElementById('event-start') as HTMLInputElement;
            const eventEndInputElement = document.getElementById('event-end') as HTMLInputElement;
            const eventStartNodeList = document.querySelectorAll(`.datepicker-newbook-cc-event-start`);
            const eventEndNodeList = document.querySelectorAll(`.datepicker-newbook-cc-event-end`);
            const now = new Date();
            setEventStartPickers(M.Datepicker.init(eventStartNodeList, {
                defaultDate: now,
                onSelect: setEventStart,
            }));
            setEventEndPickers(M.Datepicker.init(eventEndNodeList, {
                defaultDate: now,
                onSelect: setEventEnd,
            }));
            if (eventStartInputElement) setEventStartElement(eventStartInputElement);
            if (eventEndInputElement) setEventEndElement(eventEndInputElement);
        }
        return () => {
            eventStartPickers.forEach(instance => instance.destroy());
            eventEndPickers.forEach(instance => instance.destroy());
        };
    });
    return (
        <div className="card-panel white row">
            <form onSubmit={handleSubmit}>
                <h6>New Book</h6>
                <div className="divider" />
                <div className="input-field">
                    <input id="title" type="text" className="validate" value={title} onChange={handleTitleChange} required autoFocus />
                    <label htmlFor="title">Title</label>
                </div>
                <div className="input-field">
                    <input id="event-start" type="text" className="datepicker datepicker-newbook-cc-event-start" />
                    <label htmlFor="event-start">Timeline Start Date</label>
                </div>
                <div className="input-field">
                    <input id="event-end" type="text" className="datepicker datepicker-newbook-cc-event-end" />
                    <label htmlFor="event-end">Timeline End Date</label>
                </div>
                <TagLine
                    authenticatedUser={props.authenticatedUser}
                    isOffline={props.isOffline}
                    objectId={newBook.clientId}
                    relationships={useSelector((state: IRootState) => Object.values(state.relationship.objectUuidLookup[newBook.clientId]))}
                    />
                <div className="input-field center">
                    <button className="btn-small" disabled={title.length === 0}>Create</button>
                </div>
            </form>
        </div>
    );
}

export default NewBookCard;
