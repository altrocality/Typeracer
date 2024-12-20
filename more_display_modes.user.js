// ==UserScript==
// @name         Typeracer: More Display Modes
// @namespace    http://tampermonkey.net/
// @version      1.4.1
// @downloadURL  https://raw.githubusercontent.com/altrocality/Typeracer/master/more_display_modes.user.js
// @updateURL    https://raw.githubusercontent.com/altrocality/Typeracer/master/more_display_modes.user.js
// @description  Adds tape mode, line scroll, and more.
// @author       altrocality
// @match        https://play.typeracer.com/*
// @match        https://staging.typeracer.com/*
// @icon         https://www.google.com/s2/favicons?domain=typeracer.com
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @noframes
// ==/UserScript==

const defaults = {
    plusEnable: false,
    plusLength: 3,
    hideTypedEnable: false,
    scrollEnable: false,
    tapeEnable: true,
    extraTypoColorEnable: false,
    extraTypoColor: '#ff0000',
    correctColorEnable: false,
    correctColor: '#99CC00',
    typoColorEnable: false,
    typoColor: '#803333',
    noHighlighting: false
}
let plusEnable, plusLength, hideTypedEnable, scrollEnable, tapeEnable, extraTypoColorEnable, extraTypoColor, correctColorEnable, correctColor, typoColorEnable, typoColor, noHighlighting;

// config from https://github.com/PoemOnTyperacer/tampermonkey/blob/master/better_countdown.user.js ty :D
let GUITimeout;
loadSettings();
addConfig();

function loadSettings() {
    plusEnable = GM_getValue('plusEnable', defaults.plusEnable);
    plusLength = parseInt(GM_getValue('plusLength', defaults.plusLength));
    hideTypedEnable = GM_getValue('hideTypedEnable', defaults.hideTypedEnable);
    scrollEnable = GM_getValue('scrollEnable', defaults.scrollEnable);
    tapeEnable = GM_getValue('tapeEnable', defaults.tapeEnable);
    extraTypoColorEnable = GM_getValue('extraTypoColorEnable', defaults.extraTypoColorEnable);
    extraTypoColor = GM_getValue('extraTypoColor', defaults.extraTypoColor);
    correctColorEnable = GM_getValue('correctColorEnable', defaults.correctColorEnable);
    correctColor = GM_getValue('correctColor', defaults.correctColor);
    typoColorEnable = GM_getValue('typoColorEnable', defaults.typoColorEnable);
    typoColor = GM_getValue('typoColor', defaults.typoColor);
    noHighlighting = GM_getValue('noHighlighting', defaults.noHighlighting);
}

function addConfig() {
    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand("More Display Modes Menu", openConfig, 'X');
    }
}

