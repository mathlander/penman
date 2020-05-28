import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import M from 'materialize-css';
import { IRootState, IAuthenticatedUser, IPersonification } from '../../store/types';
import { isAuthTokenExpired, refreshToken } from '../../store/actions/authActions';
import { create, read, readAll, update, deleteEntity } from '../../store/actions/personificationActions';
import { visitRecentItemClear } from '../../store/actions/dashboardActions';
import { defaultDate, personificationConstants } from '../../config/constants';
import NewPersonificationCard from './NewPersonificationCard';
import PersonificationCard from './PersonificationCard';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        scrollspyId: state.dashboard.scrollspyId,
        personifications: state.personification.personifications,
        personificationsCount: Object.values(state.personification.personifications).length,
        lastReadAll: state.personification.lastReadAll || defaultDate,
        isOffline: state.offline.isOffline,
        isLoading: !state.offline.isOffline
            && state.personification.pendingActions.length > 0
            && state.personification.pendingActions[0].type === personificationConstants.READ_ALL_PERSONIFICATIONS,
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

interface IPersonificationsPageState {
    scrollspyInstances: M.ScrollSpy[];
}

class PersonificationsPage extends Component<Props> {
    state: IPersonificationsPageState = {
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
        const loaderDisplayStyle = (this.props.isLoading && this.props.personificationsCount === 0 ? 'block' : 'none');
        if (isAuthTokenExpired(authenticatedUser, isOffline)) {
            push('/signin');
        }
        return (
            <div className="personifications container">
                {this.props.scrollspyId && (
                    <a href={`#${this.props.scrollspyId}`} ref={this.anchorRef} style={{ display: 'none' }} aria-hidden={true}>Jump to recent item</a>
                )}
                <div className="personifications-work-area stories container grey-text text-darken-1 col s12 m6">
                    <NewPersonificationCard />
                    <div className="personifications">
                        <div className="blue-text" style={{display: loaderDisplayStyle}}>
                            <div className="preloader-wrapper big active">
                                <div className="spinner-layer"><div className="circle" /></div>
                                <div className="gap-patch"><div className="circle" /></div>
                                <div className="circle-clipper right"><div className="circle"></div></div>
                            </div>
                        </div>
                        {Object.values(this.props.personifications).reverse().map(personification =>
                            <PersonificationCard
                                key={`personificationId:${personification.personificationId}`}
                                personification={personification}
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

export default localConnector(PersonificationsPage);
