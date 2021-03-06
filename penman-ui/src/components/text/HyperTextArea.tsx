import React, { Component, SyntheticEvent, MouseEvent, KeyboardEvent, FocusEvent, FormEvent } from 'react';
import HyperTextAreaControls from './HyperTextAreaControls';
import { IHyperTextState } from '../../store/types';
import { ICaretPosition, defaultControlState, computeCursorAndHyperTextState } from './hyperTextUtilities';
import './hypertextarea.css';

export interface IHyperTextAreaProps {
    innerHtml?: string;
    placeholder?: string;
    showControls?: boolean;
    update: (richText: string) => any;
};

interface ICommand {
    type: string;
    payload: any;
    apply: () => void;
    undo: () => void;
}

interface IHyperTextAreaState {
    rootId: string;
    rootElement: HTMLDivElement;
    bodyId: string;
    bodyElement: HTMLDivElement;
    innerHtml: string;
    pendingActionQueue: ICommand[];
    undoStack: ICommand[];
    redoStack: ICommand[];
    caretPosition: ICaretPosition;
    hyperTextState: IHyperTextState;
    timestamp: number;
    uniqueId: number;
    selectionDebounceHandle: NodeJS.Timeout | null;
    selectionDebounceTimeout: number;
    placeholderElement: Element;
}

class HyperTextArea extends Component<IHyperTextAreaProps> {
    state: IHyperTextAreaState = {
        rootId: `hypertextarea-root-${Date.now()}`,
        rootElement: document.createElement('div'),
        bodyId: `hypertextarea-body-${Date.now()}`,
        bodyElement: document.createElement('div'),
        innerHtml: '',
        pendingActionQueue: [],
        undoStack: [],
        redoStack: [],
        caretPosition: {
            start: 0,
            end: 0,
        },
        hyperTextState: defaultControlState,
        timestamp: Date.now(),
        uniqueId: Date.now(),
        selectionDebounceHandle: null,
        selectionDebounceTimeout: 300,
        placeholderElement: document.createElement('span'),
    }

    componentDidMount() {
        const rootElement = document.getElementById(this.state.rootId);
        const bodyElement = document.getElementById(this.state.bodyId);
        document.addEventListener('selectionchange', this.handleSelectionChange, true);
        const textNode = document.createTextNode(this.props.placeholder || 'Text');
        const placeholderElement = document.createElement('span');
        placeholderElement.classList.add('placeholder');
        placeholderElement.appendChild(textNode);
        if (bodyElement && !bodyElement.innerHTML) {
            bodyElement.appendChild(placeholderElement);
        }
        this.setState({
            rootElement,
            bodyElement,
            placeholderElement,
        });
    }

    componentWillUnmount() {
        // optionally give the 'are you sure' message or fire off the save message as needed
        document.removeEventListener('selectionchange', this.handleSelectionChange, true);
    }

    componentDidUpdate() {
        // console.log(`HyperTextArea.componentDidUpdate => currentState: ${this.state.bodyElement.innerHTML}`);
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

    handlePrint = (e: MouseEvent<HTMLAnchorElement> | Event) => {
        // handle printing
        e.preventDefault();
        // console.log(`HyperTextArea.handlePrint was invoked`);
    }

    handleTextType = (e: SyntheticEvent<HTMLSelectElement>) => {
        e.preventDefault();
        // console.log(`HyperTextArea.handleTextType was invoked: ${e.currentTarget.value}`);
        this.setState({
            hyperTextState: {
                ...this.state.hyperTextState,
                textType: e.currentTarget.value,
            },
            timestamp: Date.now(),
        });
    }

    handleFontFamily = (e: SyntheticEvent<HTMLSelectElement>) => {
        e.preventDefault();
        // console.log(`HyperTextArea.handleFontFamily was invoked: ${e.currentTarget.value}`);
        this.setState({
            hyperTextState: {
                ...this.state.hyperTextState,
                fontFamily: e.currentTarget.value,
            },
            timestamp: Date.now(),
        });
    }

    handleFontSize = (e: SyntheticEvent<HTMLSelectElement>) => {
        e.preventDefault();
        // console.log(`HyperTextArea.handleFontSize was invoked: ${e.currentTarget.value}`);
        this.setState({
            hyperTextState: {
                ...this.state.hyperTextState,
                fontSize: parseInt(e.currentTarget.value),
            },
            timestamp: Date.now(),
        });
    }

    handleBold = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        // console.log(`HyperTextArea.handleBold was invoked: ${e.currentTarget.text}`);
        this.setState({
            hyperTextState: {
                ...this.state.hyperTextState,
                isEmboldened: !this.state.hyperTextState.isEmboldened,
            },
            timestamp: Date.now(),
        });
    }