function openConfig() {
    // Prevent multiple instances
    if (document.getElementById('moreDisplayModesConfig')) return;

    let div = document.createElement("div");
    div.id = 'moreDisplayModesConfig';
    div.style = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
    div.innerHTML = `
            <div style="background: #222; padding: 20px; border-radius: 10px; text-align: center;">
                <h2>More Display Modes</h2>
                <br>
                <label ${!scrollEnable ? '' : 'style="opacity: 0.5; pointer-events:none!important;"'}>
                    <input type="checkbox" id="tapeOption" ${tapeEnable ? 'checked' : ''}>
                    <b>Tape Mode</b> - One line of text that smoothly scrolls by letter
                </label>
                <br><br>
                <label ${!tapeEnable ? '' : 'style="opacity: 0.5; pointer-events:none!important;"'}>
                    <input type="checkbox" id="scrollOption" ${scrollEnable ? 'checked' : ''}>
                    <b>Line Scroll</b> - Scroll to the next line once you reach it
                </label>
                <br><br>
                <label>
                    <input type="checkbox" id="plusOption" ${plusEnable ? 'checked' : ''}>
                    <b>Plus Mode</b> - Show the current and next
                    <input type="number" id="plusLengthOption" style=width:3em value=${plusLength}>
                     words
                </label>
                <br><br>
                <label>
                    <input type="checkbox" id="hideOption" ${hideTypedEnable ? 'checked' : ''}>
                    <b>Hide Typed</b> - Hide correctly typed words
                </label>
                <br><br>
                <label>
                    <input type="checkbox" id="colorEnableOption" ${correctColorEnable ? 'checked' : ''}>
                    <b>Set Correct Color</b>
                    <input type="color" id="correctColorPicker" value=${correctColor}>
                 </label>
                 <br><br>
                 <label>
                    <input type="checkbox" id="typoColorEnableOption" ${typoColorEnable ? 'checked' : ''}>
                    <b>Set Typo Color</b>
                    <input type="color" id="typoColorPicker" value=${typoColor}>
                 </label>
                 <br><br>
                 <label>
                    <input type="checkbox" id="extraTypoColorOption" ${extraTypoColorEnable ? 'checked' : ''}>
                    <b>Extra typo color</b> (Auto enabled with tape mode)
                    <input type="color" id="extraTypoColorPicker" value=${extraTypoColor}>
                </label>
                <br><br>
                <label>
                    <input type="checkbox" id="noHighlightingOption" ${noHighlighting ? 'checked' : ''}>
                    <b>No Typo Highlighting</b>
                 </label>
                 <br><br>
                <button id="saveBtn" text-align: center>Save</button>
                <button id="closeBtn">Close</button>
            </div>
        `;
    document.body.appendChild(div);

    const tapeBox = document.getElementById('tapeOption');
    const scrollBox = document.getElementById('scrollOption');
    tapeBox.onchange = toggleBlocked;
    scrollBox.onchange = toggleBlocked;

    function toggleBlocked() {
        const tapeLabel = tapeBox.parentNode;
        const scrollLabel = scrollBox.parentNode;
        // Grey out tape mode if line scroll selected
        if (scrollBox.checked) {
            tapeLabel.style.opacity = '0.5';
            tapeLabel.style.pointerEvents = 'none';
        } else {
            tapeLabel.style.opacity = '1';
            tapeLabel.style.pointerEvents = '';
        }
        // Grey out line scroll if tape mode selected
        if (tapeBox.checked) {
            scrollLabel.style.opacity = '0.5';
            scrollLabel.style.pointerEvents = 'none';
        } else {
            scrollLabel.style.opacity = '1';
            scrollLabel.style.pointerEvents = '';
        }
    }
    document.getElementById("saveBtn").addEventListener("click", saveSettings);
    document.getElementById("closeBtn").addEventListener("click", closeConfig);
}

function saveSettings() {
    tapeEnable = document.getElementById("tapeOption").checked;
    extraTypoColorEnable = document.getElementById("extraTypoColorOption").checked;
    extraTypoColor = document.getElementById("extraTypoColorPicker").value;
    scrollEnable = document.getElementById("scrollOption").checked;
    plusEnable = document.getElementById("plusOption").checked;
    plusLength = parseInt(document.getElementById("plusLengthOption").value);
    hideTypedEnable = document.getElementById("hideOption").checked;
    correctColorEnable = document.getElementById("colorEnableOption").checked;
    correctColor = document.getElementById("correctColorPicker").value;
    typoColorEnable = document.getElementById("typoColorEnableOption").checked;
    typoColor = document.getElementById("typoColorPicker").value;
    noHighlighting = document.getElementById('noHighlightingOption').checked;

    GM_setValue('tapeEnable', tapeEnable);
    GM_setValue('extraTypoColorEnable', extraTypoColorEnable);
    GM_setValue('extraTypoColor', extraTypoColor);
    GM_setValue('scrollEnable', scrollEnable);
    GM_setValue('plusEnable', plusEnable);
    GM_setValue('plusLength', plusLength);
    GM_setValue('hideTypedEnable', hideTypedEnable);
    GM_setValue('correctColorEnable', correctColorEnable);
    GM_setValue('correctColor', correctColor);
    GM_setValue('typoColorEnable', typoColorEnable);
    GM_setValue('typoColor', typoColor);
    GM_setValue('noHighlighting', noHighlighting);

    document.getElementById("saveBtn").innerText = "Saved!";
    clearTimeout(GUITimeout);
    GUITimeout = setTimeout(function() {
        let saveEl=document.getElementById("saveBtn");
        if(saveEl==null) return;
        saveEl.innerText = "Save";
    },1500);
}

