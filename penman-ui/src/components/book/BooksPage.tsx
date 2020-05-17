import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import M from 'materialize-css';
import { IRootState, IAuthenticatedUser, INewBook, IBook } from '../../store/types';
import { isAuthTokenExpired, refreshToken } from '../../store/actions/authActions';
import { create, read, readAll, update, deleteEntity } from '../../store/actions/bookActions';
import { visitRecentItemClear } from '../../store/actions/dashboardActions';
import { defaultDate, bookConstants } from '../../config/constants';
import NewBookCard from './NewBookCard';
import BookCard from './BookCard';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        scrollspyId: state.dashboard.scrollspyId,
        books: state.book.books,
        booksCount: Object.values(state.book.books).length,
        lastReadAll: state.book.lastReadAll || defaultDate,
        isOffline: state.offline.isOffline,
        isLoading: !state.offline.isOffline
            && state.book.pendingActions.length > 0
            && state.book.pendingActions[0].type === bookConstants.READ_ALL_BOOKS,
        timelines: state.timeline.timelines,
        chapters: state.chapter.chapters,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    const refresh = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => dispatch(refreshToken(user, suppressTimeoutAlert));
    return {
        visitRecentItemClear: () => dispatch(visitRecentItemClear()),
        isTokenExpired: (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => isAuthTokenExpired(user, suppressTimeoutAlert, refresh),
        create: (user: IAuthenticatedUser, newBook: INewBook, suppressTimeoutAlert: boolean) => dispatch(create(user, newBook, suppressTimeoutAlert)),
        read: (user: IAuthenticatedUser, bookId: number, suppressTimeoutAlert: boolean) => dispatch(read(user, bookId, suppressTimeoutAlert)),
        readAll: (user: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert: boolean) => dispatch(readAll(user, lastReadAll, suppressTimeoutAlert)),
        update: (user: IAuthenticatedUser, book: IBook, suppressTimeoutAlert: boolean) => dispatch(update(user, book, suppressTimeoutAlert)),
        deleteEntity: (user: IAuthenticatedUser, book: IBook, suppressTimeoutAlert: boolean) => dispatch(deleteEntity(user, book, suppressTimeoutAlert)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

interface IBooksPageState {
    scrollspyInstances: M.ScrollSpy[];
}

class BooksPage extends Component<Props> {
    state: IBooksPageState = {
        scrollspyInstances: [],
    }
    anchorRef: React.RefObject<HTMLAnchorElement>;

    constructor(props: Props) {
        super(props);
        this.anchorRef = React.createRef<HTMLAnchorElement>();
    }

    componentDidMount() {
        this.props.readAll(this.props.authenticatedUser, this.props.lastReadAll, this.props.isOffline);
        const scrollspied = document.querySelectorAll('.scrollspy');
        const scrollspyInstances = M.ScrollSpy.init(scrollspied, {
            scrollOffset: 35,
        });
        this.setState({
            scrollspyInstances,
        });
        if (this.props.scrollspyId) {
            this.anchorRef.current?.click();
            this.props.visitRecentItemClear();
        }
    }

    componentWillUnmount() {
        this.state.scrollspyInstances.forEach(scrollspyInstance => scrollspyInstance.destroy());
    }

    render() {
        const { authenticatedUser, isOffline, isTokenExpired } = this.props;
        const loaderDisplayStyle = (this.props.isLoading && this.props.booksCount === 0 ? 'block' : 'none');
        if (isTokenExpired(authenticatedUser, isOffline)) {
            push('/signin');
        }
        const readTimelineById = (timelineId: number | null) => (timelineId === null ? null : this.props.timelines[timelineId]);
        return (
            <div className="books container">
                {this.props.scrollspyId && (
                    <a href={`#${this.props.scrollspyId}`} ref={this.anchorRef} style={{ display: 'none' }} aria-hidden={true}>Jump to recent item</a>
                )}
                <div className="books-work-area container grey-text text-darken-1 col s12 m6">
                    <NewBookCard />
                    <div className="books">
                        <div className="blue-text" style={{display: loaderDisplayStyle}}>
                            <div className="preloader-wrapper big active">
                                <div className="spinner-layer"><div className="circle" /></div>
                                <div className="gap-patch"><div className="circle" /></div>
                                <div className="circle-clipper right"><div className="circle"></div></div>
                            </div>
                        </div>
                        {Object.values(this.props.books).reverse().map(book =>
                            <BookCard
                                key={`bookId:${book.bookId}`}
                                book={book}
                                user={authenticatedUser}
                                isOffline={isOffline}
                                chapters={Object.values(this.props.chapters).filter(chapter => chapter.bookId === book.bookId)}
                                update={this.props.update}
                                deleteEntity={this.props.deleteEntity}
                                readTimelineById={readTimelineById}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default localConnector(BooksPage);
