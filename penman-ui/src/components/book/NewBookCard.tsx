import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IRootState, IAuthenticatedUser, IBook } from '../../store/types';
import { create } from '../../store/actions/bookActions';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        bookErrorState: state.book.bookErrorState,
        isOffline: state.offline.isOffline,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        create: (user: IAuthenticatedUser, newBook: IBook, suppressTimeoutAlert: boolean) => dispatch(create(user, newBook, suppressTimeoutAlert)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class NewBookCard extends Component<Props> {
    state = {
        title: '',
        timelineId: null,
    }

    handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            [e.target.id]: e.target.value
        });
    }

    handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({
            [e.target.id]: e.target.value
        });
    }

    handleSubmit = (e: MouseEvent<HTMLFormElement>) => {
        e.preventDefault();
        const timestamp = Date.now();
        if (this.state.title.length) {
            this.props.create(this.props.authenticatedUser, {
                title: this.state.title,
                timelineId: this.state.timelineId,
                authorId: this.props.authenticatedUser.authorId,
                createdDate: new Date(timestamp),
                modifiedDate: new Date(timestamp),
                bookId: -timestamp,
            }, this.props.isOffline);
        }
        this.setState({
            title: '',
            timelineId: null,
        });
    }

    render() {
        const { bookErrorState } = this.props;
        return (
            <div className="books-create card-panel story white row">
                <form onSubmit={this.handleSubmit} className="">
                    <h6>New Book</h6>
                    <div className="divider"></div>
                    <div className="input-field">
                        <input id="title" type="text" className="validate" onChange={this.handleInputChange} value={this.state.title} required autoFocus />
                        <label htmlFor="title">Title</label>
                    </div>
                    <div className="input-field center">
                        <button className="btn-small">Create</button>
                        <div className="red-text center">
                            { bookErrorState && bookErrorState.displayErrorMessage &&
                                <p>{bookErrorState.displayErrorMessage}</p>
                            }
                        </div>
                    </div>
                </form>
            </div>
        );
    }
}

export default localConnector(NewBookCard);