function closeConfig() {
    let div = document.getElementById('moreDisplayModesConfig');
    if (div) {
        div.parentNode.removeChild(div);
    }
}

let racing = false;
let textDiv;
let textSpans;
let switchedToMain = false;
let plusHeight;
let firstEntry;

let tapeHeight;
let tapeInitShift;
let normalStyle = {
    color: '',
    backgroundColor: ''
};
let animationId;
let start;
let dest;
let prevDest;
let prevTime;
const duration = 90;

let caret;
let caretPosition;
let interval;

let lineScrollHeight;
let lineShift;
let lineHeight;
let doScroll;
let lines;
let currLine;
let oldTop;

let wordPos;
let currWord;
let extraTypoChars = [];
let firstWord = true;

const newTheme = typeof com_typeracer_redesign_Redesign === "function";
const monitorRace = new MutationObserver(doMode);
const monitorCaret = new MutationObserver(fixCaret);

// for poem's smooth caret
function fixCaret() {
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const caretLeft = textDiv.parentNode.getBoundingClientRect().left + scrollX + tapeInitShift;
    caret.style.left = `${caretLeft}px`;
}

// for static replicas of native smooth caret and default non-smooth caret
function fixCaretPos(caret) {
    if (caret.style.top !== textDiv.offsetTop) {
        caret.style.top = `${textDiv.offsetTop}px`;
    }
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const caretLeft = textDiv.parentNode.getBoundingClientRect().left + scrollX + tapeInitShift;
    caret.style.left = `${caretLeft}px`;
}

function positionCaret(caret) {
    const charRect = textSpans[0].getBoundingClientRect();
    caret.style.position = 'absolute';
    caret.style.zIndex = '1000';
    caret.style.top = `${charRect.top}px`;
    caret.style.left = `${charRect.left}px`;
    if (!interval) {
        setInterval(fixCaretPos, 1, caret);
    }
}

// Static default caret
function createDCaret() {
    for (const span of textSpans) {
        span.style.backgroundImage = 'none';
    }
    let defaultCaret = document.getElementById('defaultCaret');
    if (!defaultCaret) {
        defaultCaret = document.createElement('div');
        defaultCaret.id = 'defaultCaret';
        document.body.prepend(defaultCaret);

        defaultCaret.style.backgroundImage = "url('data:image/gif;base64,R0lGODdhAQAoAIABAERmZv///ywAAAAAAQAoAAACBYSPqctYADs=')";
        const charRect = textSpans[0].getBoundingClientRect();
        defaultCaret.style.width = `${1}px`;
        defaultCaret.style.height = `${Math.floor(charRect.height)}px`;
        positionCaret(defaultCaret);
    }
}

// Static native smooth caret
function createSCaret() {
    let stillCaret = document.getElementById('stillCaret');
    if (!stillCaret) {
        document.body.insertAdjacentHTML('afterbegin', `<div id="stillCaret"></div>`);
        stillCaret = document.getElementById('stillCaret');
        const caretStyle = window.getComputedStyle(caret);
        caret.style.display = 'none'; // hide inbuilt smooth caret

        const charRect = textSpans[0].getBoundingClientRect();
        stillCaret.style.width = '2.4px';
        stillCaret.style.height = `${Math.floor(charRect.height)}px`;
        stillCaret.style.background = caretStyle.backgroundColor;
        positionCaret(stillCaret);
    }
}

function removeCaret(removeCaret) {
    if (removeCaret) {
        removeCaret.remove();
    }
}

function getCurrSpanIndex() {
    const numTyped = getNumTyped();
    let numCovered = 0;
    let i = 0;
    while (numCovered < numTyped && i < textSpans.length) {
        numCovered += textSpans[i].textContent.length;
        i++;
    }
    return i;
}

