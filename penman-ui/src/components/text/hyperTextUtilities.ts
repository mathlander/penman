import { IHyperTextState, IHyperTextStateBuilder } from '../../store/types';

export const emptyControlState: IHyperTextState = {
    textType: null,
    fontFamily: null,
    fontSize: null,
    isEmboldened: null,
    isItalicized: null,
    isUnderlined: null,
    isHighlighted: null,
};

export const defaultControlState: IHyperTextState = {
    textType: `span`,
    fontFamily: `arial`,
    fontSize: 14,
    isEmboldened: false,
    isItalicized: false,
    isUnderlined: false,
    isHighlighted: false,
};

export interface ICaretPosition {
    start: number;
    end: number;
};

const textTypes = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

const handleBoldTag = (hyperTextStateBuilder: IHyperTextStateBuilder) => {
    if (hyperTextStateBuilder.isEmboldened === undefined) hyperTextStateBuilder.isEmboldened = true;
    else if (hyperTextStateBuilder.isEmboldened === false) hyperTextStateBuilder.isEmboldened = null;
};

const handleItalicsTag = (hyperTextStateBuilder: IHyperTextStateBuilder) => {
    if (hyperTextStateBuilder.isItalicized === undefined) hyperTextStateBuilder.isItalicized = true;
    else if (hyperTextStateBuilder.isItalicized === false) hyperTextStateBuilder.isItalicized = null;
};

const handleUnderlineTag = (hyperTextStateBuilder: IHyperTextStateBuilder) => {
    if (hyperTextStateBuilder.isUnderlined === undefined) hyperTextStateBuilder.isUnderlined = true;
    else if (hyperTextStateBuilder.isUnderlined === false) hyperTextStateBuilder.isUnderlined = null;
};

const handleMarkTag = (hyperTextStateBuilder: IHyperTextStateBuilder) => {
    if (hyperTextStateBuilder.isHighlighted === undefined) hyperTextStateBuilder.isHighlighted = true;
    else if (hyperTextStateBuilder.isHighlighted === false) hyperTextStateBuilder.isHighlighted = null;
};

const handleTextType = (element: Element, hyperTextStateBuilder: IHyperTextStateBuilder) => {
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'h1') {
        if (hyperTextStateBuilder.textType === undefined) hyperTextStateBuilder.textType = 'h1';
        else if (hyperTextStateBuilder.textType !== 'h1') hyperTextStateBuilder.textType = null;
    }
    if (tagName === 'h2') {
        if (hyperTextStateBuilder.textType === undefined) hyperTextStateBuilder.textType = 'h2';
        else if (hyperTextStateBuilder.textType !== 'h2') hyperTextStateBuilder.textType = null;
    }
    if (tagName === 'h3') {
        if (hyperTextStateBuilder.textType === undefined) hyperTextStateBuilder.textType = 'h3';
        else if (hyperTextStateBuilder.textType !== 'h3') hyperTextStateBuilder.textType = null;
    }
    if (tagName === 'h4') {
        if (hyperTextStateBuilder.textType === undefined) hyperTextStateBuilder.textType = 'h4';
        else if (hyperTextStateBuilder.textType !== 'h4') hyperTextStateBuilder.textType = null;
    }
    if (tagName === 'h5') {
        if (hyperTextStateBuilder.textType === undefined) hyperTextStateBuilder.textType = 'h5';
        else if (hyperTextStateBuilder.textType !== 'h5') hyperTextStateBuilder.textType = null;
    }
    if (tagName === 'h6') {
        if (hyperTextStateBuilder.textType === undefined) hyperTextStateBuilder.textType = 'h6';
        else if (hyperTextStateBuilder.textType !== 'h6') hyperTextStateBuilder.textType = null;
    }
    if (tagName === 'p' || tagName === 'span') {
        if (hyperTextStateBuilder.textType === undefined) hyperTextStateBuilder.textType = 'span';
        else if (hyperTextStateBuilder.textType !== 'span') hyperTextStateBuilder.textType = null;
    }
}

