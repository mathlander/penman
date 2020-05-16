import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { connect, ConnectedProps } from 'react-redux';
import M from 'materialize-css';
import { signOut } from '../../store/actions/authActions';
import { IRootState } from '../../store/types';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        route: state.router.location.pathname,
        isOffline: state.offline.isOffline,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        signOut: () => dispatch(signOut()),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class Navbar extends Component<Props> {
    state: { sideNavMenus: M.Sidenav[] | null } = {
        sideNavMenus: null,
    }

    componentDidMount() {
        const sideMenuElements = document.querySelectorAll(".side-menu");
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
                    <div className="nav-wrapper container">
                        <span className="left grey-text text-darken-1">
                            <i className="material-icons sidenav-trigger" data-target="side-menu">menu</i>
                        </span>
                        <Link to="/" className="right">Penman's<span>Pen</span></Link>
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
                            <li><NavLink to="/books" className="waves-effect left-align">Books</NavLink></li>
                            <li><NavLink to="/personifications" className="waves-effect left-align">Personifications</NavLink></li>
                            <li><NavLink to="/prompts" className="waves-effect left-align">Prompts</NavLink></li>
                            <li><NavLink to="/shorts" className="waves-effect left-align">Shorts</NavLink></li>
                            <li><NavLink to="/timelines" className="waves-effect left-align">Timelines</NavLink></li>
                            <li><NavLink to="/" className="waves-effect left-align" onClick={this.props.signOut}>Log Out</NavLink></li>
                        </>
                    }
                </ul>
            </>
        );
    }
}

export default localConnector(Navbar);
