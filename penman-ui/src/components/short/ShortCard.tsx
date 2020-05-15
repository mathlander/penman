import React, { Component, ChangeEvent } from 'react';
import M from 'materialize-css';
import { IAuthenticatedUser, IShort } from '../../store/types';

export interface IShortCardProps {
    key: string;
    short: IShort;
    user: IAuthenticatedUser;
    isOffline: boolean;
    update: (user: IAuthenticatedUser, short: IShort, suppressTimeoutAlert: boolean) => any;
    deleteEntity: (user: IAuthenticatedUser, short: IShort, suppressTimeoutAlert: boolean) => any;
};

interface IShortCardState {
    toolTipInstances: M.Tooltip[];
    eventStartPicker: M.Datepicker | null;
    eventEndPicker: M.Datepicker | null;
    focusableElements: HTMLInputElement[];
    resizableElements: Element[];
    body: string;
    title: string;
    eventStart: Date;
    eventEnd: Date;
    isEditing: boolean;
};

const now = new Date();

class ShortCard extends Component<IShortCardProps> {
    state: IShortCardState = {
        toolTipInstances: [],
        focusableElements: [],
        resizableElements: [],
        eventStartPicker: null,
        eventEndPicker: null,
        body: '',
        title: '',
        eventStart: now,
        eventEnd: now,
        isEditing: false,
    }

    componentDidMount() {
        const tooltipped = document.querySelectorAll(`.tooltip-short-cc-${this.props.short.shortId}`);
        const toolTipInstances = M.Tooltip.init(
            tooltipped,
            {
                enterDelay: 500,
                exitDelay: 10,
                position: 'right',
            }
        );
        // <input id={`short-form-event-start-${shortId}`} type="text" className={`datepicker datepicker-short-${shortId}-event-start`} required />
        const eventStartElements = document.querySelectorAll(`.datepicker-short-${this.props.short.shortId}-event-start`);
        const eventEndElements = document.querySelectorAll(`.datepicker-short-${this.props.short.shortId}-event-end`);
        const setStateProxyFn = (key: string, date: Date) => this.setState({ [key]: date });
        const startCallback = (selectedDate: Date) => setStateProxyFn('eventStart', selectedDate);
        const endCallback = (selectedDate: Date) => setStateProxyFn('eventEnd', selectedDate);
        const eventStartPicker = M.Datepicker.init(eventStartElements, {
            defaultDate: now,
            onSelect: startCallback,
        }).shift() || null;
        const eventEndPicker = M.Datepicker.init(eventEndElements, {
            defaultDate: now,
            onSelect: endCallback,
        }).shift() || null;
        // put them in reverse order, with the last element in the collection representing the one that should be focused on first
        const shortId = this.props.short.shortId;
        const focusableElementsAsWildcards: any[] = [
            document.getElementById(`short-form-title-${shortId}`),
            document.getElementById(`short-form-event-start-${shortId}`),
            document.getElementById(`short-form-event-end-${shortId}`),
            document.getElementById(`short-form-body-${shortId}`),
        ];
        const focusableElements: HTMLInputElement[] = [];
        focusableElementsAsWildcards.forEach(inputElement => focusableElements.push(inputElement));
        const resizableElements: Element[] = [
            document.getElementById(`short-form-body-${shortId}`) || document.createElement('textarea'),
        ];
        this.setState({
            toolTipInstances,
            focusableElements,
            resizableElements,
            eventStartPicker,
            eventEndPicker,
            body: this.props.short.body,
            title: this.props.short.title,
            eventStart: this.props.short.eventStart,
            eventEnd: this.props.short.eventEnd,
        });
    }

    componentWillUnmount() {
        this.state.toolTipInstances.forEach((tooltip: M.Tooltip) => tooltip.destroy());
        this.state.eventStartPicker?.destroy();
        this.state.eventEndPicker?.destroy();
    }

    componentDidUpdate() {
        if (this.state.isEditing) {
            this.state.focusableElements.forEach(inputElement => inputElement.focus());
            this.state.resizableElements.forEach(textArea => M.textareaAutoResize(textArea));
        }
    }