const parseClassList = (element: Element, hyperTextStateBuilder: IHyperTextStateBuilder) => {
    // check for font-family and font-size (perhaps in the future font-weight and text-align)
    const fontSizeStr = 'font-size-';
    const fontFamilyStr = 'font-family-';
    let classes = element.className.split(' ');
    for (let i = 0; i < classes.length; i++) {
        const isFontSizeClass = classes[i].startsWith(fontSizeStr);
        const isFontFamilyClass = classes[i].startsWith(fontFamilyStr);
        if (isFontSizeClass) {
            const fontSize = parseInt(classes[i].slice(fontSizeStr.length));
            if (hyperTextStateBuilder.fontSize === undefined) hyperTextStateBuilder.fontSize = fontSize;
            else if (hyperTextStateBuilder.fontSize !== fontSize) hyperTextStateBuilder.textType = null;
        } else if (isFontFamilyClass) {
            const fontFamily = classes[i].slice(fontFamilyStr.length);
            if (hyperTextStateBuilder.fontFamily === undefined) hyperTextStateBuilder.fontFamily = fontFamily;
            else if (hyperTextStateBuilder.fontFamily !== fontFamily) hyperTextStateBuilder.fontFamily = null;
        }
    }
};

const applyDefaults = (hyperTextStateBuilder: IHyperTextStateBuilder) => {
    if (hyperTextStateBuilder.isEmboldened === undefined) hyperTextStateBuilder.isEmboldened = false;
    if (hyperTextStateBuilder.isItalicized === undefined) hyperTextStateBuilder.isItalicized = false;
    if (hyperTextStateBuilder.isUnderlined === undefined) hyperTextStateBuilder.isUnderlined = false;
    if (hyperTextStateBuilder.isHighlighted === undefined) hyperTextStateBuilder.isHighlighted = false;
    if (hyperTextStateBuilder.fontSize === undefined) hyperTextStateBuilder.fontSize = 14;
    if (hyperTextStateBuilder.fontFamily === undefined) hyperTextStateBuilder.fontFamily = 'arial';
    if (hyperTextStateBuilder.textType === undefined) hyperTextStateBuilder.textType = 'span';
};

const buildHyperTextStateForElement = (element: Element, hyperTextStateBuilder: IHyperTextStateBuilder) => {
    if (element.tagName.toLocaleLowerCase() === 'b') handleBoldTag(hyperTextStateBuilder);
    else if (element.tagName.toLocaleLowerCase() === 'i') handleItalicsTag(hyperTextStateBuilder);
    else if (element.tagName.toLocaleLowerCase() === 'u') handleUnderlineTag(hyperTextStateBuilder);
    else if (element.tagName.toLocaleLowerCase() === 'mark') handleMarkTag(hyperTextStateBuilder);
    else if (textTypes.indexOf(element.tagName.toLocaleLowerCase()) >= 0) handleTextType(element, hyperTextStateBuilder);
    else parseClassList(element, hyperTextStateBuilder);
};

const buildHyperTextState = (leafNode: Node, containerElement: Element, hyperTextStateBuilder: IHyperTextStateBuilder) => {
    let parentElement = leafNode.parentElement;
    while (parentElement) {
        if (parentElement === containerElement) {
            applyDefaults(hyperTextStateBuilder);
            break;
        }
        else {
            buildHyperTextStateForElement(parentElement, hyperTextStateBuilder);
        }
        parentElement = parentElement.parentElement;
    }
};

export const walkLeafNodes = (
                                containerElement: Element,
                                startNode: Node,
                                endNode: Node,
                                elementCallback: (currentElement: Element) => any,
                                leafNodeCallback: (currentNode: Node) => any,
                                shortCircuitCallback = () => false) => {
    if (startNode === endNode) {
        // make sure that this function behaves consistently even when the cursor has a width of zero
        let parentElement = startNode.parentElement;
        let stack: (Element | null)[] = [parentElement];
        while (parentElement) {
            if (parentElement instanceof Element) stack.push(parentElement);
            if (parentElement === containerElement) break;
            parentElement = parentElement.parentElement;
        }
        let nextElement: Element | null | undefined;
        while ((nextElement = stack.pop())) {
            elementCallback(nextElement);
        }
        leafNodeCallback(startNode);
        return;
    }
    let startReached = false;
    let endReached = false;
    let elementStackQueue: Element[] = [containerElement];
    const recursiveWalker = (branchRoot: Element) => {
        for (let i = 0; i < branchRoot.childNodes.length; i++) {
            if (endReached || shortCircuitCallback()) break;
            let childElement: Element | Node = branchRoot.childNodes[i];
            if (childElement instanceof Element) {
                elementStackQueue.push(childElement);
                recursiveWalker(childElement);
                // upon returning, check if we encountered the start during this branch
                if (startReached) elementCallback(childElement);
            } else if (childElement === startNode) {
                startReached = true;
                // replay the queue
                for (let j = 0; j < elementStackQueue.length; j++) {
                    elementCallback(elementStackQueue[j]);
                }
                // then pick up with the current node
                leafNodeCallback(childElement);
            } else if (childElement === endNode) {
                endReached = true;
                leafNodeCallback(childElement);
            } else {
                if (startReached) leafNodeCallback(childElement);
            }
        }
        elementStackQueue.pop();
    };
    recursiveWalker(containerElement);
};

