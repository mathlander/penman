import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import {
    authConstants,
    bookConstants,
    chapterConstants,
    personificationConstants,
    promptConstants,
    shortConstants,
    tagConstants,
    relationshipConstants,
    notificationConstants } from '../../constants';
import { IRootState, IError, ErrorCodes } from '../../store/types';
import { processError } from '../../store/actions/toasterActions';

const mapStateToProps = (state: IRootState) => {
    return {
        // authErrorState: state.auth.authErrorState,
        // authHasError: state.auth.authErrorState.errorCode !== ErrorCodes.none,
        bookErrorState: state.book.bookErrorState,
        bookHasError: state.book.bookErrorState.errorCode !== ErrorCodes.none,
        chapterErrorState: state.chapter.chapterErrorState,
        chapterHasError: state.chapter.chapterErrorState.errorCode !== ErrorCodes.none,
        personificationErrorState: state.personification.personificationErrorState,
        personificationHasError: state.personification.personificationErrorState.errorCode !== ErrorCodes.none,
        promptErrorState: state.prompt.promptErrorState,
        promptHasError: state.prompt.promptErrorState.errorCode !== ErrorCodes.none,
        shortErrorState: state.short.shortErrorState,
        shortHasError: state.short.shortErrorState.errorCode !== ErrorCodes.none,
        tagErrorState: state.tag.tagErrorState,
        tagHasError: state.tag.tagErrorState.errorCode !== ErrorCodes.none,
        relationshipErrorState: state.relationship.relationshipErrorState,
        relationshipHasError: state.relationship.relationshipErrorState.errorCode !== ErrorCodes.none,
        notificationErrorState: state.notification.notificationErrorState,
        notificationHasError: state.notification.notificationErrorState.errorCode !== ErrorCodes.none,
    };
};

const mapDispatchToProps = (dispatch: any) => {
    return {
        processError: (errorState: IError, clearErrorType: string, showInternalError?: boolean) => dispatch(processError(errorState, clearErrorType, showInternalError)),
    };
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof localConnector>;
type Props = PropsFromRedux;

class Toaster extends Component<Props> {
    render() {
        let processedErrorCount = 0;

        // if (this.props.authHasError) {
        //     this.props.processError(this.props.authErrorState, authConstants.AUTH_CLEAR_ERROR);
        //     processedErrorCount++;
        // }
        if (this.props.bookHasError) {
            this.props.processError(this.props.bookErrorState, bookConstants.BOOK_CLEAR_ERROR);
            processedErrorCount++;
        }
        if (this.props.chapterHasError) {
            this.props.processError(this.props.chapterErrorState, chapterConstants.CHAPTER_CLEAR_ERROR);
            processedErrorCount++;
        }
        if (this.props.personificationHasError) {
            this.props.processError(this.props.personificationErrorState, personificationConstants.PERSONIFICATION_CLEAR_ERROR);
            processedErrorCount++;
        }
        if (this.props.promptHasError) {
            this.props.processError(this.props.promptErrorState, promptConstants.PROMPT_CLEAR_ERROR);
            processedErrorCount++;
        }
        if (this.props.shortHasError) {
            this.props.processError(this.props.shortErrorState, shortConstants.SHORT_CLEAR_ERROR);
            processedErrorCount++;
        }
        if (this.props.tagHasError) {
            this.props.processError(this.props.tagErrorState, tagConstants.TAG_CLEAR_ERROR);
            processedErrorCount++;
        }
        if (this.props.relationshipHasError) {
            this.props.processError(this.props.relationshipErrorState, relationshipConstants.RELATIONSHIP_CLEAR_ERROR);
            processedErrorCount++;
        }
        if (this.props.notificationHasError) {
            this.props.processError(this.props.notificationErrorState, notificationConstants.NOTIFICATION_CLEAR_ERROR);
            processedErrorCount++;
        }

        return (
            <div id="toaster" data-processederrorcount={processedErrorCount} style={{ display: 'none' }} />
        );
    }
}

export default localConnector(Toaster);