    handleDelete = (e: any) => {
        e.preventDefault();
        this.props.deleteEntity(this.props.user, this.props.short, this.props.isOffline);
    }

    handleCancel = () => {
        this.setState({
            isEditing: false,
            title: this.props.short.title,
            body: this.props.short.body,
            eventStart: this.props.short.eventStart,
            eventEnd: this.props.short.eventEnd,
        });
    }

    handleUpdate = () => {
        const modifiedShort: IShort = {
            ...this.props.short,
            title: this.state.title,
            body: this.state.body,
            eventStart: this.state.eventStart,
            eventEnd: this.state.eventEnd,
            modifiedDate: new Date(),
        };
        this.props.update(this.props.user, modifiedShort, this.props.isOffline);
        this.setState({
            isEditing: false,
        });
    }

    handleInlineEdit = () => {
        if (!this.state.isEditing) {
            this.setState({
                isEditing: true,
                title: this.props.short.title,
                body: this.props.short.body,
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
        const { shortId, title, body, eventStart, eventEnd, createdDate, modifiedDate } = this.props.short;
        const ccTooltip = `
            <p className="created-date">Created: ${createdDate && createdDate.toLocaleDateString()}</p>
            <p className="modified-date">Modified: ${modifiedDate && modifiedDate.toLocaleDateString()}</p>
        `;
        return (
            <div className="short card-panel white row">
                <div className="card">
                    <div className={`card-content tooltip-short-cc-${shortId} inline-editable`} data-tooltip={ccTooltip} onClick={this.handleInlineEdit}>
                        <div style={{ display: (this.state.isEditing ? 'block' : 'none') }}>
                            <form>
                                <div className="input-field">
                                    <input id={`short-form-title-${shortId}`} type="text" className="validate" onChange={this.handleTitleChange} value={this.state.title} required />
                                    <label htmlFor={`short-form-title-${shortId}`}>Title</label>
                                </div>
                                <div className="input-field">
                                    <input id={`short-form-event-start-${shortId}`} type="text" className={`datepicker datepicker-short-${shortId}-event-start`} defaultValue={this.state.eventStart.toDateString()} required />
                                    <label htmlFor={`short-form-event-start-${shortId}`}>Event Start</label>
                                </div>
                                <div className="input-field">
                                    <input id={`short-form-event-end-${shortId}`} type="text" className={`datepicker datepicker-short-${shortId}-event-end`} defaultValue={this.state.eventEnd.toDateString()} required />
                                    <label htmlFor={`short-form-event-end-${shortId}`}>Event End</label>
                                </div>
                                <div className="input-field">
                                    <textarea id={`short-form-body-${shortId}`} className="validate materialize-textarea" data-length="100000000" onChange={this.handleBodyChange} value={this.state.body} required />
                                    <label htmlFor={`short-form-body-${shortId}`}>Short</label>
                                </div>
                                <div className="input-field center">
                                    <button className="btn-small" aria-label="Cancel" onClick={this.handleCancel}>Cancel</button>
                                    <button className="btn-small" aria-label="Update" onClick={this.handleUpdate}>Update</button>
                                </div>
                            </form>
                        </div>
                        <div style={{ display: (this.state.isEditing ? 'none' : 'block') }}>
                            <span className="card-title">{title}</span> <br />
                            <span className="event-start">Event Start: {eventStart.toLocaleDateString()}</span> <br />
                            <span className="event-end">Event End: {eventEnd.toLocaleDateString()}</span> <br />
                            { body.split(/\r?\n/)
                                    .map((paragraphContent, idx) => {
                                        return !paragraphContent
                                            ? (<br key={`short-${shortId}-linebreak-${idx}`} />)
                                            : (<p key={`short-${shortId}-paragraph-${idx}`}>{paragraphContent}</p>);
                                    })
                            }
                        </div>
                    </div>
                    <div className="card-action">
                        <div className="row">
                            <a href="/#" aria-label="Delete" onClick={this.handleDelete}>
                                <i className={`material-icons small tooltip-short-cc-${shortId}`} data-tooltip="Delete">delete_outline</i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default ShortCard;
