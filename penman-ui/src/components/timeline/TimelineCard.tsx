import React, { Component, ChangeEvent } from 'react';
import M from 'materialize-css';
import { IAuthenticatedUser, Timeline } from '../../store/types';
import { update, deleteEntity } from '../../store/actions/timelineActions';

export interface ITimelineCardProps {
    key: string;
    timeline: Timeline;
    user: IAuthenticatedUser;
    isOffline: boolean;
};

interface ITimelineCardState {
    toolTipInstances: M.Tooltip[];
    eventStartPicker: M.Datepicker | null;
    eventEndPicker: M.Datepicker | null;
    title: string;
    eventStart: Date;
    eventEnd: Date;
    isEditing: boolean;
};

const now = new Date();

class TimelineCard extends Component<ITimelineCardProps> {
    state: ITimelineCardState = {
        toolTipInstances: [],
        eventStartPicker: null,
        eventEndPicker: null,
        title: '',
        eventStart: now,
        eventEnd: now,
        isEditing: false,
    }

    componentDidMount() {
        const tooltipped = document.querySelectorAll(`.tooltip-timeline-cc-${this.props.timeline.timelineId}`);
        const toolTipInstances = M.Tooltip.init(
            tooltipped,
            {
                enterDelay: 500,
                exitDelay: 10,
                position: 'right',
            }
        );
        // <input id={`timeline-form-event-start-${timelineId}`} type="text" className={`datepicker datepicker-timeline-${timelineId}-event-start`} required />
        const eventStartElements = document.querySelectorAll(`.datepicker-timeline-${this.props.timeline.timelineId}-event-start`);
        const eventEndElements = document.querySelectorAll(`.datepicker-timeline-${this.props.timeline.timelineId}-event-end`);
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
        this.setState({
            toolTipInstances,
            eventStartPicker,
            eventEndPicker,
            title: this.props.timeline.title,
            eventStart: this.props.timeline.eventStart,
            eventEnd: this.props.timeline.eventEnd,
        });
    }

    componentWillUnmount() {
        this.state.toolTipInstances.forEach((tooltip: M.Tooltip) => tooltip.destroy());
        this.state.eventStartPicker?.destroy();
        this.state.eventEndPicker?.destroy();
    }

    handleDelete = (e: any) => {
        e.preventDefault();
        deleteEntity(this.props.user, this.props.timeline, this.props.isOffline);
    }

    handleCancel = () => {
        this.setState({
            isEditing: false,
            title: this.props.timeline.title,
            eventStart: this.props.timeline.eventStart,
            eventEnd: this.props.timeline.eventEnd,
        });
    }

    handleUpdate = () => {
        this.props.timeline.title = this.state.title;
        this.props.timeline.eventStart = this.state.eventStart;
        this.props.timeline.eventEnd = this.state.eventEnd;
        this.props.timeline.modifiedDate = new Date();
        update(this.props.user, this.props.timeline, this.props.isOffline);
        this.setState({
            isEditing: false,
        });
    }

    handleInlineEdit = () => {
        if (!this.state.isEditing) {
            this.setState({
                isEditing: true,
                title: this.props.timeline.title,
            });
        }
    }

    handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            title: e.target.value
        });
    }

    render() {
        const { timelineId, title, eventStart, eventEnd, createdDate, modifiedDate } = this.props.timeline;
        const ccTooltip = `
            <p className="created-date">Created: ${createdDate && createdDate.toLocaleDateString()}</p>
            <p className="modified-date">Modified: ${modifiedDate && modifiedDate.toLocaleDateString()}</p>
        `;
        return (
            <div className="timeline card-panel white row">
                <div id={`timeline-card-${timelineId}`} className="card scrollspy">
                    <div className={`card-content tooltip-timeline-cc-${timelineId} inline-editable`} data-tooltip={ccTooltip} onClick={this.handleInlineEdit}>
                        <div style={{ display: (this.state.isEditing ? 'block' : 'none') }}>
                            <form>
                                <div className="input-field">
                                    <input id={`timeline-form-title-${timelineId}`} type="text" className="validate" onChange={this.handleTitleChange} value={this.state.title} required />
                                    <label className={this.state.title && "active"} htmlFor={`timeline-form-title-${timelineId}`}>Title</label>
                                </div>
                                <div className="input-field">
                                    <input id={`timeline-form-event-start-${timelineId}`} type="text" className={`datepicker datepicker-timeline-${timelineId}-event-start`} defaultValue={this.state.eventStart.toDateString()} required />
                                    <label className={this.state.eventStart && "active"} htmlFor={`timeline-form-event-start-${timelineId}`}>Event Start</label>
                                </div>
                                <div className="input-field">
                                    <input id={`timeline-form-event-end-${timelineId}`} type="text" className={`datepicker datepicker-timeline-${timelineId}-event-end`} defaultValue={this.state.eventEnd.toDateString()} required />
                                    <label className={this.state.eventEnd && "active"} htmlFor={`timeline-form-event-end-${timelineId}`}>Event End</label>
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
                        </div>
                    </div>
                    <div className="card-action">
                        <div className="row">
                            <a href="/#" aria-label="Delete" onClick={this.handleDelete}>
                                <i className={`material-icons small tooltip-timeline-cc-${timelineId}`} data-tooltip="Delete">delete_outline</i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default TimelineCard;