function getTapeShift() {
    let bound = getCurrSpanIndex();
    if (document.getElementsByClassName('extra typos')[0]) {
        bound = Array.from(textSpans).findIndex((span) => span.className === 'extra typos')+1;
    }
    let tapeShiftAdjust = 0;
    if (wordPos !== 0) {
        for (let i = 0; i < bound; i++) {
            tapeShiftAdjust += textSpans[i].getBoundingClientRect().width;
        }
    }
    return tapeInitShift - tapeShiftAdjust;
}

function createSpan(name, text, position, color, backgroundColor, append) {
    const textNode = document.createTextNode(text);
    const span = document.createElement('span');
    span.appendChild(textNode);
    if (append) {
        position.parentNode.insertBefore(span, position.nextSibling);
    } else {
        position.parentNode.insertBefore(span, position);
    }
    span.className = name;
    if (color) {
        span.style.color = color;
    }
    if (backgroundColor) {
        if (isCtrlA() !== -1) {
            backgroundColor = window.getComputedStyle(textSpans[isCtrlA()]).backgroundColor;
        }
        span.style.backgroundColor = backgroundColor;
    }
    const textDecorationIndex = firstWord ? 0 : 1;
    span.style.textDecoration = window.getComputedStyle(textSpans[textDecorationIndex]).textDecoration;
    span.style.textDecorationColor = color;
}

function getQuoteLength() {
    let numChars = 0;
    for (const line of lines) {
        numChars += line.text.length;
    }
    return numChars;
}

function getNumTyped() {
    if (wordPos === 0) return 0;
    let numTyped = document.getElementsByClassName('txtInput')[0];
    if (!numTyped) return;
    numTyped = numTyped.value.length;
    if (!firstWord) {
        numTyped += textSpans[0].textContent.length;
    }
    return numTyped;
}

function isCtrlA() {
    return Array.from(textSpans).findIndex((span) => span.className.split(' ').length-1 === 3);
}

function handleExtraTypos() {
    // Gets index to insert extraTypos before
    let typoStyle;
    let i = getCurrSpanIndex()-1;

    // Index when ctrlA
    const ctrlA = isCtrlA();
    if (ctrlA !== -1) {
        // gets index of span that the ends ctrlA highlighting
        let numCovered = 0;
        let j = ctrlA;
        while (numCovered < currWord.length) {
            numCovered += textSpans[j].textContent.length;
            j++;
        }
        i = j;
    }

    // When currWord ends in comma or semicolon, reformat textSpans to either separate or append the special character
    if (currWord.endsWith(',') || currWord.endsWith(';')) {
        let index = Array.from(textSpans).findIndex((span) => span.textContent.startsWith(',') || span.textContent.startsWith(';'));
        if (index !== -1) {
            i = index;
            if (wordPos === 9) {
                // Typo at the comma or semicolon, appending the comma to the previous span wont have the correct style
                // Create new span with only the comma/semicolon with the correct typo style
                if (!document.getElementsByClassName('singleChar')[0]) {
                    typoStyle = window.getComputedStyle(textSpans[i]);
                    createSpan('singleChar', textSpans[i].textContent[0], textSpans[i], typoStyle.color, typoStyle.backgroundColor);
                    // Remove comma/semicolon from original span
                    i++;
                    textSpans[i].textContent = textSpans[i].textContent.slice(1);
                }
            } else if (wordPos === 10) {
                i++;
            } else {
                const prevSpan = textSpans[i-1];
                // Avoids addding multiple special chars to the end of prevSpan when extraTypos starts with a special char
                if (!(prevSpan.textContent.endsWith(',') || prevSpan.textContent.endsWith(';'))) {
                    prevSpan.textContent += textSpans[i].textContent[0];
                    textSpans[i].textContent = textSpans[i].textContent.slice(1);
                }
            }
        }
    }

    // Setting extraTypoColor when not in tape mode
    if (!tapeEnable && extraTypoColorEnable) {
        if (!document.getElementsByClassName('colored extra typos')[0]) {
            textSpans[i].className = 'colored extra typos';
            textSpans[i].style.color = extraTypoColor;
            textSpans[i].style.backgroundColor = window.getComputedStyle(textSpans[i-1]).backgroundColor;
        }
        // making sure ctrlA highlighting is covered in extraTypos
        const ctrlA = isCtrlA();
        if (ctrlA !== -1 && noHighlighting) {
            textSpans[i].style.backgroundColor = window.getComputedStyle(textSpans[ctrlA]).backgroundColor;
        }
        return;
    }

    // Insert extraTypos
    if (i > textSpans.length-1) {
        i = textSpans.length-1;
    }

    const oldExtraTypos = textSpans[i];
    if (!oldExtraTypos) return;
    typoStyle = window.getComputedStyle(oldExtraTypos);
    const lastLineWords = lines[lines.length-1].text.split(' ');
    const lastWord = lastLineWords[lastLineWords.length-1];

    if (!document.getElementsByClassName('extra typos')[0]) {
        if (!textSpans[textSpans.length-1].textContent.includes(' ')) {
            // old extra typos reaches last word span
            const lastSpan = textSpans[textSpans.length-1];
            if (lastSpan.textContent !== lastWord && textSpans[textSpans.length-1].textContent.endsWith(' ')) {
                lastSpan.textContent = lastWord;
                textSpans[textSpans.length-2].textContent = '';
            }
        }
        const numTyped = getNumTyped();
        const quoteLength = getQuoteLength();
        if (numTyped > quoteLength && currWord === lastWord) { // extra typo on last word so append
            createSpan('extra typos', extraTypoChars, oldExtraTypos, extraTypoColor, typoStyle.backgroundColor, true);
        } else {
            createSpan('extra typos', extraTypoChars, oldExtraTypos, extraTypoColor, typoStyle.backgroundColor);
            oldExtraTypos.style.color = normalStyle.color;
            oldExtraTypos.style.backgroundColor = normalStyle.backgroundColor;
        }
    }
}

