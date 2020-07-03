import React, { Component, RefObject } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import M from 'materialize-css';
import { IRootState } from '../../store/type-defs/root-types';
import { isAuthTokenExpired } from '../../store/actions/authActions';
import { readAll } from '../../store/actions/promptActions';
import { visitRecentItemClear } from '../../store/actions/dashboardActions';
import { defaultDate, promptConstants } from '../../constants';
import NewPromptCard from './NewPromptCard';
import PromptCard from './PromptCard';

const mapStateToProps = (state: IRootState) => {
    const userId = state.auth.authenticatedUser.profile.userId;
    const originatedPrompts = Object.values(state.prompt.prompts).filter(prompt => prompt.userId === userId);
    const collaboratingPrompts = Object.values(state.prompt.prompts).filter(prompt => prompt.userId !== userId);
    return {
        authenticatedUser: state.auth.authenticatedUser,
        scrollSpyId: state.dashboard.scrollSpyId,
        originatedPrompts,
        collaboratingPrompts,
        originatedPromptsCount: originatedPrompts.length,
        collaboratingPromptsCount: collaboratingPrompts.length,
        lastReadAllDate: state.prompt.lastReadAllDate,
        isOffline: state.offline.isOffline,
        storageManager: state.storageManager,
        isLoading: !state.offline.isOffline
            && state.prompt.pendingActions.length > 0
            && state.prompt.pendingActions[0].type === promptConstants.READ_ALL_PROMPTS,
    };
};

const localConnector = connect(mapStateToProps);

enum PromptTabs {
    originatedWorks = 0,
    collaboratedWorks = 1,
};

interface IPromptsPageState {
    tabSetInstances: M.Tabs[];
    scrollSpyInstances: M.ScrollSpy[];
    anchorRef: RefObject<HTMLAnchorElement>;
    activeTab: PromptTabs;
};

class PromptsPage extends Component<ConnectedProps<typeof localConnector>> {
    state: IPromptsPageState = {
        tabSetInstances: [],
        scrollSpyInstances: [],
        anchorRef: React.createRef<HTMLAnchorElement>(),
        activeTab: PromptTabs.originatedWorks,
    };

    componentDidMount() {
        // load the originated prompts
        readAll(this.props.storageManager, this.props.authenticatedUser.toReplayUser(), this.props.authenticatedUser.profile.userId, this.props.lastReadAllDate);
        // load all of the collaborated prompts, piggy-backing the lastReadAllDate
        // collaborators.forEach(userId => readAll(this.props.storageManager, this.props.authenticatedUser.toReplayUser(), userId, this.props.lastReadAllDate));
        const tabsContainerElements = document.querySelectorAll(".tabs");
        const scrollSpyElements = document.querySelectorAll('.scrollspy');
        const tabSetInstances = M.Tabs.init(tabsContainerElements);
        const scrollSpyInstances = M.ScrollSpy.init(scrollSpyElements, {
            scrollOffset: 35,
        });
        this.setState({
            tabSetInstances,
            scrollSpyInstances,
        });
        if (this.props.scrollSpyId) {
            this.state.anchorRef.current?.click();
            visitRecentItemClear();
        }
    }

    componentWillUnmount() {
        this.state.tabSetInstances.forEach(instance => instance.destroy());
        this.state.scrollSpyInstances.forEach(instance => instance.destroy());
    }

    render() {
        const { authenticatedUser, isOffline, storageManager } = this.props;
        if (isAuthTokenExpired(storageManager, authenticatedUser, isOffline)) push('/signin');
        const loaderdisplayStyle = this.props.isLoading
                && ((this.state.activeTab === PromptTabs.originatedWorks && this.props.originatedPromptsCount === 0 ? 'block' : 'none')
                    || (this.state.activeTab === PromptTabs.collaboratedWorks && this.props.collaboratingPromptsCount === 0))
            ? 'block'
            : 'none';
        return (
            <div className="prompts container">
                {this.props.scrollSpyId && (
                    <a href={`#${this.props.scrollSpyId}`} ref={this.state.anchorRef} style={{ display: 'none' }} atria-hidden={true}>Jump to recent item</a>
                )}

                <div className="col s12">
                    <ul className="tabs">
                        <li className="tab col s6"><a href="#original-prompts" className="grey-text text-darken-3">Original</a></li>
                        <li className="tab col s6"><a href="#collaboration-prompts" className="grey-text text-darken-3">Collaboration</a></li>
                    </ul>

                    <div id="original-prompts" className="col s12">
                        {/* the old-style prompts page, but for the authenticated user */}
                        <NewPromptCard
                            authenticatedUser={authenticatedUser}
                            isOffline={isOffline}
                            storageManager={storageManager}
                            />
                        <div className="prompts">
                            <div className="blue-text" style={{ display: loaderdisplayStyle }}>
                                <div className="preloader-wrapper big active">
                                    <div className="spinner-layer"><div className="circle" /></div>
                                    <div className="gap-patch"><div className="circle" /></div>
                                    <div className="circle-clipper right"><div className="circle"></div></div>
                                </div>
                            </div>
                            {Object.values(this.props.originatedPrompts)
                                .sort((left, right) => right.modifiedDate.getTime() - left.modifiedDate.getTime())
                                .map(prompt =>
                                    <PromptCard
                                        key={`promptId:${prompt.promptId}`}
                                        k={`promptId:${prompt.promptId}`}
                                        prompt={prompt}
                                        authenticatedUser={authenticatedUser}
                                        isOffline={isOffline}
                                        storageManager={storageManager}
                                        />
                                )}
                        </div>
                    </div>

                    <div id="collaboration-prompts" className="col s12">
                        {/* the old-style prompts page, but for collaboration with other users */}
                        <div className="prompts">
                            <div className="blue-text" style={{ display: loaderdisplayStyle }}>
                                <div className="preloader-wrapper big active">
                                    <div className="spinner-layer"><div className="circle" /></div>
                                    <div className="gap-patch"><div className="circle" /></div>
                                    <div className="circle-clipper right"><div className="circle"></div></div>
                                </div>
                            </div>
                            {Object.values(this.props.collaboratingPrompts)
                                .sort((left, right) => right.modifiedDate.getTime() - left.modifiedDate.getTime())
                                .map(prompt =>
                                    <PromptCard
                                        key={`promptId:${prompt.promptId}`}
                                        k={`promptId:${prompt.promptId}`}
                                        prompt={prompt}
                                        authenticatedUser={authenticatedUser}
                                        isOffline={isOffline}
                                        storageManager={storageManager}
                                        />
                                )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default localConnector(PromptsPage);
