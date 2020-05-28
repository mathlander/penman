import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import M from 'materialize-css';
import { IRootState } from '../../store/types';
import { isAuthTokenExpired } from '../../store/actions/authActions';
import { readAll } from '../../store/actions/timelineActions';
import { visitRecentItemClear } from '../../store/actions/dashboardActions';
import { defaultDate, timelineConstants } from '../../config/constants';
import NewTimelineCard from './NewTimelineCard';
import TimelineCard from './TimelineCard';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        scrollspyId: state.dashboard.scrollspyId,
        timelines: state.timeline.timelines,
        timelinesCount: Object.values(state.timeline.timelines).length,
        lastReadAll: state.timeline.lastReadAll || defaultDate,
        isOffline: state.offline.isOffline,
        isLoading: !state.offline.isOffline
            && state.timeline.pendingActions.length > 0
            && state.timeline.pendingActions[0].type === timelineConstants.READ_ALL_TIMELINES,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        visitRecentItemClear: () => dispatch(visitRecentItemClear()),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

interface ITimelinesPageState {
    scrollspyInstances: M.ScrollSpy[];
}

class TimelinesPage extends Component<Props> {
    state: ITimelinesPageState = {
        scrollspyInstances: [],
    }
    anchorRef: React.RefObject<HTMLAnchorElement>;

    constructor(props: Props) {
        super(props);
        this.anchorRef = React.createRef<HTMLAnchorElement>();
    }

    componentDidMount() {
        readAll(this.props.authenticatedUser, this.props.lastReadAll, this.props.isOffline);
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
        const { authenticatedUser, isOffline } = this.props;
        const loaderDisplayStyle = (this.props.isLoading && this.props.timelinesCount === 0 ? 'block' : 'none');
        if (isAuthTokenExpired(authenticatedUser, isOffline)) {
            push('/signin');
        }
        return (
            <div className="timelines container">
                {this.props.scrollspyId && (
                    <a href={`#${this.props.scrollspyId}`} ref={this.anchorRef} style={{ display: 'none' }} aria-hidden={true}>Jump to recent item</a>
                )}
                <div className="timelines-work-area stories container grey-text text-darken-1 col s12 m6">
                    <NewTimelineCard />
                    <div className="timelines">
                        <div className="blue-text" style={{display: loaderDisplayStyle}}>
                            <div className="preloader-wrapper big active">
                                <div className="spinner-layer"><div className="circle" /></div>
                                <div className="gap-patch"><div className="circle" /></div>
                                <div className="circle-clipper right"><div className="circle"></div></div>
                            </div>
                        </div>
                        {Object.values(this.props.timelines).reverse().map(timeline =>
                            <TimelineCard
                                key={`timelineId:${timeline.timelineId}`}
                                timeline={timeline}
                                user={authenticatedUser}
                                isOffline={isOffline}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default localConnector(TimelinesPage);
