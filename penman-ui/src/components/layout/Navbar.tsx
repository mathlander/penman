import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { connect, ConnectedProps } from 'react-redux';
import M from 'materialize-css';
import { signOut, refreshToken, isAuthTokenExpired } from '../../store/actions/authActions';
import { IRootState, IAuthenticatedUser } from '../../store/types';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        signOut: () => dispatch(signOut()),
        refresh: (user: IAuthenticatedUser) => dispatch(refreshToken(user)),
        isTokenExpired: (user: IAuthenticatedUser) => isAuthTokenExpired(user),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class Navbar extends Component<Props> {
    componentDidMount() {
        const menus = document.querySelectorAll(".side-menu");
        M.Sidenav.init(menus, {
            edge: 'right'
        });
    }

    render() {
        const { authenticatedUser } = this.props;
        const initials = !authenticatedUser
            ? ''
            : ((authenticatedUser.firstName && authenticatedUser.firstName[0]) || '') + 
                ((authenticatedUser.middleName && authenticatedUser.middleName[0]) || '') +
                ((authenticatedUser.lastName && authenticatedUser.lastName[0]) || '');
        return (
            <>
                {/** top nav */}
                <nav className="z-depth-0">
                    <div className="nav-wrapper container">
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
                    {!authenticatedUser &&
                        <li><NavLink to="/signup" className="waves-effect left-align">Signup</NavLink></li>
                    }
                    {!authenticatedUser &&
                        <li><NavLink to="/signin" className="waves-effect left-align">Login</NavLink></li>
                    }
                    {!!authenticatedUser &&
                        <li><NavLink to="/create" className="waves-effect left-align">New Project</NavLink></li>
                    }
                    {!!authenticatedUser &&
                        <li><NavLink to="/" className="waves-effect left-align" onClick={this.props.signOut}>Log Out</NavLink></li>
                    }
                    {!!authenticatedUser &&
                        <li><NavLink to="/" className="btn btn-floating pink lighten-1"><span className="badge white-text center-align">{initials}</span></NavLink></li>
                    }
                </ul>
            </>
        );
    }
}

export default localConnector(Navbar);
