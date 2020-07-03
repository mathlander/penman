import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { connect, ConnectedProps } from 'react-redux';
import M from 'materialize-css';
import { signOut } from '../../store/actions/authActions';
import { IRootState } from '../../store/type-defs/root-types';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        route: state.router.location.pathname,
        isOffline: state.offline.isOffline,
        storageManager: state.storageManager,
    };
};

const localConnector = connect(mapStateToProps);

class Navbar extends Component<ConnectedProps<typeof localConnector>> {
    state: { sideNavMenus: M.Sidenav[] | null } = {
        sideNavMenus: null,
    }

    componentDidMount() {
        const sideMenuElements = document.querySelectorAll('.side-menu');
        const sideNavMenus = M.Sidenav.init(sideMenuElements, {
            edge: 'left'
        });
        this.setState({ sideNavMenus });
    }

    componentWillUnmount() {
        this.state.sideNavMenus?.forEach(sideNavMenu => sideNavMenu.destroy());
    }

    componentDidUpdate() {
        this.state.sideNavMenus?.forEach(sideNavMenu => {
            sideNavMenu.close();
        });
    }

    render() {
        const { authenticatedUser } = this.props;
        const useAuthenticatedLinks = authenticatedUser.refreshTokenExpirationDate.getTime() > Date.now();
        return (
            <>
                {/** top nav */}
                <nav className="z-depth-0">
                    <div className="nav-wrapper">
                    <Link to="/" className="left">Penman's<span>Pen</span></Link>
                        <span className="right grey-text text-darken-1">
                            <i className="material-icons sidenav-trigger" data-target="side-menu">menu</i>
                        </span>
                    </div>
                </nav>

                {/** side nav */}
                <ul id="side-menu" className="sidenav side-menu">
                    <li><Link to="#" className="subheader">PENMAN</Link></li>
                    <li><div className="divider"></div></li>
                    {!useAuthenticatedLinks &&
                        <>
                            <li><NavLink to="/signup" className="waves-effect left-align">Signup</NavLink></li>
                            <li><NavLink to="/signin" className="waves-effect left-align">Login</NavLink></li>
                        </>
                    }
                    {useAuthenticatedLinks &&
                        <>
                            <li><NavLink to="/dashboard" className="waves-effect left-align">Dashboard</NavLink></li>
                            <li><NavLink to="/prompts" className="waves-effect left-align">Prompts</NavLink></li>
                            <li><NavLink to="/" className="waves-effect left-align" onClick={signOut}>Log Out</NavLink></li>
                        </>
                    }
                </ul>
            </>
        );
    }
}

export default localConnector(Navbar);