export const computeCursorAndHyperTextState = (element: HTMLDivElement) => {
    let caretPosition: ICaretPosition = {
        start: 0,
        end: 0,
    };
    let hyperTextState: IHyperTextState = {
        ...defaultControlState,
    };
    if (!element.ownerDocument) return { caretPosition, hyperTextState };
    const doc = element.ownerDocument;
    const win = doc.defaultView;
    if (win && typeof win.getSelection !== 'undefined') {
        const selection = win.getSelection() || new Selection();
        let anchorAncestorElement: Element | null = selection.anchorNode?.parentElement || null;
        let ancestry: { anchor: Element[], focus: Element[] } = {
            anchor: [],
            focus: [],
        };
        let isAnchorContainedByElement = false;
        while (anchorAncestorElement) {
            ancestry.anchor.unshift(anchorAncestorElement);
            if (anchorAncestorElement.id === element.id) {
                isAnchorContainedByElement = true;
                break;
            }
            anchorAncestorElement = anchorAncestorElement.parentElement;
        }
        let focusAncestorElement: Element | null = selection.focusNode?.parentElement || null;
        let isFocusContainedByElement = false;
        while (focusAncestorElement) {
            ancestry.focus.unshift(focusAncestorElement);
            if (focusAncestorElement.id === element.id) {
                isFocusContainedByElement = true;
                break;
            }
            focusAncestorElement = focusAncestorElement.parentElement;
        }
        if (isAnchorContainedByElement && isFocusContainedByElement && selection.rangeCount > 0) {
            let range = selection.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.startContainer, range.startOffset);
            caretPosition.start = preCaretRange.toString().length;
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretPosition.end = preCaretRange.toString().length;
            let computedState: IHyperTextStateBuilder = {}
            buildHyperTextState(range.startContainer, element, computedState);
            const leafNodeCallback = (leafNode: Node) => {};
            const elementCallback = (element: Element) => buildHyperTextStateForElement(element, computedState);
            walkLeafNodes(element, range.startContainer, range.endContainer, elementCallback, leafNodeCallback);
            hyperTextState.textType = computedState.textType || null;
            hyperTextState.fontFamily = computedState.fontFamily || null;
            hyperTextState.fontSize = computedState.fontSize || null;
            hyperTextState.isEmboldened = computedState.isEmboldened || null;
            hyperTextState.isItalicized = computedState.isItalicized || null;
            hyperTextState.isUnderlined = computedState.isUnderlined || null;
            hyperTextState.isHighlighted = computedState.isHighlighted || null;
        }
    }
    return {
        caretPosition,
        hyperTextState,
    };
};

export const doesElementEncapsulateSelection = (element: Element) => {
    if (!element.ownerDocument) return false;
    const doc = element.ownerDocument;
    const win = doc.defaultView;
    if (win && typeof win.getSelection !== 'undefined') {
        const selection = win.getSelection() || new Selection();
        let anchorAncestorElement: Element | null = selection.anchorNode?.parentElement || null;
        let ancestry: { anchor: Element[], focus: Element[] } = {
            anchor: [],
            focus: [],
        };
        let isAnchorContainedByElement = false;
        while (anchorAncestorElement) {
            ancestry.anchor.unshift(anchorAncestorElement);
            if (anchorAncestorElement.id === element.id) {
                isAnchorContainedByElement = true;
                break;
            }
            anchorAncestorElement = anchorAncestorElement.parentElement;
        }
        let focusAncestorElement: Element | null = selection.focusNode?.parentElement || null;
        let isFocusContainedByElement = false;
        while (focusAncestorElement) {
            ancestry.focus.unshift(focusAncestorElement);
            if (focusAncestorElement.id === element.id) {
                isFocusContainedByElement = true;
                break;
            }
            focusAncestorElement = focusAncestorElement.parentElement;
        }
        return isAnchorContainedByElement && isFocusContainedByElement;
    }
    return false;
};