function applyTapeShift(time) {
    if (!tapeEnable) {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        return;
    }

    if (!prevTime) {
        prevTime = time;
    }
    const frameLength = time - prevTime;

    if (frameLength > duration) { // restarting
        prevTime = null;
        animationId = requestAnimationFrame(applyTapeShift);
        return;
    }

    const numFrames = frameLength / duration;
    if (numFrames === 0) {
        cancelAnimationFrame(animationId);
    }

    const incr = (dest - start) * numFrames;
    start += incr;
    textDiv.style.left = `${start}px`;
    prevTime = time;

    if (Math.abs(start - dest).toFixed(2) > 0) {
        animationId = requestAnimationFrame(applyTapeShift);
    } else {
        cancelAnimationFrame(animationId);
    }
}

function tapeMode() {
    if (wordPos >= 7) {
        handleExtraTypos();
    }

    dest = getTapeShift();
    start = parseInt(window.getComputedStyle(textDiv).left);

    if (Math.floor(start) !== Math.floor(dest)) {
        animationId = requestAnimationFrame(applyTapeShift);
    }
    prevDest = dest;
}

function plusMode() {
    const remainingSpan = textSpans[textSpans.length-1];
    const numRemaining = (remainingSpan.textContent.match(/ /g)||[]).length;
    if (plusLength >= numRemaining) {
        return;
    }
    remainingSpan.style.visibility = "hidden";

    const currPos = textSpans[textSpans.length-2];
    if (!currPos) return;
    let plusWords = remainingSpan.textContent.split(" ", plusLength+1).join(" ")+" ";
    let newTextNode = document.createTextNode(plusWords);

    if (currPos.textContent !== plusWords) {
        const newSpan = document.createElement("span");
        if (currPos.textContent == " ") {
            newTextNode = document.createTextNode(remainingSpan.textContent.split(" ", plusLength).join(" ")+" ");
            newSpan.appendChild(newTextNode);
            currPos.parentNode.insertBefore(newSpan, currPos.nextSibling);
            newSpan.className = `plus${plusLength}`;
        }
        if ((currPos.textContent.match(/ /g)||[]).length != plusLength) {
            newSpan.appendChild(newTextNode);
            currPos.parentNode.insertBefore(newSpan, currPos.nextSibling);
            newSpan.className = `plus${plusLength}`;
        }
    }
}

