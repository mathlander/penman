import React, { Component } from 'react';

export interface ISubscriber {
    keyDownHandler?: (e: KeyboardEvent) => any;
    keyUpHandler?: (e: KeyboardEvent) => any;
}

const nullSubscriber = {};
let activeSubscriber: ISubscriber = nullSubscriber;

export const subscribeToInterceptEvents = (subscriber: ISubscriber) => {
    activeSubscriber = subscriber;
};

export const blur = () => {
    activeSubscriber = nullSubscriber;
};

interface ICustomInputManagerState {
    bodyElement: HTMLBodyElement;
}

class CustomInputManager extends Component {
    state: ICustomInputManagerState = {
        bodyElement: document.createElement('body'),
    }

    componentDidMount() {
        const bodyElement = document.getElementsByTagName('body')[0];
        bodyElement.addEventListener('keydown', this.handleKeyDown, false);
        bodyElement.addEventListener('keyup', this.handleKeyUp, false);
        this.setState({
            bodyElement,
        });
    }

    handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement !== this.state.bodyElement) blur();
        if (activeSubscriber.keyDownHandler) activeSubscriber.keyDownHandler(e);
    }

    handleKeyUp = (e: KeyboardEvent) => {
        if (document.activeElement !== this.state.bodyElement) blur();
        if (activeSubscriber.keyUpHandler) activeSubscriber.keyUpHandler(e);
    }

    render() {
        return (
            <div id="custom-input-manager" style={{display: 'none'}} />
        );
    }
}

export default CustomInputManager;
