import React, { Component, MouseEvent, SyntheticEvent } from 'react';
import M from 'materialize-css';
import './hypertextarea.css';

export interface IHyperTextAreaControlsProps {
    handleUndo?: (e: MouseEvent<HTMLAnchorElement>) => void;
    handleRedo?: (e: MouseEvent<HTMLAnchorElement>) => void;
    handlePrint?: (e: MouseEvent<HTMLAnchorElement>) => void;
    handleSpellCheck?: (e: MouseEvent<HTMLAnchorElement>) => void;
    handleTextType?: (e: SyntheticEvent<HTMLSelectElement>) => void;
    handleFontFamily?: (e: SyntheticEvent<HTMLSelectElement>) => void;
    handleFontSize?: (e: SyntheticEvent<HTMLSelectElement>) => void;
    handleBold?: (e: MouseEvent<HTMLAnchorElement>) => void;
    handleItalics?: (e: MouseEvent<HTMLAnchorElement>) => void;
    handleUnderline?: (e: MouseEvent<HTMLAnchorElement>) => void;
    handleHighlight?: (e: MouseEvent<HTMLAnchorElement>) => void;
    handleClearFormatting?: (e: MouseEvent<HTMLAnchorElement>) => void;
    stateSubscriber?: (state: IHyperTextAreaControlsStateExternal) => void;
    isUndoDisabled?: boolean;
    isRedoDisabled?: boolean;
    inheritedState?: IHyperTextAreaControlsState;
    inheritedStateVersion?: number;
};

const now = Date.now();

export interface IHyperTextAreaControlsStateExternal {
    textType: string;
    fontFamily: string;
    fontSize: number;
    isEmboldened: boolean;
    isItalicized: boolean;
    isUnderlined: boolean;
    isHighlighted: boolean;
    inheritedStateVersion: number;
}

interface IHyperTextAreaControlsState extends IHyperTextAreaControlsStateExternal {
    toolTipInstances: M.Tooltip[];
    dropdownInstances: M.Dropdown[];
}

class HyperTextAreaControls extends Component<IHyperTextAreaControlsProps> {
    state: IHyperTextAreaControlsState = {
        toolTipInstances: [],
        dropdownInstances: [],
        textType: `span`,
        fontFamily: `arial`,
        fontSize: 11,
        isEmboldened: false,
        isItalicized: false,
        isUnderlined: false,
        isHighlighted: false,
        inheritedStateVersion: 0,
    }

    componentDidMount() {
        const tooltipElements = document.querySelectorAll(`.hta-controls-tooltip-${now}`);
        const toolTipInstances = M.Tooltip.init(tooltipElements, {
            enterDelay: 500,
            exitDelay: 10,
            position: 'right',
        });
        const dropdownElements = document.querySelectorAll(`.hta-controls-dropdown-trigger-${now}`);
        const dropdownInstances = M.Dropdown.init(dropdownElements, {
            coverTrigger: false,
        });
        this.setState({
            ...this.props.inheritedState,
            inheritedStateVersion: this.props.inheritedStateVersion || now,
            toolTipInstances,
            dropdownInstances,
        });
    }

    componentWillUnmount() {
        // optionally give the 'are you sure' message or fire off the save message as needed
        this.state.toolTipInstances.forEach(tooltipInstance => tooltipInstance.destroy());
        this.state.dropdownInstances.forEach(dropdownInstance => dropdownInstance.destroy());
    }

