import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import { IRootState, IAuthenticatedUser, INewShort, IShort } from '../../store/types';
import { isAuthTokenExpired, refreshToken } from '../../store/actions/authActions';
import { create, read, readAll, update, deleteEntity } from '../../store/actions/shortActions';
import { defaultDate, shortConstants } from '../../config/constants';
import ShortCard from './ShortCard';
import NewShortCard from './NewShortCard';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        shorts: state.short.shorts,
        shortsCount: Object.values(state.short.shorts).length,
        lastReadAll: state.short.lastReadAll || defaultDate,
        isOffline: state.offline.isOffline,
        isLoading: !state.offline.isOffline
            && state.short.pendingActions.length > 0
            && state.short.pendingActions[0].type === shortConstants.READ_ALL_SHORTS,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    const refresh = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => dispatch(refreshToken(user, suppressTimeoutAlert));
    return {
        isTokenExpired: (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => isAuthTokenExpired(user, suppressTimeoutAlert, refresh),
        create: (user: IAuthenticatedUser, newShort: INewShort, suppressTimeoutAlert: boolean) => dispatch(create(user, newShort, suppressTimeoutAlert)),
        read: (user: IAuthenticatedUser, shortId: number, suppressTimeoutAlert: boolean) => dispatch(read(user, shortId, suppressTimeoutAlert)),
        readAll: (user: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert: boolean) => dispatch(readAll(user, lastReadAll, suppressTimeoutAlert)),
        update: (user: IAuthenticatedUser, short: IShort, suppressTimeoutAlert: boolean) => dispatch(update(user, short, suppressTimeoutAlert)),
        deleteEntity: (user: IAuthenticatedUser, short: IShort, suppressTimeoutAlert: boolean) => dispatch(deleteEntity(user, short, suppressTimeoutAlert)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class ShortsPage extends Component<Props> {
    componentDidMount() {
        this.props.readAll(this.props.authenticatedUser, this.props.lastReadAll, this.props.isOffline);
    }

    render() {
        const { authenticatedUser, isOffline, isTokenExpired } = this.props;
        const loaderDisplayStyle = (this.props.isLoading && this.props.shortsCount === 0 ? 'block' : 'none');
        if (isTokenExpired(authenticatedUser, isOffline)) {
            push('/signin');
        }
        return (
            <div className="books container">
                <div className="books-work-area container grey-text text-darken-1 col s12 m6">
                    <NewShortCard />
                    <div className="books">
                        <div className="blue-text" style={{display: loaderDisplayStyle}}>
                            <div className="preloader-wrapper big active">
                                <div className="spinner-layer"><div className="circle" /></div>
                                <div className="gap-patch"><div className="circle" /></div>
                                <div className="circle-clipper right"><div className="circle"></div></div>
                            </div>
                        </div>
                        {Object.values(this.props.shorts).reverse().map(short =>
                            <ShortCard
                                key={`shortId:${short.shortId}`}
                                short={short}
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

export default localConnector(ShortsPage);
