import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { push } from 'connected-react-router';
import M from 'materialize-css';
import { IRootState } from '../../store/type-defs/root-types';
import { isAuthTokenExpired } from '../../store/actions/authActions';
import bookImg from '../../img/book.jpg';
import cityImg from '../../img/city.jpg';
import natureImg from '../../img/nature.jpg';
import starsImg from '../../img/stars.jpg';
import streetImg from '../../img/street.jpg';

const mapStateToProps = (state: IRootState) => {
    return {
        authenticatedUser: state.auth.authenticatedUser,
        isOffline: state.offline.isOffline,
        storageManager: state.storageManager,
    };
};

const localConnector = connect(mapStateToProps);

interface IWelcomeState {
    materialBoxInstances: M.Materialbox[];
    parallaxInstances: M.Parallax[];
    tabSetInstances: M.Tabs[];
    datePickerInstances: M.Datepicker[];
    toolTipInstances: M.Tooltip[];
    scrollSpyInstances: M.ScrollSpy[];
};

class WelcomePage extends Component<ConnectedProps<typeof localConnector>> {
    state: IWelcomeState = {
        materialBoxInstances: [],
        parallaxInstances: [],
        tabSetInstances: [],
        datePickerInstances: [],
        toolTipInstances: [],
        scrollSpyInstances: [],
    };

    componentDidMount() {
        const materialBoxedElements = document.querySelectorAll('.materialbox');
        const parallaxElements = document.querySelectorAll('.parallax');
        const tabsContainerElements = document.querySelectorAll('.tabs');
        const datePickerElements = document.querySelectorAll('.datepicker');
        const toolTippedElements = document.querySelectorAll('.tooltip');
        const scrollSpyElements = document.querySelectorAll('.scrollspy');
        const materialBoxInstances = M.Materialbox.init(materialBoxedElements);
        const parallaxInstances = M.Parallax.init(parallaxElements);
        const tabSetInstances = M.Tabs.init(tabsContainerElements);
        const datePickerInstances = M.Datepicker.init(datePickerElements);
        const toolTipInstances = M.Tooltip.init(toolTippedElements);
        const scrollSpyInstances = M.ScrollSpy.init(scrollSpyElements, {
            scrollOffset: 35,
        });
        this.setState({
            materialBoxInstances,
            parallaxInstances,
            tabSetInstances,
            datePickerInstances,
            toolTipInstances,
            scrollSpyInstances,
        });
    }

    componentWillUnmount() {
        this.state.materialBoxInstances.forEach(instance => instance.destroy());
        this.state.parallaxInstances.forEach(instance => instance.destroy());
        this.state.tabSetInstances.forEach(instance => instance.destroy());
        this.state.datePickerInstances.forEach(instance => instance.destroy());
        this.state.toolTipInstances.forEach(instance => instance.destroy());
        this.state.scrollSpyInstances.forEach(instance => instance.destroy());
    }

