import React, { ChangeEvent, MouseEvent, useState, useEffect, FormEvent } from 'react';
import { connect, ConnectedProps, useSelector } from 'react-redux';
import M from 'materialize-css';
import { update, deleteEntity as deleteBook } from '../../store/actions/bookActions';
import { create as createChapter, read as readChapter, readAll as readAllChapters, deleteEntity as deleteChapter } from '../../store/actions/chapterActions';
import { IRootState, AuthenticatedUser, Book, Tag, Relationship, UUID } from '../../store/types';
import { defaultDate } from '../../constants';
import { generateUuid } from '../../store/utilities';

interface IBookCardProps {
    k: string;
    authenticatedUser: AuthenticatedUser;
    isOffline: boolean;
    book: Book;
};

const emptyPickers: M.Datepicker[] = [];

function BookCard(props: IBookCardProps) {
    const [timestamp, setTimestamp] = useState(Date.now());
    const [title, setTitle] = useState(props.book.title);
    const [eventStart, setEventStart] = useState(props.book.eventStart || defaultDate);
    const [eventEnd, setEventEnd] = useState(props.book.eventEnd || defaultDate);
    const [eventStartPickers, setEventStartPickers] = useState(emptyPickers);
    const [eventEndPickers, setEventEndPickers] = useState(emptyPickers);
    const [eventStartElement, setEventStartElement] = useState(document.createElement('input'));
    const [eventEndElement, setEventEndElement] = useState(document.createElement('input'));
    const [isEditing, setIsEditing] = useState(false);
    const tooltip = `
        <p class="created-date">Created: ${props.book.createdDate.toLocaleDateString()}</p>
        <p class="modified-date">Modified: ${props.book.modifiedDate.toLocaleDateString()}</p>
    `;
    const handleNewChapter = () => { console.log(`BookCard.handleNewChapter`); };
    const handleReadChapter = () => { console.log(`BookCard.handleReadChapter`); };
    const handleEditChapter = () => { console.log(`BookCard.handleEditChapter`); };
    const handleDeleteChapter = () => { console.log(`BookCard.handleDeleteChapter`); };
    const handleCancel = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setTitle(props.book.title);
        setEventStart(props.book.eventStart || defaultDate);
        setEventEnd(props.book.eventEnd || defaultDate);
        setIsEditing(false);
    };
    const handleUpdate = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const book = props.book;
        book.title = title;
        if (eventStart === new Date(eventStartElement.value)) book.eventStart = eventStart;
        if (eventEnd === new Date(eventEndElement.value)) book.eventEnd = eventEnd;
        update(props.authenticatedUser, props.book, props.isOffline);
        setIsEditing(false);
    };
    useEffect(() => {
        if (eventStartPickers.length === 0) {
            const eventStartInputElement = document.getElementById(`book-event-start-${timestamp}`) as HTMLInputElement;
            const eventEndInputElement = document.getElementById(`book-event-end-${timestamp}`) as HTMLInputElement;
            const eventStartNodeList = document.querySelectorAll(`.datepicker-book-event-start-${timestamp}`);
            const eventEndNodeList = document.querySelectorAll(`.datepicker-book-event-end-${timestamp}`);
            const now = new Date();
            setEventStartPickers(M.Datepicker.init(eventStartNodeList, {
                defaultDate: props.book.eventStart || now,
                onSelect: (selectedDate: Date) => props.book.eventStart = selectedDate,
            }));
            setEventEndPickers(M.Datepicker.init(eventEndNodeList, {
                defaultDate: props.book.eventEnd || now,
                onSelect: (selectedDate: Date) => props.book.eventEnd = selectedDate,
            }));
            if (eventStartInputElement) {
                setEventStartElement(eventStartInputElement);
                if (props.book.eventStart) eventStartInputElement.value = props.book.eventStart.toLocaleDateString();
            }
            if (eventEndInputElement) {
                setEventEndElement(eventEndInputElement);
                if (props.book.eventEnd) eventEndInputElement.value = props.book.eventEnd.toLocaleDateString();
            }
        }
        return () => {
            eventStartPickers.forEach(instance => instance.destroy());
            eventEndPickers.forEach(instance => instance.destroy());
        };
    });
    return (
        <div className="book card-panel white row">
            <div id={`book-card-${props.book.bookId}`} className="card scrollspy">
                <div className={`card-content tooltip-book-${props.book.bookId} inline-editable`}>
                    <div style={{ display: (isEditing ? 'block' : 'none') }}>
                        <form>
                            <div className="input-field">
                                <input
                                    id={`book-edit-title-${props.book.bookId}`}
                                    type="text"
                                    className="validate"
                                    value={props.book.title}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.currentTarget.value)}
                                    />
                                <label htmlFor={`book-edit-title-${props.book.bookId}`} className={props.book.title && 'active'}>Title</label>
                            </div>
                            <div className="input-field">
                                <input
                                    id={`datepicker-book-event-start-${props.book.bookId}`}
                                    type="text"
                                    className={`datepicker datepicker-book-event-start ${props.book.eventStart ? 'active' : ''}`}
                                    />
                                <label htmlFor={`datepicker-book-event-start-${props.book.bookId}`}>Timeline Start Date</label>
                            </div>
                            <div className="input-field">
                                <input
                                    id={`datepicker-book-event-end-${props.book.bookId}`}
                                    type="text"
                                    className={`datepicker datepicker-book-event-end ${props.book.eventEnd ? 'active' : ''}`}
                                    />
                                <label htmlFor={`datepicker-book-event-end-${props.book.bookId}`}>Timeline End Date</label>
                            </div>
                            <div className="input-field center">
                                <button className="btn-small" aria-label="Cancel" onClick={handleCancel}>Cancel</button>
                                <button className="btn-small" aria-label="Update" onClick={handleUpdate} disabled={!!title}>Update</button>
                            </div>
                        </form>
                    </div>
                    <div style={{ display: (isEditing ? 'none' : 'block') }}>
                        <span className="card-title">{props.book.title}</span>
                        {/* presumably add some stuff here for eventStart, eventEnd, chapters.map(chapter => <li>Chapter Link</li>) */}
                    </div>
                    <div className="card-action">
                        <div className="row">
                            {/* <a href="/#" area-label="Delete" onClick={handleDeleteBook}>
                                <i className="material-icons"></i>
                            </a> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookCard;
