import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import {
    IRootState,
    IAuthenticationErrorState,
    IBookErrorState,
    IChapterErrorState,
    IPersonificationErrorState,
    IPromptErrorState,
    IShortErrorState,
    ITimelineErrorState,
    IWelcomeErrorState
} from '../../store/types';
import {
    processAuthError,
    processBookError,
    processChapterError,
    processPersonificationError,
    processPromptError,
    processShortError,
    processTimelineError,
    processWelcomeError
} from '../../store/actions/toasterActions';

const mapStateToProps = (state: IRootState) => {
    return {
        authErrorState: state.auth.authErrorState,
        authHasError: !!state.auth.authErrorState.displayErrorMessage,
        bookErrorState: state.book.bookErrorState,
        bookHasError: !!state.book.bookErrorState.displayErrorMessage,
        chapterErrorState: state.chapter.chapterErrorState,
        chapterHasError: !!state.chapter.chapterErrorState.displayErrorMessage,
        personificationErrorState: state.personification.personificationErrorState,
        personificationHasError: !!state.personification.personificationErrorState.displayErrorMessage,
        promptErrorState: state.prompt.promptErrorState,
        promptHasError: !!state.prompt.promptErrorState.displayErrorMessage,
        shortErrorState: state.short.shortErrorState,
        shortHasError: !!state.short.shortErrorState.displayErrorMessage,
        timelineErrorState: state.timeline.timelineErrorState,
        timelineHasError: !!state.timeline.timelineErrorState.displayErrorMessage,
        welcomeErrorState: state.welcome.welcomeErrorState,
        welcomeHasError: !!state.welcome.welcomeErrorState.displayErrorMessage,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        processAuthError: (errorState: IAuthenticationErrorState, showInternalError?: boolean) => dispatch(processAuthError(errorState, showInternalError)),
        processBookError: (errorState: IBookErrorState, showInternalError?: boolean) => dispatch(processBookError(errorState, showInternalError)),
        processChapterError: (errorState: IChapterErrorState, showInternalError?: boolean) => dispatch(processChapterError(errorState, showInternalError)),
        processPersonificationError: (errorState: IPersonificationErrorState, showInternalError?: boolean) => dispatch(processPersonificationError(errorState, showInternalError)),
        processPromptError: (errorState: IPromptErrorState, showInternalError?: boolean) => dispatch(processPromptError(errorState, showInternalError)),
        processShortError: (errorState: IShortErrorState, showInternalError?: boolean) => dispatch(processShortError(errorState, showInternalError)),
        processTimelineError: (errorState: ITimelineErrorState, showInternalError?: boolean) => dispatch(processTimelineError(errorState, showInternalError)),
        processWelcomeError: (errorState: IWelcomeErrorState, showInternalError?: boolean) => dispatch(processWelcomeError(errorState, showInternalError)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class Toaster extends Component<Props> {
    render() {
        let processedErrorCount = 0;

        if (this.props.authHasError) {
            this.props.processAuthError(this.props.authErrorState);
            processedErrorCount++;
        }

        if (this.props.bookHasError) {
            this.props.processBookError(this.props.bookErrorState);
            processedErrorCount++;
        }

        if (this.props.chapterHasError) {
            this.props.processChapterError(this.props.chapterErrorState);
            processedErrorCount++;
        }

        if (this.props.personificationHasError) {
            this.props.processPersonificationError(this.props.personificationErrorState);
            processedErrorCount++;
        }

        if (this.props.promptHasError) {
            this.props.processPromptError(this.props.promptErrorState);
            processedErrorCount++;
        }

        if (this.props.shortHasError) {
            this.props.processShortError(this.props.shortErrorState);
            processedErrorCount++;
        }

        if (this.props.timelineHasError) {
            this.props.processTimelineError(this.props.timelineErrorState);
            processedErrorCount++;
        }

        if (this.props.welcomeHasError) {
            this.props.processWelcomeError(this.props.welcomeErrorState);
            processedErrorCount++;
        }

        return (
            <div data-processederrorcount={processedErrorCount} style={{display: 'none'}} />
        );
    }
}

export default localConnector(Toaster);
