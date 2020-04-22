import React, { Component, ChangeEvent, MouseEvent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Redirect } from 'react-router-dom';
import M from 'materialize-css';
import { IRootState, IAuthenticatedUser, ILeadEmail } from '../../store/types';
import { isAuthTokenExpired } from '../../store/actions/authActions';
import { submitLead } from '../../store/actions/welcomeActions';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        isTokenExpired: (user: IAuthenticatedUser) => isAuthTokenExpired(user),
        submitLead: (leadEmail: ILeadEmail) => dispatch(submitLead),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class Welcome extends Component<Props> {
    state = {
        email: '',
        phone: '',
        message: '',
        firstName: '',
        lastName: '',
        callbackDate: new Date(),
    }

    componentDidMount() {
        const materialBoxedElements = document.querySelectorAll(".materialboxed");
        const parallaxElements = document.querySelectorAll(".parallax");
        const tabsContainerElements = document.querySelectorAll(".tabs");
        const datePickerElements = document.querySelectorAll(".datepicker");
        const toolTippedElements = document.querySelectorAll(".tooltipped");
        const scrollSpyElements = document.querySelectorAll(".scrollspy");
        M.Materialbox.init(materialBoxedElements);
        M.Parallax.init(parallaxElements);
        M.Tabs.init(tabsContainerElements);
        M.Datepicker.init(datePickerElements, {
            disableWeekends: true,
        });
        M.Tooltip.init(toolTippedElements);
        M.ScrollSpy.init(scrollSpyElements);
    }

    handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const key = e.currentTarget.id.substring('lead-'.length);
        this.setState({
            [key]: e.currentTarget.value,
        })
    }

    handleSubmit = (e: MouseEvent<HTMLFormElement>) => {
        e.preventDefault();
        this.props.submitLead(this.state);
    }

    render() {
        const { authenticatedUser } = this.props;
        if (authenticatedUser && !this.props.isTokenExpired(authenticatedUser)) {
            return <Redirect to='/dashboard' />
        }
        return (
            <div className="welcome container">

                {/** photo/grid */}
                <section className="container section scrollspy" id="photos">
                    <div className="row">
                        <div className="col s12 l4">
                            <img src="img/book.jpg" className="responsive-img materialboxed" alt="A book on Norse mythology." />
                        </div>
                        <div className="col s12 l6 offset-l1">
                            <h2 className="grey-text text-darken-3">Novels &amp; Mythology</h2>
                            <p className="truncate">Tales of lore and fiction.</p>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col s12 l4 push-l7 offset-l1">
                            <img src="img/city.jpg" className="responsive-img materialboxed" alt="Paris from across the river with the Eiffel tower lit up." />
                        </div>
                        <div className="col s12 l6 pull-l5 right-align offset-l1">
                            <h2 className="grey-text text-darken-3">Cityscapes</h2>
                            <p className="truncate">Scenes of majesty and history.</p>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col s12 l4">
                            <img src="img/nature.jpg" className="responsive-img materialboxed" alt="A clown fish emerging from an anemoni." />
                        </div>
                        <div className="col s12 l6 offset-l1">
                            <h2 className="grey-text text-darken-3">Wildlife</h2>
                            <p className="truncate">Discovery and imagination.</p>
                        </div>
                    </div>
                </section>

                {/** first parallax */}
                <div className="parallax-container">
                    <div className="parallax">
                        <img src="img/stars.jpg" className="responsive-img" alt="The Andromeda galaxy." />
                    </div>
                </div>

                {/** services/tabs */}
                <section id="services" className="section container scrollspy">
                    <div className="row">
                        <div className="col s12 l4">
                            <h2 className="grey-text text-darken-3">Penman Services</h2>
                            <p>Penman assists in the writing of short stories.  The application doesn't help with grammar, in the way that &nbsp;
                                <a href="https://www.grammarly.com">grammarly</a> does, but rather it acts as a repository for ideas/prompts
                                and feeds these writing prompts back to the subscriber when the author is in search of a topic on which to write.
                            </p>
                        </div>
                        <div className="col s12 l6 offset-l2">
                            <ul className="tabs">
                                <li className="tab col s6">
                                    <a href="#writing" className="grey-text text-darken-3">Writing</a>
                                </li>
                                <li className="tab col s6">
                                    <a href="#editing" className="grey-text text-darken-3">Editing</a>
                                </li>
                            </ul>

                            <div id="writing" className="col s12">
                                <p className="flow-text grey-text text-darken-3">WRITING</p>
                                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. At optio culpa nihil quis, et ex cumque corrupti quam libero quibusdam aliquid ratione ad nisi sed alias dolore autem ipsam eius.</p>
                                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. At optio culpa nihil quis, et ex cumque corrupti quam libero quibusdam aliquid ratione ad nisi sed alias dolore autem ipsam eius.</p>
                            </div>

                            <div id="editing" className="col s12">
                                <p className="flow-text grey-text text-darken-3">EDITING</p>
                                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. At optio culpa nihil quis, et ex cumque corrupti quam libero quibusdam aliquid ratione ad nisi sed alias dolore autem ipsam eius.</p>
                                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. At optio culpa nihil quis, et ex cumque corrupti quam libero quibusdam aliquid ratione ad nisi sed alias dolore autem ipsam eius.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/** second parallax */}
                <div className="parallax-container">
                    <div className="parallax">
                        <img src="img/street.jpg" className="responsive-img" alt="A dive bar." />
                    </div>
                </div>

                {/** contact form */}
                <section id="contact" className="section container scrollspy">
                    <div className="row">
                        <div className="col s12 l5">
                            <h2 className="grey-text text-darken-3">Get In Touch</h2>
                            <p>If you have questions about engaging in the application, feel free to reach out to us.</p>
                        </div>
                        <div className="col s12 l5 offset-l2">
                            <form onSubmit={this.handleSubmit} className="white">
                                <div className="input-field">
                                    <input id="lead-firstName" type="text"/>
                                    <label htmlFor="lead-firstName">First name</label>
                                </div>
                                <div className="input-field">
                                    <input id="lead-lastName" type="text"/>
                                    <label htmlFor="lead-lastName">Last name</label>
                                </div>
                                <div className="input-field">
                                    <i className="material-icons prefix">email</i>
                                    <input id="lead-email" type="email"/>
                                    <label htmlFor="lead-email">Your email</label>
                                </div>
                                <div className="input-field">
                                    <i className="material-icons prefix">message</i>
                                    <textarea id="lead-message" className="materialize-textarea"></textarea>
                                    <label htmlFor="lead-message">Your message</label>
                                </div>
                                <div className="input-field">
                                    <input id="lead-date" type="text" className="datepicker"/>
                                    <label htmlFor="lead-date">A date for a conversation...</label>
                                </div>
                                <div className="input-field">
                                    <i className="material-icons prefix">email</i>
                                    <input id="lead-email" type="email"/>
                                    <label htmlFor="lead-email">Your email</label>
                                </div>
                                <div className="input-field center">
                                    <button className="btn">Submit</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>

                <footer className="page-footer grey darken-3">
                    <div className="container">
                        <div className="row">
                            <div className="col s12 s6">
                                <h5>About Penman's Pen</h5>
                                <p className="truncate">
                                    Penman is a fully functional sample application that guides aspiring developer's through implementing
                                    an N-Tier architecture application.  It also provides consumers/users of the application with a progressive
                                    web application (PWA) which stores writing prompts provided by the user, aides in the construction of short
                                    stories, and aggregates story snippets into chapters and novels.  Additionally, the application assists in
                                    the management of timelines within a story.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="footer-copyright grey darken-4">
                        <div className="container center-align">&copy; 2020 Penman's Pen</div>
                    </div>
                </footer>
            </div>
        );
    }
}

export default localConnector(Welcome);
