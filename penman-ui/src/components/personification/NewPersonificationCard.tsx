import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IRootState, Personification, generateUuid } from '../../store/types';
import { create } from '../../store/actions/personificationActions';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        personificationErrorState: state.personification.personificationErrorState,
        isOffline: state.offline.isOffline,
    };
};

const localConnector = connect(mapStateToProps);
const now = new Date();

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

interface INewPersonificationCardState {
    birthdayPicker: M.Datepicker | null;
    birthdayInputElement: HTMLInputElement | null;
    firstName: string;
    middleName: string;
    lastName: string;
    birthday: Date;
};

class NewPersonificationCard extends Component<Props> {
    state: INewPersonificationCardState = {
        birthdayPicker: null,
        birthdayInputElement: null,
        firstName: '',
        middleName: '',
        lastName: '',
        birthday: now,
    }

    componentDidMount() {
        const birthdayElements = document.querySelectorAll(`.datepicker-newpersonification-cc-birthday`);
        const setStateProxyFn = (key: string, date: Date) => this.setState({ [key]: date });
        const birthdayCallback = (selectedDate: Date) => setStateProxyFn('birthday', selectedDate);
        const birthdayPicker = M.Datepicker.init(birthdayElements, {
            defaultDate: now,
            onSelect: birthdayCallback,
        }).shift() || null;
        const birthdayInputElement = document.getElementById('birthday');
        const newNow = new Date();
        this.setState({
            birthdayInputElement,
            birthdayPicker,
            birthday: newNow,
        });
    }

    componentWillUnmount() {
        this.state.birthdayPicker?.destroy();
    }

    handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        switch (e.target.id) {
            case 'first-name':
                this.setState({
                    firstName: e.target.value
                });
                break;
            case 'middle-name':
                this.setState({
                    middleName: e.target.value
                });
                break;
            case 'last-name':
                this.setState({
                    lastName: e.target.value
                });
                break;

            default:
                break;
        }
    }

    handleSubmit = (e: MouseEvent<HTMLFormElement>) => {
        e.preventDefault();
        const timestamp = Date.now();
        if (this.state.firstName.length || this.state.lastName.length) {
            const newPersonification = new Personification({
                firstName: this.state.firstName,
                middleName: this.state.middleName,
                lastName: this.state.lastName,
                birthday: this.state.birthday,
                authorId: this.props.authenticatedUser.authorId,
                createdDate: new Date(timestamp),
                modifiedDate: new Date(timestamp),
                personificationId: -timestamp,
                clientId: generateUuid(),
            });
            create(this.props.authenticatedUser, newPersonification, this.props.isOffline);
        }
        const newNow = new Date();
        const { birthdayInputElement } = this.state;
        // this condition will always be satisfied, but it's necessary to quiet the compilation warning
        if (birthdayInputElement !== null) {
            birthdayInputElement.value = '';
        }
        this.setState({
            firstName: '',
            middleName: '',
            lastName: '',
            birthday: newNow,
        });
    }

    render() {
        const { personificationErrorState } = this.props;
        return (
            <div className="personifications-create card-panel story white row">
                <form onSubmit={this.handleSubmit} className="">
                    <h6>New Personification</h6>
                    <div className="divider"></div>
                    <div className="input-field">
                        <input id="first-name" type="text" className="validate" onChange={this.handleInputChange} value={this.state.firstName} required autoFocus />
                        <label htmlFor="first-name">First Name</label>
                    </div>
                    <div className="input-field">
                        <input id="middle-name" type="text" className="validate" onChange={this.handleInputChange} value={this.state.middleName} autoFocus />
                        <label htmlFor="middle-name">Middle Name</label>
                    </div>
                    <div className="input-field">
                        <input id="last-name" type="text" className="validate" onChange={this.handleInputChange} value={this.state.lastName} autoFocus />
                        <label htmlFor="last-name">Last Name</label>
                    </div>
                    <div className="input-field">
                        <input id="birthday" type="text" className="datepicker datepicker-newpersonification-cc-birthday" required />
                        <label htmlFor="birthday">Birthday</label>
                    </div>
                    <div className="input-field center">
                        <button className="btn-small">Create</button>
                        <div className="red-text center">
                            { personificationErrorState && personificationErrorState.displayErrorMessage &&
                                <p>{personificationErrorState.displayErrorMessage}</p>
                            }
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}

export default localConnector(NewPersonificationCard);