function doHideTyped(wordPos) {
    if (!firstWord) {
        textSpans[0].style.visibility = "hidden";
    }
}

function lineScroll() {
    if (currLine === lines.length-1 || firstWord) return;

    const nodes = grabTextNodes(textDiv);
    const currNode = nodes[getCurrSpanIndex()];
    const endNode = nodes[nodes.length-1];
    const range = document.createRange();

    range.setStart(currNode, 0);
    range.setEnd(endNode, 0);
    const currTop = range.getBoundingClientRect().top;
    const typo = document.getElementsByClassName('txtInput txtInput-error')[0];

    if (Math.floor(currTop - oldTop) === Math.floor(lineHeight) && !typo && wordPos !== 3) {
        textDiv.style.top = `${lineShift}px`;
        lineShift -= lineHeight;
        currLine++;
    }
    if (!typo && wordPos !== 3) {
        oldTop = currTop;
    }
}

function setCorrectColor() {
    if (wordPos === 0) return;
    if (firstWord && (wordPos === 4 || wordPos === 7)) return;
    let currCorrColor = window.getComputedStyle(textSpans[0]).color;
    for (let i = 0; i < textSpans.length; i++) {
        const color = window.getComputedStyle(textSpans[i]).color;
        if (color !== currCorrColor) break;
        textSpans[i].style.color = correctColor;
    }
}

function setTypoColor() {
    if (wordPos <= 3) return;
    if (tapeEnable && wordPos === 10) return;

    let typoIndex = Array.from(textSpans).findIndex((span) => span.className === 'extra typos')-1;
    if (typoIndex <= -1) {
        typoIndex = getCurrSpanIndex()-1;
    }
    const style = window.getComputedStyle(textSpans[typoIndex]);
    for (let i = 0; i <= textSpans.length-1; i++) {
        const color = window.getComputedStyle(textSpans[i]).color;
        if (color === style.color && textSpans[i].className !== 'colored extra typos') {
            textSpans[i].style.color = typoColor;
        }
    }
}

function setExtraTypoColor() {
    if (tapeEnable) return;
    if (wordPos >= 7) {
        handleExtraTypos();
    }
}

function setNoHighlight() {
    if (isCtrlA() !== -1) return;
    for (const span of textSpans) {
        span.style.backgroundColor = normalStyle.backgroundColor;
    }
}

function getCurrWord() {
    currWord = '';
    // First word
    if (!textSpans[0].textContent.includes(' ') || textSpans[0].textContent.length === 1) {
        currWord = textSpans[0].textContent;
    }

    for (let i = 1; i <= textSpans.length-1; i++) {
        let currSpan = textSpans[i];
        if (currSpan.className === 'extra typos' || currSpan.className === `plus${plusLength}`) break;
        if (currSpan.textContent.startsWith(' ')) break;
        if (currSpan.textContent.startsWith(',') || currSpan.textContent.startsWith(';')) {
            currWord += currSpan.textContent[0];
            break;
        } else {
            currWord += currSpan.textContent;
        }
    }
    return currWord;
}

function findFirstDiffIndex(a, b) {
    if (a === b) return -1;
    let i = 0;
    while (a[i] === b[i]) i++;
    return i;
}

function getPos() {
    /*
    0 - start of quote
    1 - beginning of word
    2 - middle of word no typo
    3 - end of word
    4 - typo from start of word
    5 - typo from middle of word
    6 - typo at end of word
    7 - typo from start and beyond word length
    8 - typo from middle and beyond word length
    9 - typo at end and beyond word length
    10 - new typo beyond word length
*/
    let currWordAttempt = document.getElementsByClassName('txtInput')[0];
    if (!currWordAttempt) return wordPos;
    currWordAttempt = currWordAttempt.value;
    if (currWordAttempt === 'Type the above text here when the race begins') return 0;
    if (currWordAttempt.length === 0) {
        if (!textSpans[0].textContent.includes(' ')) return 0;
        firstWord = false;
        return 1;
    }

    let position = findFirstDiffIndex(currWordAttempt, currWord.substr(0, currWordAttempt.length));
    if (currWordAttempt.length < currWord.length) {
        if (position === -1) return 2;
        if (position === 0) return 4;
        return 5;
    }
    if (currWordAttempt.length === currWord.length) {
        if (position === -1) return 3;
        if (position === 0) return 4;
        if (position < currWord.length-1) return 5;
        return 6;
    }
    if (currWordAttempt.length > currWord.length) {
        extraTypoChars = currWordAttempt.substr(currWord.length).replaceAll(' ', '_');
        if (position === 0) return 7;
        if (position < currWord.length-1) return 8;
        if (position === currWord.length-1) return 9;
        return 10;
    }
}

