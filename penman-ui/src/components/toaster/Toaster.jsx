import React, { Component } from 'react';
import { connect } from 'react-redux';
import { promptConstants } from '../../constants';
import { errorCodes } from '../../store/types/errorTypes';
import { processError } from '../../store/actions/toasterActions';

const mapStateToProps = (state) => {
    return {
        promptErrorState: state.prompt.promptErrorState,
        promptHasError: state.prompt.promptErrorState.errorCode !== errorCodes.none,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        processError: (errorState, clearErrorType, showInternalError = false) => dispatch(processError(errorState, clearErrorType, showInternalError)),
    }
};

const localConnector = connect(mapStateToProps, mapDispatchToProps);

class Toaster extends Component {
    render() {
        let processedErrorCount = 0;
        if (this.props.promptHasError) {
            this.props.processError(this.props.promptErrorState, promptConstants.PROMPT_CLEAR_ERROR);
            processedErrorCount++;
        }
        return (
            <div id="toaster" data-processederrorcount={processedErrorCount} style={{ display: 'none' }} />
        );
    }
}

export default localConnector(Toaster);
