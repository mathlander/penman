import React, { Component, RefObject } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import M from 'materialize-css';
import { IRootState } from '../../store/types';
import { isAuthTokenExpired } from '../../store/actions/authActions';
import { readAll } from '../../store/actions/bookActions';
import { visitRecentItemClear } from '../../store/actions/dashboardActions';
import { defaultDate, bookConstants } from '../../constants';
import NewBookCard from './NewBookCard';
import BookCard from './BookCard';

const mapStateToProps = (state: IRootState) => {
    const userId = state.auth.authenticatedUser.userId;
    const originatedBooks = Object.values(state.book.books).filter(book => book.userId === userId);
    const collaboratingBooks = Object.values(state.book.books).filter(book => book.userId !== userId);
    return {
        authenticatedUser: state.auth.authenticatedUser,
        scrollSpyId: state.dashboard.scrollSpyId,
        // books: state.book.books,
        // booksCount: Object.values(state.book.books).length,
        originatedBooks,
        collaboratingBooks,
        originatedBooksCount: originatedBooks.length,
        collaboratingBooksCount: collaboratingBooks.length,
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
    // targetUserId: number;
};

interface IBooksPageState {
    scrollSpyInstances: M.ScrollSpy[];
    anchorRef: RefObject<HTMLAnchorElement>;
};

class BooksPage extends Component<Props> {
    state: IBooksPageState = {
        scrollSpyInstances: [],
        anchorRef: React.createRef<HTMLAnchorElement>(),
    };

    componentDidMount() {
        // readAll(this.props.authenticatedUser, this.props.targetUserId, this.props.lastReadAll, this.props.isOffline);
        const scrollSpyElements = document.querySelectorAll('.scrollspy');
        const scrollSpyInstances = M.ScrollSpy.init(scrollSpyElements, {
            scrollOffset: 35,
        });
        this.setState({
            scrollSpyInstances,
        });
        if (this.props.scrollSpyId) {
            this.state.anchorRef.current?.click();
            visitRecentItemClear();
        }
    }

    componentWillUnmount() {
        this.state.scrollSpyInstances.forEach(instance => instance.destroy());
    }

    render() {
        const { authenticatedUser, isOffline } = this.props;
        const loaderDisplayStyle = (this.props.isLoading && true);
            // this.props.targetUserId === this.props.authenticatedUser.userId
            //     ? (this.props.originatedBooksCount === 0 ? 'block' : 'none')
            //     : (this.props.collaboratingBooksCount === 0 ? 'block' : 'none'));
        if (isAuthTokenExpired(authenticatedUser, isOffline)) {
            push('/signin');
        }
        return (
            <div className="books container">
                {this.props.scrollSpyId}
                
            </div>
        );
    }
}

export default localConnector(BooksPage);