    handleItalics = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        // console.log(`HyperTextArea.handleItalics was invoked: ${e.currentTarget.text}`);
        this.setState({
            hyperTextState: {
                ...this.state.hyperTextState,
                isItalicized: !this.state.hyperTextState.isItalicized,
            },
            timestamp: Date.now(),
        });
    }

    handleUnderline = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        // console.log(`HyperTextArea.handleUnderline was invoked: ${e.currentTarget.text}`);
        this.setState({
            hyperTextState: {
                ...this.state.hyperTextState,
                isUnderlined: !this.state.hyperTextState.isUnderlined,
            },
            timestamp: Date.now(),
        });
    }

    handleHighlight = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        // console.log(`HyperTextArea.handleHighlight was invoked: ${e.currentTarget.text}`);
        this.setState({
            hyperTextState: {
                ...this.state.hyperTextState,
                isHighlighted: !this.state.hyperTextState.isHighlighted,
            },
            timestamp: Date.now(),
        });
    }

    handleClearFormatting = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        // console.log(`HyperTextArea.handleBold was invoked: ${e.currentTarget.text}`);
        this.setState({
            hyperTextState: defaultControlState,
            timestamp: Date.now(),
        });
    }

    updateCaretPosition = () => {
        const { caretPosition, hyperTextState } = computeCursorAndHyperTextState(this.state.bodyElement);
        this.setState({
            caretPosition,
            hyperTextState,
            timestamp: Date.now(),
        })
    }

    handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        this.updateCaretPosition();
        if (e.ctrlKey) {
            // console.log(`e.key: ${e.key}, e.keyCode: ${e.keyCode}`);
            if (e.key === 'p') {
                e.preventDefault();
                console.log(`let's print!`);
            }
        }
    }

    handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
        // this.updateCaretPosition();
        // e.preventDefault();
        // console.log(`key up captured:`, e);
    }

    handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        // this.updateCaretPosition();
        //
        // console.log(`mouse down captured:`, e);
    }

    handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
        this.updateCaretPosition();
    }

    handleSelectionChange = (e: Event) => {
        // if there's not already a handler waiting in the wings
        if (!this.state.selectionDebounceHandle) {
            // queue one up, using the configured timeout
            const selectionDebounceHandle = setTimeout(() => {
                this.updateCaretPosition();
                // but make sure to open up the lane once the work is completed
                this.setState({
                    selectionDebounceHandle: null,
                });
            }, this.state.selectionDebounceTimeout);
            this.setState({
                selectionDebounceHandle,
            });
        }
    }

    handleFocus = (e: FocusEvent<HTMLDivElement>) => {
        if (this.state.bodyElement.firstChild === this.state.placeholderElement) this.state.bodyElement.removeChild(this.state.placeholderElement);
    }

    handleBlur = (e: FocusEvent<HTMLDivElement>) => {
        if (!this.state.bodyElement.innerHTML) {
            this.state.bodyElement.appendChild(this.state.placeholderElement);
        }
    }

    handleInput = (e: FormEvent<HTMLDivElement>) => {
        this.props.update(this.state.bodyElement.innerHTML);
    }

    render() {
        return (
            <div id={this.state.rootId} className="hypertextarea container">
                {this.props.showControls && (
                    <HyperTextAreaControls
                        timestamp={this.state.timestamp}
                        inheritedState={this.state.hyperTextState}
                        handleUndo={this.handleUndo}
                        isUndoDisabled={this.state.undoStack.length === 0}
                        handleRedo={this.handleRedo}
                        isRedoDisabled={this.state.redoStack.length === 0}
                        handlePrint={this.handlePrint}
                        handleTextType={this.handleTextType}
                        handleFontFamily={this.handleFontFamily}
                        handleFontSize={this.handleFontSize}
                        handleBold={this.handleBold}
                        handleItalics={this.handleItalics}
                        handleUnderline={this.handleUnderline}
                        handleHighlight={this.handleHighlight}
                        handleClearFormatting={this.handleClearFormatting}
                        />
                )}
                <div
                    id={`${this.state.bodyId}`}
                    className="hypertextarea card-panel white row"
                    // dangerouslySetInnerHTML={{ __html: this.state.innerHtml }}
                    dangerouslySetInnerHTML={this.props.innerHtml ? { __html: this.props.innerHtml } : undefined}
                    contentEditable={true}
                    onKeyDown={this.handleKeyDown}
                    onKeyUp={this.handleKeyUp}
                    onMouseDown={this.handleMouseDown}
                    onMouseUp={this.handleMouseUp}
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                    onInput={this.handleInput}
                    />
            </div>
        );
    }
}

export default HyperTextArea;
