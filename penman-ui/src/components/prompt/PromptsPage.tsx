import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import M from 'materialize-css';
import { IRootState, IAuthenticatedUser, INewPrompt, IPrompt } from '../../store/types';
import { isAuthTokenExpired, refreshToken } from '../../store/actions/authActions';
import { create, read, readAll, update, deleteEntity } from '../../store/actions/promptActions';
import { visitRecentItemClear } from '../../store/actions/dashboardActions';
import NewPromptCard from './NewPromptCard';
import PromptCard from './PromptCard';
import { defaultDate, promptConstants } from '../../config/constants';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        scrollspyId: state.dashboard.scrollspyId,
        prompts: state.prompt.prompts,
        promptsCount: Object.values(state.prompt.prompts).length,
        lastReadAll: state.prompt.lastReadAll || defaultDate,
        isOffline: state.offline.isOffline,
        isLoading: !state.offline.isOffline
            && state.prompt.pendingActions.length > 0
            && state.prompt.pendingActions[0].type === promptConstants.READ_ALL_PROMPTS,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    const refresh = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => dispatch(refreshToken(user, suppressTimeoutAlert));
    return {
        visitRecentItemClear: () => dispatch(visitRecentItemClear()),
        isTokenExpired: (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => isAuthTokenExpired(user, suppressTimeoutAlert, refresh),
        create: (user: IAuthenticatedUser, newPrompt: INewPrompt, suppressTimeoutAlert: boolean) => dispatch(create(user, newPrompt, suppressTimeoutAlert)),
        read: (user: IAuthenticatedUser, promptId: number, suppressTimeoutAlert: boolean) => dispatch(read(user, promptId, suppressTimeoutAlert)),
        readAll: (user: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert: boolean) => dispatch(readAll(user, lastReadAll, suppressTimeoutAlert)),
        update: (user: IAuthenticatedUser, prompt: IPrompt, suppressTimeoutAlert: boolean) => dispatch(update(user, prompt, suppressTimeoutAlert)),
        deleteEntity: (user: IAuthenticatedUser, prompt: IPrompt, suppressTimeoutAlert: boolean) => dispatch(deleteEntity(user, prompt, suppressTimeoutAlert)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

interface IPromptsPageState {
    scrollspyInstances: M.ScrollSpy[];
}

class PromptsPage extends Component<Props> {
    state: IPromptsPageState = {
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
        const loaderDisplayStyle = (this.props.isLoading && this.props.promptsCount === 0 ? 'block' : 'none');
        if (isTokenExpired(authenticatedUser, isOffline)) {
            push('/signin');
        }
        return (
            <div className="prompts container">
                {this.props.scrollspyId && (
                    <a href={`#${this.props.scrollspyId}`} ref={this.anchorRef} style={{ display: 'none' }}>Jump to recent item</a>
                )}
                <div className="prompts-work-area stories container grey-text text-darken-1 col s12 m6">
                    <NewPromptCard />
                    <div className="prompts">
                        <div className="blue-text" style={{display: loaderDisplayStyle}}>
                            <div className="preloader-wrapper big active">
                                <div className="spinner-layer"><div className="circle" /></div>
                                <div className="gap-patch"><div className="circle" /></div>
                                <div className="circle-clipper right"><div className="circle"></div></div>
                            </div>
                        </div>
                        {Object.values(this.props.prompts).reverse().map(prompt =>
                            <PromptCard
                                key={`promptId:${prompt.promptId}`}
                                prompt={prompt}
                                user={authenticatedUser}
                                isOffline={isOffline}
                                update={this.props.update}
                                deleteEntity={this.props.deleteEntity}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default localConnector(PromptsPage);
