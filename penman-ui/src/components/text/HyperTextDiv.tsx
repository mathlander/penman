import React, { Component, MouseEvent, FormEvent } from 'react';
import { IHyperTextState } from '../../store/types';
import { subscribeToInterceptEvents, ISubscriber } from './CustomInputManager';
import { ICaretPosition, defaultControlState, computeCursorAndHyperTextState } from './hyperTextUtilities';
import { doesElementEncapsulateSelection, positionCaret } from './hyperTextUtilities';
import { textConstants } from '../../config/constants';
import './hypertextarea.css';

const printableCharacterRegExp: RegExp = /[a-zA-Z0-9`~!@#$%^&*()=+ \r\n\t[\]{}\\/?,.<>;':"_-]+/.compile();

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

interface ICursorSwap {
    original: Element;
    cursed: Element;
}

interface IHyperTextDivState {
    rootId: string;
    rootElement: HTMLDivElement,
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
    cursor: HTMLSpanElement;
    cursorSwap: ICursorSwap | null;
    hasFocus: boolean;
    eventSubscription: ISubscriber;
    activeTextNode: Node;
}

class HyperTextDiv extends Component<IHyperTextDivProps> {
    state: IHyperTextDivState = {
        rootId: `hypertextarea-root-${Date.now()}`,
        rootElement: document.createElement('div'),
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
        cursor: document.createElement('span') as HTMLSpanElement,
        cursorSwap: null,
        hasFocus: false,
        eventSubscription: {},
        activeTextNode: document.createTextNode(''),
    }

    componentDidMount() {
        const rootElement = document.getElementById(this.state.rootId);
        const bodyElement = document.getElementById(this.state.bodyId);
        document.addEventListener('selectionchange', this.handleSelectionChange, true);
        this.state.cursor.classList.add('blinking-cursor');
        this.state.cursor.appendChild(document.createTextNode('|'));
        // const cb = (e: ClipboardEvent) => {
        //     console.log(`Pasted => ${e.clipboardData?.getData('Text')}`, e.clipboardData?.getData('Text'));
        //     return false;
        // }
        bodyElement?.addEventListener('paste', this.handlePaste, false);
        const eventSubscription: ISubscriber = {
            keyDownHandler: this.handleKeyDown,
            keyUpHandler: this.handleKeyUp,
        }
        this.setState({
            rootElement,
            bodyElement,
            eventSubscription,
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

    handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        // this.updateCaretPosition();
        // handle control sequence
        if (e.ctrlKey || e.metaKey) {
            // console.log(`e.key: ${e.key}, e.keyCode: ${e.keyCode}`);
            if (e.altKey) return false;
            if (e.key === 'p') {
                e.preventDefault();
                console.log(`let's print!`);
            } else if (e.key === '\\') {
                // strip selected text of formatting
                // prompt to first level child textNode
            }
            // this.state.bodyElement.onkeydown
        } else if (!e.altKey && printableCharacterRegExp.test(e.key)) {
            // apply a command which appends a payload to some previous text state
            if (e.key === 'Enter') {
                const applicableTextNode = this.state.activeTextNode;
                const nextSibling = applicableTextNode.nextSibling;
                const breakElement = document.createElement('br');
                const lineBreakCommand: ICommand = {
                    type: textConstants.LINE_BREAK_COMMAND,
                    payload: breakElement,
                    apply: function() {
                        if (nextSibling) applicableTextNode.parentElement?.insertBefore(this.payload, applicableTextNode.nextSibling);
                        else applicableTextNode.parentElement?.appendChild(this.payload);
                    },
                    undo: function() {
                        breakElement.remove();
                    },
                };
                this.state.undoStack.push(lineBreakCommand);
                lineBreakCommand.apply();
            } else {
                const undoStackHeight = this.state.undoStack.length;
                if (undoStackHeight && this.state.undoStack[undoStackHeight - 1].type === textConstants.PRINTABLE_TEXT_COMMAND) {
                    const lastCommand = this.state.undoStack[undoStackHeight - 1];
                    lastCommand.payload += e.key;
                    // apply idempotent PRINTABLE_TEXT_COMMAND
                    lastCommand.apply();
                } else {
                    const applicableTextNode = this.state.activeTextNode;
                    const initialTextValue = this.state.activeTextNode.textContent;
                    const printableTextCommand: ICommand = {
                        type: textConstants.PRINTABLE_TEXT_COMMAND,
                        payload: e.key,
                        apply: function() {
                            applicableTextNode.textContent = initialTextValue + this.payload;
                        },
                        undo: function() {
                            applicableTextNode.textContent = initialTextValue;
                        },
                    }
                    this.state.undoStack.push(printableTextCommand);
                    printableTextCommand.apply();
                }
            }
            this.setState({
                redoStack: [],
            });
        } else {
            console.log(`The key was not interpreted to be printable: ${e.keyCode} => otherPrintable${e.key}`, e);
        }
    }

    handleKeyUp = (e: KeyboardEvent) => {
        e.preventDefault();
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

    handlePaste = (e: ClipboardEvent) => {
        e.preventDefault();
        const pastedText = e.clipboardData?.getData('Text') || '';
        // insert element text node or rich text
    }

    handleSelectionChange = (e: Event) => {
        // if there's not already a handler waiting in the wings
        // console.log(`activeElement: `, document.activeElement);
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
        if (!this.props.innerHtml) {
            this.state.bodyElement.appendChild(this.state.activeTextNode);
            this.state.bodyElement.appendChild(this.state.cursor);
            subscribeToInterceptEvents(this.state.eventSubscription);
            this.setState({
                hasFocus: true,
            });
        } else if (doesElementEncapsulateSelection(this.state.rootElement)) {
            // console.log(`selection was contained by element:`, this.state.bodyElement);
            // const focusNode = getFocusNode(this.state.bodyElement);
            // console.log(`focusNode:`, focusNode);
            // console.log(computeCursorAndHyperTextState(this.state.bodyElement));
            positionCaret(this.state.bodyElement, this.state.cursor);
            const activeTextNode = this.state.cursor.previousSibling;

            // focusNode?.parentElement?.replaceChild().replaceWith('foo');
            // take the parent node
            // clone it
            // identify the child of at the cursor position, split it into two
            //      and in between stuff the span.blinking-cursor element
            // listen for keydown events
            //      if state.hasFocus => e.preventDefault()
            //      if a character is typed replace it in both the swap object and at the tail of the previousSibling of the span object
            //      if left-right navigation occurs, replace the previous sibling and the next sibling, unless the current node position
            //          has been moved beyond (except when reaching the very, very beginning)
            //      if up-down navigation occurs, ???
            //      if Ctrl+left-right navigation occurs, nav to previous word
            // should probably always swap the parent node with the replacement, except in the case of continuous typing, where the
            //      textNode.innerText can just be replaced with a concatenated string textNode.innerText += nextChar

            // equivalent to focus is the subscription
            subscribeToInterceptEvents(this.state.eventSubscription);
            this.setState({
                hasFocus: true,
                activeTextNode,
            });
        }
    }

    updateCaretPosition = () => {
        const { caretPosition, hyperTextState } = computeCursorAndHyperTextState(this.state.bodyElement);
        this.setState({
            caretPosition,
            hyperTextState,
            timestamp: Date.now(),
        })
    }

    // handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    //     // remove cursor
    //     console.log(`Blurred`);
    // }

    handleInput = (e: FormEvent<HTMLDivElement>) => {
        // should this be the root element?
        this.props.update(this.state.bodyElement.innerHTML);
    }

    render() {
        const validityClass = !!this.props.innerHtml
            ? 'valid'
            : !this.state.touched ? '' : 'invalid';
        return (
            <div id={this.state.rootId} className="input-field" onClick={this.handleClick}>
                <div id={this.state.bodyId}
                    className={`hypertextarea container body ${validityClass}`}
                            // "white col s12"
                    style={{display: (this.props.innerHtml || this.state.hasFocus ? 'inline-block': 'none')}}
                    dangerouslySetInnerHTML={this.props.innerHtml ? { __html: this.props.innerHtml } : undefined}
                    // onKeyDown={this.handleKeyDown}
                    // onKeyUp={this.handleKeyUp}
                    // onMouseDown={this.handleMouseDown}
                    // onMouseUp={this.handleMouseUp}
                    // onFocus={this.handleFocus}
                    // onBlur={this.handleBlur}
                    // onInput={this.handleInput}
                    />
                <div className={`hypertextarea container body ${validityClass}`} style={{display: (this.props.innerHtml || this.state.hasFocus ? 'none' : 'inline-block')}}>
                    {/* <span>Test<span className="blinking-cursor">|</span>ing</span> */}
                    <span>{this.props.placeholder || 'Body'}</span>
                </div>
            </div>
        );
    }
}

export default HyperTextDiv;