// https://stackoverflow.com/questions/55604798/find-rendered-line-breaks-with-javascript
function grabTextNodes(elem) {
    const walker = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }
    return nodes;
}

function getLineBreaks(elem) {
    const range = document.createRange();
    lines = [];
    const nodes = grabTextNodes(elem);
    // The last node contains the text, previous nodes contain first word
    const node = nodes[nodes.length-1];
    range.setStart(node, 0);
    let contTop = node.parentNode.getBoundingClientRect().top;
    // initial position
    let prevTop = range.getBoundingClientRect().top;
    let str = node.textContent;
    let lastFound = 0;
    let top = 0;
    for (let curr = 1; curr < str.length; curr++) {
        range.setStart(node, curr);
        range.setEnd(node, curr+1);
        top = range.getBoundingClientRect().top;
        if (top > prevTop) {
            let lineText = '';
            if (lines.length === 0) { // first line so add first word
                for (let i = 0; i < nodes.length-1; i++) {
                    lineText += nodes[i].textContent;
                }
            }
            lineText += str.substr(lastFound, curr - lastFound);
            lines.push({
                y: prevTop - contTop,
                text: lineText
            });
            prevTop = top;
            lastFound = curr;
        }
    }
    // push last line
    lines.push({
        y: top - contTop,
        text: str.substr(lastFound)
    });
    return lines;
}

function setHeight(n) {
    lineHeight = lines[1].y - lines[0].y;
    return n * lineHeight;
}

function doMode() {
    let height;
    if (tapeEnable) {
        height = tapeHeight;
    } else if (doScroll) {
        height = lineScrollHeight;
    } else if (plusEnable) {
        height = plusHeight;
    }
    textDiv.style.height = `${height}px`;
    textDiv.style.position = 'relative';
    textDiv.style.visibility = "visible";

    currWord = getCurrWord();
    wordPos = getPos()

    if (tapeEnable) {
        if (document.getElementsByClassName('lightLabel')[0] || !firstEntry) { // finding caret in lobby or ghost track
            caret = document.getElementById('caret') || document.getElementById('smoothCaret');
            if (!caret) { // no smooth caret
                removeCaret(document.getElementById('stillCaret'));
                createDCaret();
            } else if (caret.id === 'caret') { // poem's smooth caret
                monitorCaret.observe(caret, {attributes: true});
            } else if (caret.id === 'smoothCaret') { // native smooth caret
                removeCaret(document.getElementById('defaultCaret'));
                createSCaret();
            }
        }
        tapeMode();
    }
    if (plusEnable) {
        plusMode();
    }
    if (hideTypedEnable) {
        doHideTyped();
    }
    if (doScroll) {
        lineScroll();
    }
    if (correctColorEnable) {
        setCorrectColor();
    }
    if (typoColorEnable) {
        setTypoColor();
    }
    if (extraTypoColorEnable) {
        setExtraTypoColor();
    }
    if (noHighlighting) {
        setNoHighlight();
    }
    firstEntry = false;
}