    render() {
        const { authenticatedUser, isOffline, storageManager } = this.props;
        if (!isAuthTokenExpired(storageManager, authenticatedUser, isOffline)) push('/dashboard');
        return (
            <div className="welcome container">

                {/* photo/grid */}
                <section id="photos" className="container section scrollspy">
                    <div className="row">
                        <div className="col s12 l4">
                            <img src={bookImg} alt="A book on Norse mythology." className="responsive-img materialboxed" />
                        </div>
                        <div className="col s12 l6 offset-l1">
                            <h2 className="grey-text text-darken-3">Novels &amp; Mythology</h2>
                            <p className="truncate">Take tales of lore and cultural fiction and expand upon them, renewing the
                            experience for those familiar with the classical stories and introducing them to those not yet
                            familiar.</p>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col s12 l4 push-l7 offset-l1">
                            <img src={cityImg} alt="Paris from across the river with the Eiffel tower lit up." className="responsive-img materialboxed" />
                        </div>
                        <div className="col s12 l6 pull-l5 right-align offset-l1">
                            <h2 className="grey-text text-darken-3">Cityscapes</h2>
                            <p className="truncate">Describe scenes of majesty and history.  Now, with nearly a quarter of the
                            world's population residing in cities with at least 1 million people, cityscapes provide a real and
                            familiar background for many readers.  Guide your audience through the terrain of the urban jungle
                            on a thrilling or thought-provoking adventure.</p>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col s12 l4">
                            <img src={natureImg} alt="A clown fish emerging from an anemoni." className="responsive-img materialboxed" />
                        </div>
                        <div className="col s12 l6 offset-l1">
                            <h2 className="grey-text text-darken-3">Wildlife</h2>
                            <p className="truncate">Return to the untamed environs full of discovery and imagination.  Follow in
                            the footsteps of Jules Verne and traverse the fathoms of the sea, conjure up an experience in
                            the depths of a jungle, or lead your readers across the plains of America in the age before
                            concrete and steel.</p>
                        </div>
                    </div>
                </section>

                {/* first parallax */}
                <div className="parallax-container">
                    <div className="parallax">
                        <img src={starsImg} alt="The Andromeda galaxy." className="responsive-img" />
                    </div>
                </div>

                {/* services/tabs */}
                <section id="services" className="section container scrollspy">
                    <div className="row">
                        <div className="col s12 l4">
                            <h2 className="grey-text text-darken-3">Penman Services</h2>
                            <p>Penman assists in the writing and editing of short stories and novels.  The application makes no claim to assist
                                the author in proper usage of grammer, such as &nbsp;<a href="https://www.grammarly.com">grammarly</a>&nbsp;
                                might do, beyond what is built into your web browser.  Rather, Penman acts as a repository for ideas/prompts
                                and feeds these writing prompts back to the author when they are in search of a topic for a short story or
                                a character arc within a novel.</p>
                            <p>The progressive web app also allows authors to collaborate with editors and other authors by selecting the material
                                they would like to share and by seemlessly merging work completed in offline mode with any additional contributors.</p>
                            <p>Finally, Penman's main contribution is that of an educational tool.  It is the first in a series of enterprise quality
                                applications with source code, architecture, and virtual code review available for students and independent learners
                                interested in taking up a trade from the set of web programming, API programming, or database administration.</p>
                        </div>
                    </div>
                    <div className="col s12 l6 offset-l3">
                        <ul className="tabs">
                            <li className="tab col s6">
                                <a href="#writing" className="grey-text text-darken-3">Writing</a>
                            </li>
                            <li className="tab col s6">
                                <a href="#editing" className="grey-text text-darken-3">Editing</a>
                            </li>
                            <li className="tab col s6">
                                <a href="#programming" className="grey-text text-darken-3">Programming</a>
                            </li>
                        </ul>

                        <div id="writing" className="col s12">
                            <p className="flow-text grey-text text-darken-3">WRITING</p>
                            <p>Apply your imagination and tap into your stores of knowledge by writing.  The application can be used as a journal,
                                a notepad to track ideas worthy of exploration down the line, or for managing complex stories with many characters
                                spanning years, centuries, or just a few days.</p>
                        </div>

                        <div className="col s12">
                            <p className="flow-text grey-text text-darken-3">EDITING</p>
                            <p>Assist other writers on their projects through the collaboration features of the application.</p>
                        </div>

                        <div className="col s12">
                            <p className="flow-text grey-text text-darken-3">PROGRAMMING</p>
                            <p>Follow the instructional series of <a href="https://youtube.com">YouTube</a> videos to recreate the application
                            from scratch.  Learn how to ideate, design, and implement projects of your own.</p>
                        </div>
                    </div>
                </section>

                {/* second parallax */}
                <div className="parallax-container">
                    <div className="parallax">
                        <img src={streetImg} alt="A dive bar." className="responsive-img" />
                    </div>
                </div>

                {/* contact information */}
                <section id="contact" className="section container scrollspy">
                    <div className="row">
                        <div className="col s12 l5">
                            <h2 className="grey-text text-darken-3">Get In Touch</h2>
                            <p>I lecture part-time at UTD.  Currently, I teach one of the Discrete Math course sections.
                                Students with questions regarding how to setup the application, extend it, or create
                                something similar should feel free to come by my office on the fourth floor of the ECSS
                                or email me to setup office hours.</p>
                        </div>
                    </div>
                </section>

                {/* footer */}
                <footer className="page-footer grey darken-3">
                    <div className="container">
                        <div className="row">
                            <div className="col s12 l6">
                                <h5>About Penman's Pen</h5>
                                <p className="truncate">
                                    Penman is a fully functional sample application that guides aspiring developers through
                                    the labor of implementing an N-Tiered application, with source code made available on GitHub
                                    through the MIT license and code reviews published on <a href="https://youtube.com">YouTube</a>.
                                    It provides consumers/users, individuals that want to use it rather than learn from it, with a
                                    progressive web application (PWA) which stores writing prompts provided by the user, aides in the
                                    construction of short stories, and aggregates story snippets into chapters and novels.  Additionally,
                                    the application provides visualizations for timelines within a story and the opportunity to
                                    collaborate with other users.
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

export default localConnector(WelcomePage);
