import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { push } from 'connected-react-router';
import { IRootState, IAuthenticatedUser } from '../../store/types';
import { isAuthTokenExpired, refreshToken } from '../../store/actions/authActions';
import { visitRecentItem } from '../../store/actions/dashboardActions';

interface IRecentItem {
    title: string;
    scrollspyId: string;
    path: string;
    modifiedDate: Date;
}

const mapStateToProps = (state: IRootState) => {
    const recentItems: IRecentItem[] = [];
    Object.values(state.book.books).forEach(book =>
        recentItems.push({
            title: book.title,
            scrollspyId: `book-card-${book.bookId}`,
            path: '/books',
            modifiedDate: book.modifiedDate,
        })
    );
    Object.values(state.personification.personifications).forEach(personification =>
        recentItems.push({
            title: `${personification.firstName} ${personification.middleName} ${personification.lastName}`.replace('  ', ' ').trim(),
            scrollspyId: `personification-card-${personification.personificationId}`,
            path: '/personifications',
            modifiedDate: personification.modifiedDate,
        })
    );
    Object.values(state.prompt.prompts).forEach(prompt =>
        recentItems.push({
            title: prompt.title,
            scrollspyId: `prompt-card-${prompt.promptId}`,
            path: '/prompts',
            modifiedDate: prompt.modifiedDate,
        })
    );
    Object.values(state.short.shorts).forEach(short =>
        recentItems.push({
            title: short.title,
            scrollspyId: `short-card-${short.shortId}`,
            path: '/shorts',
            modifiedDate: short.modifiedDate,
        })
    );
    Object.values(state.timeline.timelines).forEach(timeline =>
        recentItems.push({
            title: timeline.title,
            scrollspyId: `timeline-card-${timeline.timelineId}`,
            path: '/timelines',
            modifiedDate: timeline.modifiedDate,
        })
    );
    return {
        authenticatedUser: state.auth.authenticatedUser,
        isOffline: state.offline.isOffline,
        recentItems,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        visitRecentItem: (scrollspyId: string) => dispatch(visitRecentItem(scrollspyId)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class Dashboard extends Component<Props> {
    render() {
        const { authenticatedUser, isOffline } = this.props;
        if (isAuthTokenExpired(authenticatedUser, isOffline)) {
            push('/signin');
        }
        return (
            <div className="dashboard container">
                <div className="dashboard-work-area container grey-text text-darken-1 col s12 m6">
                    <div className="dashboard card-panel white row">
                        <div className="card">
                            <div className="card-content">
                                <ul className="collection with-header">
                                    <li className="collection-header"><h4>Get Started</h4></li>
                                    <li className="collection-item"><NavLink to="/books" className="waves-effect left-align">New Novel</NavLink></li>
                                    <li className="collection-item"><NavLink to="/shorts" className="waves-effect left-align">New Short</NavLink></li>
                                    <li className="collection-item"><NavLink to="/prompts" className="waves-effect left-align">New Prompt</NavLink></li>
                                    <li className="collection-item"><NavLink to="/personifications" className="waves-effect left-align">New Character</NavLink></li>
                                    <li className="collection-item"><NavLink to="/timelines" className="waves-effect left-align">New Timeline</NavLink></li>
                                </ul>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-content">
                                <ul className="collection with-header">
                                    <li className="collection-header"><h4>Recent Items</h4></li>
                                    {this.props.recentItems
                                        .sort((left, right) => right.modifiedDate.getTime() - left.modifiedDate.getTime())
                                        .slice(0, 5)
                                        .map((recentItem: IRecentItem, idx: number) => (
                                        <li key={`dashboard-recent-item-${idx}`} className="collection-item">
                                            <NavLink to={recentItem.path} className="waves-effect left-align" onClick={() => this.props.visitRecentItem(recentItem.scrollspyId)}>
                                                {recentItem.title}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default localConnector(Dashboard);