function raceStart() {
    racing = true;
    firstEntry = true;
    textDiv = document.querySelector('.inputPanel tbody tr td table tbody tr td div');
    textSpans = textDiv.childNodes[0].childNodes;
    lines = getLineBreaks(textDiv);
    const textStyle = window.getComputedStyle(textSpans[textSpans.length-1]);
    normalStyle = {
        color: textStyle.color,
        backgroundColor: textStyle.backgroundColor
    };
    if (tapeEnable) {
        tapeHeight = lines.length === 1 ? -1 : setHeight(1);
        const textDivWidth = textDiv.getBoundingClientRect().width;
        textDiv.style.width = `${textDivWidth}px`;
        if (newTheme) {
            tapeInitShift = 0.46*textDivWidth + textSpans[0].getBoundingClientRect().width;
        } else {
            tapeInitShift = 0.4*textDivWidth + textSpans[0].getBoundingClientRect().width;
        }
        caretPosition = textDiv.getBoundingClientRect().left + tapeInitShift;
        document.body.style.overflowY = 'hidden';
        document.body.style.overflowX = 'hidden';
        textDiv.style.left = `${tapeInitShift}px`;
        textDiv.style.whiteSpace = 'nowrap';
        textDiv.parentNode.style.overflowY = 'hidden';
        textDiv.parentNode.style.overflowX = 'hidden';
        textDiv.parentNode.style.maskImage = `linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 1) 90%, rgba(0, 0, 0, 0) 100%)`; // side fade out
    }
    if (scrollEnable) {
        doScroll = lines.length >= 3 ? true : false;
        lineScrollHeight = doScroll ? setHeight(3) : -1;
        lineShift = 0;
        currLine = 0;
        textDiv.children[0].style.marginTop = '0px';
        textDiv.parentNode.style.marginTop = '0px';
        textDiv.parentNode.style.paddingTop = '0px';
        textDiv.parentNode.style.overflowY = 'clip';
        textDiv.style.transition = 'top 0.2s ease';
    }
    if (plusEnable) {
        plusHeight = textDiv.getBoundingClientRect().height;
    }
    doMode();
    monitorRace.observe(textDiv, {subtree: true, childList: true});
}

function raceEnd() {
    monitorRace.disconnect();
    monitorCaret.disconnect();
    racing = false;
    tapeHeight = -1;
    lineScrollHeight = -1;
    plusHeight = -1;
    wordPos = 0;
    firstWord = true;
    prevTime = null;
    const caretToRemove = document.getElementById('defaultCaret') || document.getElementById('stillCaret');
    removeCaret(caretToRemove);
    clearInterval(interval);
}

// Detecting game status
var observer = new MutationObserver(() => {
    // Modified from github.com/PoemOnTyperacer/tampermonkey/blob/master/pacemaker.user.js lines 321-339 tyyyy :)
    let gameStatusLabels = document.getElementsByClassName('gameStatusLabel');
    let gameStatus = ((gameStatusLabels || [])[0] || {}).innerHTML || '';
    if (!racing && (gameStatusLabels.length > 0 && (gameStatus == 'Go!' || gameStatus.startsWith('The race is on') || gameStatus == 'The race is about to start!'))) {
        let practiceTitleEl = document.getElementsByClassName('roomSection')[0];
        if(practiceTitleEl && practiceTitleEl.innerText.startsWith('Practice')) {
            if (!switchedToMain) {
                raceStart();
            }
            if (newTheme) {
                document.getElementsByClassName('gwt-Anchor')[3].addEventListener('click', function () {
                    raceEnd();
                    switchedToMain = true;
                });
            } else {
                document.getElementsByClassName('gwt-Anchor')[4].addEventListener('click', function () {
                    raceEnd();
                    switchedToMain = true;
                });
            }
        } else {
            // In a public lobby
            switchedToMain = false;
            const countdown = document.getElementsByClassName('countdownPopup horizontalCountdownPopup')[0];
            let time;
            if (countdown) {
                time = countdown.getElementsByClassName('time')[0];
                time = parseInt(time.textContent.substr(-1));
            }
            if (time <= 3) {
                if (!(time === 0 && document.getElementsByClassName('txtInput txtInput-unfocused')[0].value === 'Type the above text here when the race begins')) {
                    raceStart();
                }
            }
        }
    }
    const rankLabels = document.getElementsByClassName('rank')[0];
    if(racing && ((gameStatusLabels.length==0) || (rankLabels && (rankLabels.innerText === 'Done!' || rankLabels.innerText.includes('Place'))))) {
        raceEnd();
    }
});
observer.observe(document, {childList: true, subtree: true});
