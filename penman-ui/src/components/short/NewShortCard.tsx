import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IRootState, Short, generateUuid } from '../../store/types';
import { create } from '../../store/actions/shortActions';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        shortErrorState: state.short.shortErrorState,
        isOffline: state.offline.isOffline,
    };
};

const localConnector = connect(mapStateToProps);
const now = new Date();

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

interface INewShortCardState {
    eventStartPicker: M.Datepicker | null;
    eventEndPicker: M.Datepicker | null;
    eventStartInputElement: HTMLInputElement | null;
    eventEndInputElement: HTMLInputElement | null;
    resizableElements: Element[];
    body: string;
    title: string;
    eventStart: Date;
    eventEnd: Date;
};

class NewShortCard extends Component<Props> {
    state: INewShortCardState = {
        eventStartPicker: null,
        eventEndPicker: null,
        eventStartInputElement: null,
        eventEndInputElement: null,
        resizableElements: [],
        title: '',
        body: '',
        eventStart: now,
        eventEnd: now,
    }

    componentDidMount() {
        const eventStartElements = document.querySelectorAll(`.datepicker-newshort-cc-event-start`);
        const eventEndElements = document.querySelectorAll(`.datepicker-newshort-cc-event-end`);
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
        const eventStartInputElement = document.getElementById('event-start');
        const eventEndInputElement = document.getElementById('event-end');
        const resizableElements: Element[] = [
            document.getElementById(`body`) || document.createElement('textarea'),
        ];
        this.setState({
            eventStartInputElement,
            eventEndInputElement,
            eventStartPicker,
            eventEndPicker,
            resizableElements,
            eventStart: now,
            eventEnd: now,
        });
    }

    componentWillUnmount() {
        this.state.eventStartPicker?.destroy();
        this.state.eventEndPicker?.destroy();
    }

    componentDidUpdate() {
        if (!this.state.body.length) {
            this.state.resizableElements.forEach(textArea => M.textareaAutoResize(textArea));
        }
    }

    handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            title: e.target.value,
        });
    }

    handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({
            body: e.target.value,
        });
    }

    handleSubmit = (e: MouseEvent<HTMLFormElement>) => {
        e.preventDefault();
        const timestamp = Date.now();
        if (this.state.body.length && this.state.title.length) {
            const newShort = new Short({
                title: this.state.title,
                body: this.state.body,
                eventStart: this.state.eventStart,
                eventEnd: this.state.eventEnd,
                authorId: this.props.authenticatedUser.authorId,
                createdDate: new Date(timestamp),
                modifiedDate: new Date(timestamp),
                shortId: -timestamp,
                clientId: generateUuid(),
            });
            create(this.props.authenticatedUser, newShort, this.props.isOffline);
        }
        const newNow = new Date();
        const { eventStartInputElement, eventEndInputElement } = this.state;
        // this condition will always be satisfied, but it's necessary to quiet the compilation warning
        if (eventStartInputElement !== null && eventEndInputElement !== null) {
            eventStartInputElement.value = '';
            eventEndInputElement.value = '';
        }
        this.setState({
            title: '',
            body: '',
            eventStart: newNow,
            eventEnd: newNow,
        });
    }

    render() {
        const { shortErrorState } = this.props;
        return (
            <div className="shorts-create card-panel story white row">
                <form onSubmit={this.handleSubmit} className="">
                    <h6>New Short</h6>
                    <div className="divider"></div>
                    <div className="input-field">
                        <input id="title" type="text" className="validate" onChange={this.handleInputChange} value={this.state.title} required autoFocus />
                        <label htmlFor="title">Title</label>
                    </div>
                    <div className="input-field">
                        <input id="event-start" type="text" className="datepicker datepicker-newshort-cc-event-start" required />
                        <label htmlFor="event-start">Event Start</label>
                    </div>
                    <div className="input-field">
                        <input id="event-end" type="text" className="datepicker datepicker-newshort-cc-event-end" required />
                        <label htmlFor="event-end">Event End</label>
                    </div>
                    <div className="input-field">
                        <textarea id="body" className="validate materialize-textarea" data-length="100000000" onChange={this.handleTextAreaChange} value={this.state.body} required />
                        <label htmlFor="body">Short</label>
                    </div>
                    <div className="input-field center">
                        <button className="btn-small">Create</button>
                        <div className="red-text center">
                            { shortErrorState && shortErrorState.displayErrorMessage &&
                                <p>{shortErrorState.displayErrorMessage}</p>
                            }
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}

export default localConnector(NewShortCard);
