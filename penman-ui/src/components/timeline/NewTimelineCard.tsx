import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IRootState, Timeline, generateUuid } from '../../store/types';
import { create } from '../../store/actions/timelineActions';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        timelineErrorState: state.timeline.timelineErrorState,
        isOffline: state.offline.isOffline,
    };
};

const localConnector = connect(mapStateToProps);
const now = new Date();

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

interface INewTimelineCardState {
    eventStartPicker: M.Datepicker | null;
    eventEndPicker: M.Datepicker | null;
    eventStartInputElement: HTMLInputElement | null;
    eventEndInputElement: HTMLInputElement | null;
    title: string;
    eventStart: Date;
    eventEnd: Date;
};

class NewTimelineCard extends Component<Props> {
    state: INewTimelineCardState = {
        eventStartPicker: null,
        eventEndPicker: null,
        eventStartInputElement: null,
        eventEndInputElement: null,
        title: '',
        eventStart: now,
        eventEnd: now,
    }

    componentDidMount() {
        const eventStartElements = document.querySelectorAll(`.datepicker-newtimeline-cc-event-start`);
        const eventEndElements = document.querySelectorAll(`.datepicker-newtimeline-cc-event-end`);
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
        this.setState({
            eventStartInputElement,
            eventEndInputElement,
            eventStartPicker,
            eventEndPicker,
            eventStart: now,
            eventEnd: now,
        });
    }

    componentWillUnmount() {
        this.state.eventStartPicker?.destroy();
        this.state.eventEndPicker?.destroy();
    }

    handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            title: e.target.value,
        });
    }

    handleSubmit = (e: MouseEvent<HTMLFormElement>) => {
        e.preventDefault();
        const timestamp = Date.now();
        if (this.state.title.length) {
            const newTimeline = new Timeline({
                title: this.state.title,
                eventStart: this.state.eventStart,
                eventEnd: this.state.eventEnd,
                authorId: this.props.authenticatedUser.authorId,
                createdDate: new Date(timestamp),
                modifiedDate: new Date(timestamp),
                timelineId: -timestamp,
                clientId: generateUuid(),
            });
            create(this.props.authenticatedUser, newTimeline, this.props.isOffline);
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
            eventStart: newNow,
            eventEnd: newNow,
        });
    }

    render() {
        const { timelineErrorState } = this.props;
        return (
            <div className="timelines-create card-panel story white row">
                <form onSubmit={this.handleSubmit} className="">
                    <h6>New Timeline</h6>
                    <div className="divider"></div>
                    <div className="input-field">
                        <input id="title" type="text" className="validate" onChange={this.handleInputChange} value={this.state.title} required autoFocus />
                        <label htmlFor="title">Title</label>
                    </div>
                    <div className="input-field">
                        <input id="event-start" type="text" className="datepicker datepicker-newtimeline-cc-event-start" required />
                        <label htmlFor="event-start">Event Start</label>
                    </div>
                    <div className="input-field">
                        <input id="event-end" type="text" className="datepicker datepicker-newtimeline-cc-event-end" required />
                        <label htmlFor="event-end">Event End</label>
                    </div>
                    <div className="input-field center">
                        <button className="btn-small">Create</button>
                        <div className="red-text center">
                            { timelineErrorState && timelineErrorState.displayErrorMessage &&
                                <p>{timelineErrorState.displayErrorMessage}</p>
                            }
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}

export default localConnector(NewTimelineCard);
