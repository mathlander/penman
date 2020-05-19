import React, { Component, SyntheticEvent, MouseEvent } from 'react';
import M from 'materialize-css';
import HyperTextAreaControls, { IHyperTextAreaControlsStateExternal } from './HyperTextAreaControls';
import './hypertextarea.css';

export interface IHyperTextAreaProps {
    defaultText: string;
    showControls?: boolean;
    update: (richText: string) => any;
};

interface ICommand {
    type: string;
    payload: any;
    apply: () => void;
    undo: () => void;
}

const now = Date.now();

interface IHyperTextAreaState {
    toolTipInstances: M.Tooltip[];
    dropdownInstances: M.Dropdown[];
    rootId: string;
    rootElement: HTMLDivElement;
    bodyId: string;
    bodyElement: HTMLDivElement;
    innerHtml: string;
    pendingActionQueue: ICommand[];
    undoStack: ICommand[];
    redoStack: ICommand[];
    zoomLevel: string;
    textType: string;
    fontFamily: string;
    fontSize: number;
}

class HyperTextArea extends Component<IHyperTextAreaProps> {
    state: IHyperTextAreaState = {
        toolTipInstances: [],
        dropdownInstances: [],
        rootId: `hypertextarea-root-${now}`,
        rootElement: document.createElement('div'),
        bodyId: `hypertextarea-body-${now}`,
        bodyElement: document.createElement('div'),
        innerHtml: '',
        pendingActionQueue: [],
        undoStack: [],
        redoStack: [],
        zoomLevel: `100%`,
        textType: `Normal`,
        fontFamily: `Arial`,
        fontSize: 11,
    }

    componentDidMount() {
        const tooltipElements = document.querySelectorAll(`.hta-tooltip-${now}`);
        const toolTipInstances = M.Tooltip.init(tooltipElements, {
            enterDelay: 500,
            exitDelay: 10,
            position: 'right',
        });
        const dropdownElements = document.querySelectorAll(`.dropdown-trigger`);
        const dropdownInstances = M.Dropdown.init(dropdownElements, {
            coverTrigger: false,
        });
        const rootElement = document.getElementById(this.state.rootId);
        const bodyElement = document.getElementById(this.state.bodyId);
        const unorderedList = document.createElement('ul');
        const firstItem = document.createElement('li');
        const secondItem = document.createElement('li');
        firstItem.innerText = 'The first item in the list';
        secondItem.innerText = 'The second item in the list';
        unorderedList.appendChild(firstItem);
        unorderedList.appendChild(secondItem);
        this.setState({
            toolTipInstances,
            dropdownInstances,
            rootElement,
            bodyElement,
            innerHtml: unorderedList.innerHTML,
        });
    }

    componentWillUnmount() {
        // optionally give the 'are you sure' message or fire off the save message as needed
        this.state.toolTipInstances.forEach(tooltipInstance => tooltipInstance.destroy());
        this.state.dropdownInstances.forEach(dropdownInstance => dropdownInstance.destroy());
    }

    componentDidUpdate() {
        console.log(`HyperTextArea.componentDidUpdate => currentState: ${this.state.bodyElement.innerHTML}`);
    }

    handleUndo = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const lastCommand = this.state.undoStack.pop();
        if (lastCommand) {
            lastCommand.undo();
            this.state.redoStack.push(lastCommand);
        }
    }

    handleRedo = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const lastCommand = this.state.redoStack.pop();
        if (lastCommand) {
            lastCommand.apply();
            this.state.undoStack.push(lastCommand);
        }
    }

    handlePrint = (e: MouseEvent<HTMLAnchorElement>) => {
        // handle printing
        e.preventDefault();
        console.log(`HyperTextArea.handlePrint was invoked`);
    }

    handleSpellCheck = (e: MouseEvent<HTMLAnchorElement>) => {
        // npm install simple-spellchecker
        e.preventDefault();
        console.log(`HyperTextArea.handleSpellCheck was invoked`);
    }

    handleTextType = (e: SyntheticEvent<HTMLSelectElement>) => {
        e.preventDefault();
        console.log(`HyperTextArea.handleTextType was invoked: ${e.currentTarget.value}`);
        this.setState({
            textType: e.currentTarget.value,
        });
    }

    handleFontFamily = (e: SyntheticEvent<HTMLSelectElement>) => {
        e.preventDefault();
        console.log(`HyperTextArea.handleFontFamily was invoked: ${e.currentTarget.value}`);
        this.setState({
            fontFamily: e.currentTarget.value,
        });
    }

    handleFontSize = (e: SyntheticEvent<HTMLSelectElement>) => {
        e.preventDefault();
        console.log(`HyperTextArea.handleFontSize was invoked: ${e.currentTarget.value}`);
        this.setState({
            fontSize: parseInt(e.currentTarget.value),
        });
    }

    handleBold = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        console.log(`HyperTextArea.handleBold was invoked: ${e.currentTarget.text}`);
    }

    handleItalics = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        console.log(`HyperTextArea.handleItalics was invoked: ${e.currentTarget.text}`);
    }

    handleUnderline = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        console.log(`HyperTextArea.handleUnderline was invoked: ${e.currentTarget.text}`);
    }

    handleHighlight = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        console.log(`HyperTextArea.handleHighlight was invoked: ${e.currentTarget.text}`);
    }

    handleClearFormatting = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        console.log(`HyperTextArea.handleBold was invoked: ${e.currentTarget.text}`);
    }

    stateSubscriber = (controlsState: IHyperTextAreaControlsStateExternal) => {
        console.log(`HyperTextArea.statSubscriber was invoked: ${JSON.stringify(controlsState)}`);
    }

    render() {
        return (
            <div id={this.state.rootId} className="hypertextarea container">
                {this.props.showControls && (
                    <HyperTextAreaControls
                        inheritedStateVersion={0}
                        handleUndo={this.handleUndo}
                        isUndoDisabled={this.state.undoStack.length === 0}
                        handleRedo={this.handleRedo}
                        isRedoDisabled={this.state.redoStack.length === 0}
                        handlePrint={this.handlePrint}
                        handleSpellCheck={this.handleSpellCheck}
                        handleTextType={this.handleTextType}
                        handleFontFamily={this.handleFontFamily}
                        handleFontSize={this.handleFontSize}
                        handleBold={this.handleBold}
                        handleItalics={this.handleItalics}
                        handleUnderline={this.handleUnderline}
                        handleHighlight={this.handleHighlight}
                        handleClearFormatting={this.handleClearFormatting}
                        stateSubscriber={this.stateSubscriber}
                        />
                )}
                <div id={`${this.state.bodyId}`} className="hypertextarea card-panel white row" dangerouslySetInnerHTML={{ __html: this.state.innerHtml }} />
            </div>
        );
    }
}

export default HyperTextArea;
