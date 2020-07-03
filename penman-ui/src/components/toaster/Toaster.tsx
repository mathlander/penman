import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { promptConstants } from '../../constants';
// import { ErrorCodes } from '../../store/type-defs/error-types';
import { IRootState } from '../../store/type-defs/root-types';
import { processError } from '../../store/actions/toasterActions';

enum ErrorCodes {
    none = 0,

    // server
    unknown = 1000,
    clientIdCollided = 1001,
    unauthorziedAction = 1002,
    authenticationFailed = 1003,
    accountDeleted = 1004,
    accountLocked = 1005,
    refreshTokenExpired = 1006,
    invalidRefreshToken = 1007,

    // client
    apiUnreachable = 2000,
    dependencyNoLongerExists = 2001,
};

const mapStateToProps = (state: IRootState) => {
    return {
        promptErrorState: state.prompt.promptErrorState,
        promptHasError: state.prompt.promptErrorState.errorCode !== ErrorCodes.none,
    };
};

const localConnector = connect(mapStateToProps);

class Toaster extends Component<ConnectedProps<typeof localConnector>> {
    render() {
        let processedErrorCount = 0;
        if (this.props.promptHasError) {
            processError(this.props.promptErrorState, promptConstants.PROMPT_CLEAR_ERROR);
            processedErrorCount++;
        }
        return (
            <div id="toaster" data-processederrorcount={processedErrorCount} style={{ display: 'none' }} />
        );
    }
}

export default localConnector(Toaster);