    render() {
        if (this.state.inheritedStateVersion < (this.props.inheritedStateVersion || 0)) {
            // if the user navigates the cursor to a different section of the HTA, then
            // the control row should be updated to reflect the settings of the selected span
            this.setState({
                ...this.props.inheritedState,
                inheritedStateVersion: this.props.inheritedStateVersion,
            });
        } else if (this.props.stateSubscriber) {
            this.props.stateSubscriber({
                textType: this.state.textType,
                fontFamily: this.state.fontFamily,
                fontSize: this.state.fontSize,
                isEmboldened: this.state.isEmboldened,
                isItalicized: this.state.isItalicized,
                isUnderlined: this.state.isUnderlined,
                isHighlighted: this.state.isHighlighted,
                inheritedStateVersion: this.state.inheritedStateVersion,
            });
        }
        return (
            <>
                <div className="row" />
                <div id={`hta-control-row-1-${now}`} className="row">
                    <div className="col s12">
                        <a href="#!" aria-label="Undo" className={`btn-small col-content ${this.props.isUndoDisabled && 'disabled'}`} onClick={this.props.handleUndo}>
                            <i className={`material-icons hta-controls-tooltip-${now}`} data-tooltip="Undo (Ctrl+Z)">undo</i>
                        </a>
                        <a href="#!" aria-label="Redo" className={`btn-small col-content ${this.props.isRedoDisabled && 'disabled'}`} onClick={this.props.handleRedo}>
                            <i className={`material-icons hta-controls-tooltip-${now}`} data-tooltip="Redo (Ctrl+Y)">redo</i>
                        </a>
                        &nbsp;
                        <a href="#!" aria-label="Print" className={`btn-small col-content`} onClick={this.props.handlePrint}>
                            <i className={`material-icons hta-controls-tooltip-${now}`} data-tooltip="Print (Ctrl+P)">print</i>
                        </a>
                        <a href="#!" aria-label="Spellcheck" className={`btn-small col-content`} onClick={this.props.handleSpellCheck}>
                            <i className={`material-icons hta-controls-tooltip-${now}`} data-tooltip="Check spelling (Ctrl+Alt+X)">spellcheck</i>
                        </a>
                        &nbsp;
                        <a href="#!" aria-label="Bold" className={`btn-small col-content`} onClick={this.props.handleBold}>
                            <i className={`material-icons hta-controls-tooltip-${now}`} data-tooltip="Bold (Ctrl+B)">format_bold</i>
                        </a>
                        <a href="#!" aria-label="Italics" className={`btn-small col-content`} onClick={this.props.handleItalics}>
                            <i className={`material-icons hta-controls-tooltip-${now}`} data-tooltip="Italic (Ctrl+I)">format_italic</i>
                        </a>
                        <a href="#!" aria-label="Underline" className={`btn-small col-content`} onClick={this.props.handleUnderline}>
                            <i className={`material-icons hta-controls-tooltip-${now}`} data-tooltip="Underline (Ctrl+U)">format_underlined</i>
                        </a>
                        <a href="#!" aria-label="Highlight" className={`btn-small col-content`} onClick={this.props.handleHighlight}>
                            <i className={`material-icons hta-controls-tooltip-${now}`} data-tooltip="Highlight">{this.state.isHighlighted ? 'highlight_off' : 'highlight'}</i>
                        </a>
                        &nbsp;
                        <a href="#!" aria-label="Clear formatting" className={`btn-small col-content`} onClick={this.props.handleClearFormatting}>
                            <i className={`material-icons hta-controls-tooltip-${now}`} data-tooltip={`Clear formatting (Ctrl+\\)`}>format_clear</i>
                        </a>
                    </div>
                </div>

                <div id={`hta-control-row-2-${now}`} className="row">
                    <div className="col s2" />

                    {/** Input Type Control */}
                    <div className="col s3">
                        <select id={`hta-controls-text-type-${now}`} className={`browser-default hta-controls-tooltip-${now}`} data-tooltip="Text" defaultValue={this.state.textType} onSelect={this.props.handleTextType}>
                            <option value="span">Normal</option>
                            <option value="h1">Heading 1</option>
                            <option value="h2">Heading 2</option>
                            <option value="h3">Heading 3</option>
                            <option value="h4">Heading 4</option>
                            <option value="h5">Heading 5</option>
                            <option value="h6">Heading 6</option>
                        </select>
                    </div>

                    {/** Font Family Control */}
                    <div className="col s3">
                        <select id={`hta-controls-text-type-${now}`} className={`browser-default hta-controls-tooltip-${now}`} data-tooltip="Font" defaultValue={this.state.fontFamily} onSelect={this.props.handleFontFamily}>
                            <option value="arial">Arial</option>
                            <option value="helvetica">Helvetica</option>
                            <option value="verdana">Verdana</option>
                            <option value="times-new-roman">Times New Roman</option>
                            <option value="times">Times</option>
                            <option value="lucida">Lucida Console</option>
                            <option value="courier">Courier New</option>
                        </select>
                    </div>

                    {/** Font Size Control */}
                    <div className="col s2">
                        <select id={`hta-controls-text-type-${now}`} className={`browser-default hta-controls-tooltip-${now}`} data-tooltip="Size" defaultValue={this.state.fontSize} onSelect={this.props.handleFontSize}>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                            <option value="11">11</option>
                            <option value="12">12</option>
                            <option value="14">14</option>
                            <option value="18">18</option>
                            <option value="24">24</option>
                            <option value="30">30</option>
                            <option value="36">36</option>
                            <option value="42">42</option>
                            <option value="48">48</option>
                            <option value="54">54</option>
                            <option value="60">60</option>
                            <option value="72">72</option>
                            <option value="84">84</option>
                            <option value="96">96</option>
                            <option value="108">108</option>
                        </select>
                    </div>

                    <div className="col s2" />
                </div>
            </>
        );
    }
}

export default HyperTextAreaControls;
