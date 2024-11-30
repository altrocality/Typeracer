// ==UserScript==
// @name         Typeracer: More Display Modes
// @namespace    http://tampermonkey.net/
// @version      1.3.8
// @downloadURL  https://raw.githubusercontent.com/altrocality/Typeracer/master/more_display_modes.user.js
// @updateURL    https://raw.githubusercontent.com/altrocality/Typeracer/master/more_display_modes.user.js
// @description  Adds plus mode, line scroll and more.
// @author       altrocality
// @match        https://play.typeracer.com/*
// @match        https://staging.typeracer.com/*
// @icon         https://www.google.com/s2/favicons?domain=typeracer.com
// @noframes
// ==/UserScript==
const settings = {
    plusEnable: false,
    plusLength: 3,
    hideTyped: false,
    lineScroll: true,
    correctColor: ''
};

let racing = false;
let textDiv;
let textSpans;
let plusHeight;
let lineScrollHeight;
let switchedToMain = false;

let lineShift;
let lineHeight;
let doScroll;
let lines;
let currLine;
let wordIndex;

let wordPos = -1;
let currWord;
let extraTypoChars = [];
let firstWord = true;

const newTheme = typeof com_typeracer_redesign_Redesign === "function";

const monitorRace = new MutationObserver(doMode);

function getNumTyped() {
    if (wordPos === 0) return 0;
    let numTyped = document.getElementsByClassName('txtInput')[0].value.length;
    if (!firstWord) {
        numTyped += textSpans[0].textContent.length;
    }
    return numTyped;
}

function getCurrSpanIndex() {
    const numTyped = getNumTyped();
    let numCovered = 0;
    let index;
    for (let i = 0; numCovered < numTyped; i++) {
        numCovered += textSpans[i].textContent.length;
        index = i;
    }
    return index + 1;
}

function plusMode() {
    const remainingSpan = textSpans[textSpans.length-1];
    const numRemaining = (remainingSpan.textContent.match(/ /g)||[]).length;
    if (settings.plusLength >= numRemaining) {
        return;
    }
    remainingSpan.style.visibility = "hidden";

    const currPos = textSpans[textSpans.length-2];
    let plusWords = remainingSpan.textContent.split(" ", settings.plusLength+1).join(" ")+" ";
    let newTextNode = document.createTextNode(plusWords);

    if (currPos.textContent !== plusWords) {
        const newSpan = document.createElement("span");
        if (currPos.textContent == " ") {
            newTextNode = document.createTextNode(remainingSpan.textContent.split(" ", settings.plusLength).join(" ")+" ");
            newSpan.appendChild(newTextNode);
            currPos.parentNode.insertBefore(newSpan, currPos.nextSibling);
            newSpan.className = `plus${settings.plusLength}`;
        }
        if ((currPos.textContent.match(/ /g)||[]).length != settings.plusLength) {
            newSpan.appendChild(newTextNode);
            currPos.parentNode.insertBefore(newSpan, currPos.nextSibling);
            newSpan.className = `plus${settings.plusLength}`;
        }
    }
}

function hideTyped(wordPos) {
    if (!firstWord) {
        textSpans[0].style.visibility = "hidden";
    }
}

function lineScroll() {
    if (currLine === lines.length-1) return;
    let numWords = lines[currLine].text.trim().split(/\s+/).length;
    if (wordPos === 1 && (currWord = getCurrWord(currWord, wordPos)) === lines[currLine].text.split(' ')[wordIndex]) {
        wordIndex++;
    }
    const nextFirstWord = lines[currLine+1].text.split(' ')[0];
    let halfWord;
    const typo = document.getElementsByClassName('txtInput txtInput-error')[0];
    if (currWord.includes('-') && textSpans[getCurrSpanIndex()-1].textContent.endsWith('-') && !typo) {
        halfWord = currWord.split('-')[1];
        if (halfWord === nextFirstWord) {
            wordIndex++;
        }
    }
    if (wordIndex === numWords && (halfWord ? halfWord : currWord) === nextFirstWord) {
        textDiv.style.top = `${lineShift}px`;
        lineShift -= lineHeight;
        currLine++;
        wordIndex = 1;
    }
}

function setCorrectColor() {
    if (wordPos === 0) return;
    if (firstWord && (wordPos === 4 || wordPos === 7)) return;

    let currCorrColor = window.getComputedStyle(textSpans[0]).color;
    for (let i = 0; i < textSpans.length; i++) {
        let color = window.getComputedStyle(textSpans[i]).color;
        if (color !== currCorrColor) break;
        textSpans[i].style.color = settings.correctColor;
    }
}

function getCurrWord(currWord, wordPos) {
    if (wordPos > 1) return currWord;
    currWord = '';
    if (!textSpans[0].textContent.includes(' ') || textSpans[0].textContent.length === 1) {
        currWord = textSpans[0].textContent;
    }

    let maxIndex = textSpans.length-1;
    // Avoids including the 'plusN' span in forming currWord
    if (document.getElementsByClassName(`plus${settings.plusLength}`)[0]) {
        maxIndex--;
    }

    for (let i = 1; i < maxIndex; i++) {
        let currSpan = textSpans[i];
        if (currSpan.textContent.includes(' ')) break;
        currWord += textSpans[i].textContent;
    }
    const remainingText = textSpans[textSpans.length-1].textContent;
    if (remainingText.startsWith(',') || remainingText.startsWith(';')) {
        currWord += remainingText[0];
    }
    return currWord;
}

