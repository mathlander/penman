import React, { Component, ChangeEvent } from 'react';
import M from 'materialize-css';
import { update, deleteEntity } from '../../store/actions/personificationActions';
import { IAuthenticatedUser, Personification } from '../../store/types';

export interface IPersonificationCardProps {
    key: string;
    personification: Personification;
    user: IAuthenticatedUser;
    isOffline: boolean;
};

interface IPersonificationCardState {
    toolTipInstances: M.Tooltip[];
    birthdayPicker: M.Datepicker | null;
    firstName: string;
    middleName: string;
    lastName: string;
    birthday: Date;
    isEditing: boolean;
};

const now = new Date();

class PersonificationCard extends Component<IPersonificationCardProps> {
    state: IPersonificationCardState = {
        toolTipInstances: [],
        birthdayPicker: null,
        firstName: '',
        middleName: '',
        lastName: '',
        birthday: now,
        isEditing: false,
    }

    componentDidMount() {
        const tooltipped = document.querySelectorAll(`.tooltip-personification-cc-${this.props.personification.personificationId}`);
        const toolTipInstances = M.Tooltip.init(
            tooltipped,
            {
                enterDelay: 500,
                exitDelay: 10,
                position: 'right',
            }
        );
        const birthdayElements = document.querySelectorAll(`.datepicker-personification-${this.props.personification.personificationId}-birthday`);
        const setStateProxyFn = (key: string, date: Date) => this.setState({ [key]: date });
        const birthdayCallback = (selectedDate: Date) => setStateProxyFn('birthday', selectedDate);
        const birthdayPicker = M.Datepicker.init(birthdayElements, {
            defaultDate: now,
            onSelect: birthdayCallback,
        }).shift() || null;
        // put them in reverse order, with the last element in the collection representing the one that should be focused on first
        this.setState({
            toolTipInstances,
            birthdayPicker,
            firstName: this.props.personification.firstName,
            middleName: this.props.personification.middleName,
            lastName: this.props.personification.lastName,
            birthday: this.props.personification.birthday,
        });
    }

    componentWillUnmount() {
        this.state.toolTipInstances.forEach((tooltip: M.Tooltip) => tooltip.destroy());
        this.state.birthdayPicker?.destroy();
    }

    handleDelete = (e: any) => {
        e.preventDefault();
        deleteEntity(this.props.user, this.props.personification, this.props.isOffline);
    }

    handleCancel = () => {
        this.setState({
            isEditing: false,
            firstName: this.props.personification.firstName,
            middleName: this.props.personification.middleName,
            lastName: this.props.personification.lastName,
            birthday: this.props.personification.birthday,
        });
    }

    handleUpdate = () => {
        this.props.personification.firstName = this.state.firstName;
        this.props.personification.middleName = this.state.middleName;
        this.props.personification.lastName = this.state.lastName;
        this.props.personification.birthday = this.state.birthday;
        this.props.personification.modifiedDate = new Date();
        update(this.props.user, this.props.personification, this.props.isOffline);
        this.setState({
            isEditing: false,
        });
    }

    handleInlineEdit = () => {
        if (!this.state.isEditing) {
            this.setState({
                isEditing: true,
            });
        }
    }

    handleFirstNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            firstName: e.target.value
        });
    }

    handleMiddleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            middleName: e.target.value
        });
    }

    handleLastNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            firstName: e.target.value
        });
    }

    render() {
        const { personificationId, firstName, lastName, middleName, birthday, createdDate, modifiedDate } = this.props.personification;
        const name = `${firstName} ${middleName} ${lastName}`.replace('  ', ' ').trim();
        const ccTooltip = `
            <p className="created-date">Created: ${createdDate && createdDate.toLocaleDateString()}</p>
            <p className="modified-date">Modified: ${modifiedDate && modifiedDate.toLocaleDateString()}</p>
        `;
        return (
            <div className="personification card-panel white row">
                <div id={`personification-card-${personificationId}`} className="card scrollspy">
                    <div className={`card-content tooltip-personification-cc-${personificationId} inline-editable`} data-tooltip={ccTooltip} onClick={this.handleInlineEdit}>
                        <div style={{ display: (this.state.isEditing ? 'block' : 'none') }}>
                            <form>
                                <div className="input-field">
                                    <input id={`personification-form-first-name-${personificationId}`} name={`personification-form-first-name-${personificationId}`} type="text" className="validate" onChange={this.handleFirstNameChange} value={this.state.firstName} />
                                    <label className={this.state.firstName && "active"} htmlFor={`personification-form-first-name-${personificationId}`}>First Name</label>
                                </div>
                                <div className="input-field">
                                    <input id={`personification-form-middle-name-${personificationId}`} name={`personification-form-middle-name-${personificationId}`} type="text" className="validate" onChange={this.handleMiddleNameChange} value={this.state.middleName} />
                                    <label className={this.state.middleName && "active"} htmlFor={`personification-form-middle-name-${personificationId}`}>Middle Name</label>
                                </div>
                                <div className="input-field">
                                    <input id={`personification-form-last-name-${personificationId}`} name={`personification-form-last-name-${personificationId}`} type="text" className="validate" onChange={this.handleFirstNameChange} value={this.state.lastName} />
                                    <label className={this.state.lastName && "active"} htmlFor={`personification-form-last-name-${personificationId}`}>Last Name</label>
                                </div>
                                <div className="input-field">
                                    <input id={`personification-form-birthday-${personificationId}`} type="text" className={`datepicker datepicker-personification-${this.props.personification.personificationId}-birthday`} defaultValue={this.state.birthday.toDateString()} required />
                                    <label className={this.state.birthday && "active"} htmlFor={`personification-form-birthday-${personificationId}`}>Birthday</label>
                                </div>
                                <div className="input-field center">
                                    <button className="btn-small" aria-label="Cancel" onClick={this.handleCancel}>Cancel</button>
                                    <button className="btn-small" aria-label="Update" onClick={this.handleUpdate}>Update</button>
                                </div>
                            </form>
                        </div>
                        <div style={{ display: (this.state.isEditing ? 'none' : 'block') }}>
                            <span className="card-title">{name}</span> <br />
                            <span className="birthday">Birthday: {birthday.toLocaleDateString()}</span> <br />
                            {/**
                             * insert a <ul>...</ul> for shorts containing references to the character
                             * and another <ul>...</ul> for prompts, and another for chapters
                             * use the .truncate class to keep the text from overwhelming the page
                             */}
                        </div>
                    </div>
                    <div className="card-action">
                        <div className="row">
                            <a href="/#" aria-label="Delete" onClick={this.handleDelete}>
                                <i className={`material-icons small tooltip-personification-cc-${personificationId}`} data-tooltip="Delete">delete_outline</i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default PersonificationCard;
