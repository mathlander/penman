import React, { Component, ChangeEvent } from 'react';
// import { useSelector } from 'react-redux';
import M from 'materialize-css';
import { IAuthenticatedUser, Book, Chapter, ITimeline } from '../../store/types';
import { update, deleteEntity } from '../../store/actions/bookActions';

export interface IBookCardProps {
    key: string;
    book: Book;
    user: IAuthenticatedUser;
    isOffline: boolean;
    chapters: Chapter[],
};

interface IBookCardState {
    toolTipInstances: M.Tooltip[];
    title: string;
    chapters: Chapter[];
    timelineId: number | null;
    timeline: ITimeline | null;
    isEditing: boolean;
    // add a look-up by timelineClientId when extending
    //timelineClientId: UUID;
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
        // put them in reverse order, with the last element in the collection representing the one that should be focused on first
         this.setState({
            toolTipInstances,
            // focusableElements,
            title: this.props.book.title,
            timelineId: this.props.book.timelineId,
        });
    }

    componentWillUnmount() {
        this.state.toolTipInstances.forEach((tooltip: M.Tooltip) => tooltip.destroy());
    }

    handleDelete = (e: any) => {
        e.preventDefault();
        deleteEntity(this.props.user, this.props.book, this.props.isOffline);
    }

    handleCancel = () => {
        this.setState({
            isEditing: false,
            title: this.props.book.title,
            timelineId: this.props.book.timelineId,
        });
    }

    handleUpdate = () => {
        this.props.book.title = this.state.title;
        this.props.book.modifiedDate = new Date();
        update(this.props.user, this.props.book, this.props.isOffline);
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
        const { bookId, title, createdDate, modifiedDate, timelineId } = this.props.book;
        // const timeline = useSelector((state: IRootState) => timelineId === null ? null : state.timeline.timelines[timelineId]);
        const ccTooltip = `
            <p className="created-date">Created: ${createdDate && createdDate.toLocaleDateString()}</p>
            <p className="modified-date">Modified: ${modifiedDate && modifiedDate.toLocaleDateString()}</p>
        `;
        return (
            <div className="book card-panel white row">
                <div id={`book-card-${bookId}`} className="card scrollspy">
                    <div className={`card-content tooltip-book-cc-${bookId} inline-editable`} data-tooltip={ccTooltip} onClick={this.handleInlineEdit}>
                        <div style={{ display: (this.state.isEditing ? 'block' : 'none') }}>
                            <form>
                                <div className="input-field">
                                    <input id={`book-form-title-${bookId}`} type="text" className="validate" onChange={this.handleTitleChange} value={this.state.title} required />
                                    <label className={this.state.title && "active"} htmlFor={`book-form-title-${bookId}`}>Title</label>
                                </div>
                                <div className="input-field center">
                                    <button className="btn-small" aria-label="Cancel" onClick={this.handleCancel}>Cancel</button>
                                    <button className="btn-small" aria-label="Update" onClick={this.handleUpdate}>Update</button>
                                </div>
                            </form>
                        </div>
                        <div style={{ display: (this.state.isEditing ? 'none' : 'block') }}>
                            <span className="card-title">{title}</span>
                        </div>
                        <div className="">
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