function getPos(currWord, wordPos) {
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

    let typo = document.getElementsByClassName('txtInput txtInput-error')[0];
    let currWordAttempt = document.getElementsByClassName('txtInput')[0].value;
    if (currWordAttempt === 'Type the above text here when the race begins') return 0;

    if (typo) {
        if (currWordAttempt.length > currWord.length) {
            extraTypoChars = currWordAttempt.substr(currWord.length);
            if (wordPos === 4 || wordPos === 7) return 7;
            if (wordPos === 5 || wordPos === 8) return 8;
            if (wordPos === 6 || wordPos === 9) return 9;
            return 10;
        }
        // Midway through word so sustain wordPos
        if (wordPos === 4) return 4;
        if (wordPos === 5) return 5;
        if (wordPos === 6) return 6;

        // New typo
        if (currWordAttempt.length === 1) return 4;
        if (currWordAttempt.length < currWord.length) return 5;
        if (currWordAttempt.length === currWord.length) return 6;
    } else {
        if (currWordAttempt.length === 0) {
            if (!textSpans[0].textContent.includes(' ')) return 0;
            firstWord = false;
            return 1;
        }
        if (currWordAttempt.length < currWord.length) return 2;
        if (currWordAttempt.length === currWord.length) return 3;
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
    let left = 0;

    let contTop = nodes[0].parentNode.getBoundingClientRect().top;

    let prevLeft = null;
    let lineText = "";
    let startRange = null;
    for (const node of nodes) {
        let nodeText = node.textContent;
        const textLength = nodeText.length;
        let rangeIndex = 0;
        let textIndex = 0;
        while (rangeIndex <= textLength) {
            range.setStart(node, rangeIndex);
            if (rangeIndex < textLength -1) {
                range.setEnd(node, rangeIndex + 1);
            }
            left = range.getBoundingClientRect().right;
            if (prevLeft === null) {
                prevLeft = left;
                startRange = range.cloneRange();
            } else if (left < prevLeft) { // line break
                lineText += nodeText.slice(0, textIndex);
                startRange.setEnd(range.endContainer, range.endOffset);
                const { bottom } = startRange.getBoundingClientRect();
                lines.push({
                    y: bottom - contTop,
                    text: lineText
                });
                prevLeft = left;
                lineText = "";
                nodeText = nodeText.slice(textIndex);
                textIndex = 0;
                startRange = range.cloneRange();
            }
            rangeIndex++;
            textIndex++;
            prevLeft = left;
        }
        lineText += nodeText;
    }
    startRange.setEnd(range.endContainer, range.endOffset);
    const { bottom } = startRange.getBoundingClientRect();
    lines.push({
        y: bottom - contTop,
        text: lineText
    });
    return lines;
}

function setHeight(n) {
    lineHeight = lines[1].y - lines[0].y;
    return n * lineHeight;
}

function doMode() {
    let height;
    if (doScroll) {
        height = lineScrollHeight;
    } else if (settings.plusEnable) {
        height = plusHeight;
    }
    textDiv.style.height = `${height}px`;
    textDiv.style.position = 'relative';
    textDiv.style.visibility = "visible";

    currWord = getCurrWord(currWord, wordPos);
    wordPos = getPos(currWord, wordPos);
    if (settings.plusEnable) {
        plusMode();
    }
    if (settings.hideTyped) {
        hideTyped(wordPos);
    }
    if (doScroll) {
        lineScroll();
    }
    if (settings.correctColor) {
        setCorrectColor();
    }
}

function raceStart() {
    racing = true;
    textDiv = document.querySelector('.inputPanel tbody tr td table tbody tr td div');
    textSpans = textDiv.childNodes[0].childNodes;

    if (settings.lineScroll) {
        lines = getLineBreaks(textDiv);
        doScroll = lines.length >= 3 ? true : false;
        lineScrollHeight = setHeight(3);
        lineShift = 0;
        currLine = 0;
        wordIndex = 1;
        textDiv.children[0].style.marginTop = '0px';
        textDiv.parentNode.style.marginTop = '0px';
        textDiv.parentNode.style.paddingTop = '0px';
        textDiv.parentNode.style.overflowY = 'clip';
        textDiv.style.transition = 'top 0.2s ease';
    }
    if (settings.plusEnable) {
        plusHeight = textDiv.getBoundingClientRect().height;
    }
    doMode();
    monitorRace.observe(textDiv, {subtree: true, childList: true});
}

function raceEnd() {
    monitorRace.disconnect();
    racing = false;
    lineScrollHeight = -1;
    plusHeight = -1;
    wordPos = -1;
    firstWord = true;
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
            var countdown = parseInt(document.getElementsByClassName('lightLabel')[0].parentNode.nextSibling.textContent.substr(-1));
            if (countdown <= 3 && countdown !== 0) {
                raceStart();
            }
        }
    }

    if(racing && ((gameStatusLabels.length==0) || (document.getElementsByClassName('rank')[0].innerText=='Done!'|| document.getElementsByClassName('rank')[0].innerText.includes('Place')))){
        raceEnd();
    }
});
observer.observe(document, {childList: true, subtree: true});
