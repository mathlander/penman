import React, { Component, ChangeEvent } from 'react';
import M from 'materialize-css';
import { IAuthenticatedUser, IBook, IChapter, ITimeline } from '../../store/types';

export interface IBookCardProps {
    key: string;
    book: IBook;
    user: IAuthenticatedUser;
    isOffline: boolean;
    chapters: IChapter[],
    update: (user: IAuthenticatedUser, book: IBook, suppressTimeoutAlert: boolean) => any;
    deleteEntity: (user: IAuthenticatedUser, book: IBook, suppressTimeoutAlert: boolean) => any;
    readTimelineById: (timelineId: number | null) => ITimeline | null;
};

interface IBookCardState {
    toolTipInstances: M.Tooltip[];
    title: string;
    chapters: IChapter[];
    timelineId: number | null;
    timeline: ITimeline | null;
    isEditing: boolean;
};

class BookCard extends Component<IBookCardProps> {
    state: IBookCardState = {
        toolTipInstances: [],
        title: '',
        chapters: [],
        timelineId: null,
        timeline: null,
        isEditing: false,
    }

    componentDidMount() {
        const tooltipped = document.querySelectorAll(`.tooltip-book-cc-${this.props.book.bookId}`);
        const toolTipInstances = M.Tooltip.init(
            tooltipped,
            {
                enterDelay: 500,
                exitDelay: 10,
                position: 'right',
            }
        );
        this.setState({
            toolTipInstances,
            title: this.props.book.title,
            timelineId: this.props.book.timelineId,
        });
    }

    componentWillUnmount() {
        this.state.toolTipInstances.forEach((tooltip: M.Tooltip) => tooltip.destroy());
    }

    handleDelete = (e: any) => {
        e.preventDefault();
        this.props.deleteEntity(this.props.user, this.props.book, this.props.isOffline);
    }

    handleCancel = () => {
        this.setState({
            isEditing: false,
            title: this.props.book.title,
            timelineId: this.props.book.timelineId,
        });
    }

    handleUpdate = () => {
        const modifiedBook: IBook = {
            ...this.props.book,
            title: this.state.title,
            modifiedDate: new Date(),
        };
        this.props.update(this.props.user, modifiedBook, this.props.isOffline);
        this.setState({
            isEditing: false,
        });
    }

    handleInlineEdit = () => {
        if (!this.state.isEditing) {
            this.setState({
                isEditing: true,
                title: this.props.book.title,
            });
        }
    }

    handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        this.setState({
            title: e.target.value
        });
    }

    // change to handleAddChapterClick
    // handleBodyChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    //     this.setState({
    //         body: e.target.value
    //     });
    // }

    render() {
        const { bookId, title, createdDate, modifiedDate } = this.props.book;
        const ccTooltip = `
            <p className="created-date">Created: ${createdDate && createdDate.toLocaleDateString()}</p>
            <p className="modified-date">Modified: ${modifiedDate && modifiedDate.toLocaleDateString()}</p>
        `;
        return (
            <div className="book card-panel white row">
                <div className="card">
                    <div className={`card-content tooltip-book-cc-${bookId}`} data-tooltip={ccTooltip}>
                        {this.state.isEditing
                                ? (
                                    <form>
                                        <div className="input-field">
                                            <input id={`book-form-title-${bookId}`} type="text" className="validate" onChange={this.handleTitleChange} value={this.state.title} required autoFocus />
                                            <label htmlFor={`book-form-title-${bookId}`}>Title</label>
                                        </div>
                                        <div className="input-field center">
                                            <button className="btn-small" aria-label="Cancel" onClick={this.handleCancel}>Cancel</button>
                                            <button className="btn-small" aria-label="Update" onClick={this.handleUpdate}>Update</button>
                                        </div>
                                    </form>
                                )
                                : (
                                    <>
                                        <span className="card-title">{title}</span>
                                    </>
                                )}
                        <div className="inline-editable" onClick={this.handleInlineEdit}>
                            <ul className="chapters">
                                {this.props.chapters.map(chapter => {
                                    return (
                                        <li key={`book-${this.props.book.bookId}-chapter-${chapter.chapterId}-title`}>{chapter.title}</li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                    <div className="card-action">
                        <div className="row">
                            <a href="/#" aria-label="Delete" onClick={this.handleDelete}>
                                <i className={`material-icons small tooltip-book-cc-${bookId}`} data-tooltip="Delete">delete_outline</i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default BookCard;