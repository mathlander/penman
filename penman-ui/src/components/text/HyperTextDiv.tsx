import React, { Component, MouseEvent, KeyboardEvent, FocusEvent, FormEvent } from 'react';
import { IHyperTextState } from '../../store/types';
import { ICaretPosition, defaultControlState, computeCursorAndHyperTextState } from './hyperTextUtilities';
import './hypertextarea.css';

export interface IHyperTextDivProps {
    innerHtml?: string;
    placeholder?: string;
    update: (richText: string) => any;
};

interface ICommand {
    type: string;
    payload: any;
    apply: () => void;
    undo: () => void;
}

interface IHyperTextDivState {
    bodyId: string;
    bodyElement: HTMLDivElement;
    pendingActionQueue: ICommand[];
    undoStack: ICommand[];
    redoStack: ICommand[];
    caretPosition: ICaretPosition;
    hyperTextState: IHyperTextState;
    timestamp: number;
    uniqueId: number;
    selectionDebounceHandle: NodeJS.Timeout | null;
    selectionDebounceTimeout: number;
    touched: boolean;
}

class HyperTextDiv extends Component<IHyperTextDivProps> {
    state: IHyperTextDivState = {
        bodyId: `hypertextarea-body-${Date.now()}`,
        bodyElement: document.createElement('div'),
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
        touched: false,
    }

    componentDidMount() {
        const bodyElement = document.getElementById(this.state.bodyId);
        document.addEventListener('selectionchange', this.handleSelectionChange, true);
        this.setState({
            bodyElement,
        });
    }

    componentWillUnmount() {
        // optionally give the 'are you sure' message or fire off the save message as needed
        document.removeEventListener('selectionchange', this.handleSelectionChange, true);
    }

    handleBold = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        // console.log(`HyperTextDiv.handleBold was invoked: ${e.currentTarget.text}`);
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
        // console.log(`HyperTextDiv.handleItalics was invoked: ${e.currentTarget.text}`);
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
        // console.log(`HyperTextDiv.handleUnderline was invoked: ${e.currentTarget.text}`);
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
        // console.log(`HyperTextDiv.handleHighlight was invoked: ${e.currentTarget.text}`);
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
        // console.log(`HyperTextDiv.handleBold was invoked: ${e.currentTarget.text}`);
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

    // handleFocus = (e: FocusEvent<HTMLDivElement>) => {
    handleClick = (e: MouseEvent<HTMLDivElement>) => {
        // enable cursor
        if (!this.state.touched) this.setState({ touched: true });
        console.log('Focused');
    }

    handleBlur = (e: FocusEvent<HTMLDivElement>) => {
        // remove cursor
    }

    handleInput = (e: FormEvent<HTMLDivElement>) => {
        this.props.update(this.state.bodyElement.innerHTML);
    }

    render() {
        const validityClass = !!this.props.innerHtml
            ? 'valid'
            : !this.state.touched ? '' : 'invalid';
        return (
            <div className="input-field" onClick={this.handleClick}>
                <div id={`${this.state.bodyId}`}
                    className={`hypertextarea container body ${validityClass}`}
                            // "white col s12"
                    style={{display: (this.props.innerHtml ? 'inline-block': 'none')}}
                    dangerouslySetInnerHTML={this.props.innerHtml ? { __html: this.props.innerHtml } : undefined}
                    onKeyDown={this.handleKeyDown}
                    onKeyUp={this.handleKeyUp}
                    onMouseDown={this.handleMouseDown}
                    onMouseUp={this.handleMouseUp}
                    // onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                    onInput={this.handleInput}
                    />
                <div className={`hypertextarea container body ${validityClass}`} style={{display: (this.props.innerHtml ? 'none' : 'inline-block')}}>
                    <span>{this.props.placeholder || 'Body'}</span>
                </div>
            </div>
        );
    }
}

export default HyperTextDiv;
