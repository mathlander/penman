import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { push } from 'connected-react-router';
import { isAuthTokenExpired } from '../../store/actions/authActions';
import { visitRecentItem } from '../../store/actions/dashboardActions';

const mapStateToProps = (state) => {
    const recentItems = [];
    Object.values(state.prompt.prompts).forEach(prompt =>
        recentItems.push({
            title: prompt.title,
            scrollspyId: `prompt-card-${prompt.promptId}`,
            path: '/prompts',
            modifiedDate: prompt.modifiedDate,
        })
    );
    return {
        authenticatedUser: state.auth.authenticatedUser,
        isOffline: state.offline.isOffline,
        recentItems,
        storageManager: state.storageManager,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        visitRecentItem: (scrollspyId) => dispatch(visitRecentItem(scrollspyId)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

class DashboardPage extends Component {
    render() {
        const { authenticatedUser, isOffline, storageManager } = this.props;
        if (isAuthTokenExpired(storageManager, authenticatedUser, isOffline)) {
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
                                    <li className="collection-item"><NavLink to="/prompts" className="waves-effect left-align">New Prompt</NavLink></li>
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
                                        .map((recentItem, idx) => (
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

export default localConnector(DashboardPage);