export const getFocusNode = (element: Element) => {
    if (element.ownerDocument) {
        const doc = element.ownerDocument;
        const win = doc.defaultView;
        if (win && typeof win.getSelection !== 'undefined') {
            const selection = win.getSelection() || new Selection();
            return selection.focusNode;
        }
    }
    return null;
};

export const positionCaret = (root: Element, blinkingCursor: Element) => {
    // let newParent: Element | null = null;
    // let focusNode = getFocusNode(root);


    let caretPosition: ICaretPosition = {
        start: 0,
        end: 0,
    };
    if (!root.ownerDocument) return;
    const doc = root.ownerDocument;
    const win = doc.defaultView;
    if (win && typeof win.getSelection !== 'undefined') {
        const selection = win.getSelection() || new Selection();
        let anchorAncestorElement: Element | null = selection.anchorNode?.parentElement || null;
        let ancestry: { anchor: Element[], focus: Element[] } = {
            anchor: [],
            focus: [],
        };
        let isAnchorContainedByElement = false;
        while (anchorAncestorElement) {
            ancestry.anchor.unshift(anchorAncestorElement);
            if (anchorAncestorElement.id === root.id) {
                isAnchorContainedByElement = true;
                break;
            }
            anchorAncestorElement = anchorAncestorElement.parentElement;
        }
        let focusAncestorElement: Element | null = selection.focusNode?.parentElement || null;
        let isFocusContainedByElement = false;
        while (focusAncestorElement) {
            ancestry.focus.unshift(focusAncestorElement);
            if (focusAncestorElement.id === root.id) {
                isFocusContainedByElement = true;
                break;
            }
            focusAncestorElement = focusAncestorElement.parentElement;
        }
        if (isAnchorContainedByElement && isFocusContainedByElement && selection.rangeCount > 0) {
            let range = selection.getRangeAt(0);
            // let preCaretRange = range.cloneRange();
            // preCaretRange.selectNodeContents(root);
            // preCaretRange.setEnd(range.startContainer, range.startOffset);
            // caretPosition.start = preCaretRange.toString().length;
            // preCaretRange.setEnd(range.endContainer, range.endOffset);
            // caretPosition.end = preCaretRange.toString().length;
            const parentElement = range.endContainer.parentElement;
            if (parentElement) {
                const prefixText = range.endContainer.textContent?.slice(0, range.endOffset) || '';
                const postfixText = range.endContainer.textContent?.slice(range.endOffset) || '';
                // remove it from it's previous location, if anywhere
                if (blinkingCursor.parentElement) {
                    blinkingCursor.parentElement.removeChild(blinkingCursor);
                }
                // replace the text with the cursor
                parentElement.replaceChild(blinkingCursor, range.endContainer);
                // restore the text to either side
                blinkingCursor.insertAdjacentText('beforebegin', prefixText);
                blinkingCursor.insertAdjacentText('afterend', postfixText);
            }
            // console.log(`proposed cursor: ${range.endContainer.textContent?.slice(0, range.endOffset)}${blinkingCursor.outerHTML}${range.endContainer.textContent?.slice(range.endOffset)}`);
            // range.endContainer.parentElement?.replaceChild()
        } else console.log(`isAnchorContainedByElement: ${isAnchorContainedByElement}, isFocusContainedByElement: ${isFocusContainedByElement}, selectionRangeCount: ${selection.rangeCount}`);
    }
};

export const placeCaretAfterTextNode = (textNode: Node, blinkingCursor: Element) => {
    if (blinkingCursor.parentElement) blinkingCursor.remove();
    const textParent = textNode.parentElement;
    if (!textParent) return;
    textParent.replaceChild(blinkingCursor, textNode);
    textParent.insertBefore(textNode, blinkingCursor);
};

