import React, { Component, RefObject } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import M from 'materialize-css';
import { IRootState, Book } from '../../store/types';
import { readAll } from '../../store/actions/bookActions';
import { defaultDate, bookConstants } from '../../constants';
import BookCard from './BookCard';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        scrollSpyId: state.dashboard.scrollSpyId,
        books: state.book.books,
        booksCount: Object.values(state.book.books).length,
        lastReadAll: state.book.lastReadAll || defaultDate,
        isOffline: state.offline.isOffline,
        isLoading: !state.offline.isOffline
            && state.book.pendingActions.length > 0
            && state.book.pendingActions[0].type === bookConstants.READ_ALL_BOOKS,
    };
};

const localConnector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux & {
    targetUserId: number;
    tabId: string;
    books: Record<number, Book>;
};

class BooksTab extends Component<Props> {
    render() {
        const books = Object.values(this.props.books);
        const loaderDisplayStyle = (this.props.isLoading && books.length === 0) ? 'block' : 'none';
        const compareFunction = (left: Book, right: Book): number => left.modifiedDate.getTime() - right.modifiedDate.getTime();
        return (
            <div id={`${this.props.tabId}`} className="col s12">
                <div className="blue-text" style={{ display: loaderDisplayStyle }}>
                    <div className="preloader-wrapper big active">
                        <div className="spinner-layer"><div className="circle" /></div>
                        <div className="gap-patch"><div className="circle" /></div>
                        <div className="circle-clipper right"><div className="circle" /></div>
                    </div>
                </div>
                {books.sort(compareFunction).map(book =>
                    <BookCard
                        k={`bookId:${book.bookId}`}
                        key={`bookId:${book.bookId}`}
                        book={book}
                        authenticatedUser={this.props.authenticatedUser}
                        isOffline={this.props.isOffline}
                    />
                )}
            </div>
        );
    }
}

export default localConnector(BooksTab);
