import React, { Component, MouseEvent, SyntheticEvent } from 'react';
import M from 'materialize-css';
import { IHyperTextState } from '../../store/types';
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
    isUndoDisabled?: boolean;
    isRedoDisabled?: boolean;
    inheritedState?: IHyperTextState;
    timestamp: number;
};

interface IHyperTextAreaControlsStateInternal {
    toolTipInstances: M.Tooltip[];
    dropdownInstances: M.Dropdown[];
    uniqueId: number;
}

class HyperTextAreaControls extends Component<IHyperTextAreaControlsProps> {
    state: IHyperTextAreaControlsStateInternal = {
        toolTipInstances: [],
        dropdownInstances: [],
        uniqueId: Date.now(),
    }

    componentDidMount() {
        const tooltipElements = document.querySelectorAll(`.hta-controls-tooltip-${this.state.uniqueId}`);
        const toolTipInstances = M.Tooltip.init(tooltipElements, {
            enterDelay: 500,
            exitDelay: 10,
            position: 'right',
        });
        const dropdownElements = document.querySelectorAll(`.hta-controls-dropdown-trigger-${this.state.uniqueId}`);
        const dropdownInstances = M.Dropdown.init(dropdownElements, {
            coverTrigger: false,
        });
        this.setState({
            ...this.props.inheritedState,
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
        return (
            <>
                <div className="row" />
                <div id={`hta-control-row-1-${this.state.uniqueId}`} className="row">
                    <div className="col s12">
                        <a href="#!" aria-label="Undo" className={`waves-effect btn-small col-content ${this.props.isUndoDisabled ? 'disabled' : 'teal lighten-2'}`} onClick={this.props.handleUndo}>
                            <i className={`material-icons hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip="Undo (Ctrl+Z)">undo</i>
                        </a>
                        <a href="#!" aria-label="Redo" className={`waves-effect btn-small col-content ${this.props.isRedoDisabled ? 'disabled' : 'teal lighten-2'}`} onClick={this.props.handleRedo}>
                            <i className={`material-icons hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip="Redo (Ctrl+Y)">redo</i>
                        </a>
                        &nbsp;
                        <a href="#!" aria-label="Print" className={`waves-effect btn-small col-content teal lighten-2`} onClick={this.props.handlePrint}>
                            <i className={`material-icons hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip="Print (Ctrl+P)">print</i>
                        </a>
                        <a href="#!" aria-label="Spellcheck" className={`waves-effect btn-small col-content teal lighten-2`} onClick={this.props.handleSpellCheck}>
                            <i className={`material-icons hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip="Check spelling (Ctrl+Alt+X)">spellcheck</i>
                        </a>
                        &nbsp;
                        <a href="#!" aria-label="Bold" className={`waves-effect btn-small col-content teal ${this.props.inheritedState?.isEmboldened ? 'text-darken-2' : 'lighten-2'}`} onClick={this.props.handleBold}>
                            <i className={`material-icons hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip="Bold (Ctrl+B)">format_bold</i>
                        </a>
                        <a href="#!" aria-label="Italics" className={`waves-effect btn-small col-content teal ${this.props.inheritedState?.isItalicized ? 'text-darken-2' : 'lighten-2'}`} onClick={this.props.handleItalics}>
                            <i className={`material-icons hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip="Italic (Ctrl+I)">format_italic</i>
                        </a>
                        <a href="#!" aria-label="Underline" className={`waves-effect btn-small col-content teal ${this.props.inheritedState?.isUnderlined ? 'text-darken-2' : 'lighten-2'}`} onClick={this.props.handleUnderline}>
                            <i className={`material-icons hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip="Underline (Ctrl+U)">format_underlined</i>
                        </a>
                        <a href="#!" aria-label="Highlight" className={`waves-effect btn-small col-content teal lighten-2`} onClick={this.props.handleHighlight}>
                            <i className={`material-icons hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip="Highlight">{this.props.inheritedState?.isHighlighted ? 'highlight_off' : 'highlight'}</i>
                        </a>
                        &nbsp;
                        <a href="#!" aria-label="Clear formatting" className={`waves-effect btn-small col-content teal lighten-2`} onClick={this.props.handleClearFormatting}>
                            <i className={`material-icons hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip={`Clear formatting (Ctrl+\\)`}>format_clear</i>
                        </a>
                    </div>
                </div>

                <div id={`hta-control-row-2-${this.state.uniqueId}`} className="row">
                    <div className="col s2" />

                    {/** Input Type Control */}
                    <div className="col s3">
                        <select id={`hta-controls-text-type-${this.state.uniqueId}`} className={`browser-default hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip="Text" defaultValue={this.props.inheritedState?.textType || ''} onSelect={this.props.handleTextType}>
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
                        <select id={`hta-controls-text-type-${this.state.uniqueId}`} className={`browser-default hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip="Font" defaultValue={this.props.inheritedState?.fontFamily || ''} onSelect={this.props.handleFontFamily}>
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
                        <select id={`hta-controls-text-type-${this.state.uniqueId}`} className={`browser-default hta-controls-tooltip-${this.state.uniqueId}`} data-tooltip="Size" defaultValue={this.props.inheritedState?.fontSize?.toString() || ''} onSelect={this.props.handleFontSize}>
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
