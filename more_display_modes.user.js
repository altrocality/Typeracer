// ==UserScript==
// @name         Typeracer: More Display Modes
// @namespace    http://tampermonkey.net/
// @version      1.3.3
// @downloadURL  https://raw.githubusercontent.com/altrocality/Typeracer/master/more_display_modes.user.js
// @updateURL    https://raw.githubusercontent.com/altrocality/Typeracer/master/more_display_modes.user.js
// @description  Adds peek mode, line scroll and more.
// @author       altrocality
// @match        https://play.typeracer.com/*
// @match        https://staging.typeracer.com/*
// @icon         https://www.google.com/s2/favicons?domain=typeracer.com
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
let height;
let switchedToMain = false;

let lineShift;
let lineHeight;
let currRangeHeight;
let lineStartPos;
let currLine;
let prevXPos;
let prevYPos;

let wordPos = -1;
let currWord;
let extraTypoChars = [];
let firstWord = true;
let typoFromStart = false;
let newTypo = true;

const newTheme = typeof com_typeracer_redesign_Redesign === "function";

const monitorRace = new MutationObserver(doMode);

function getCurrSpanIndex() {
    let i = 0;

    if (wordPos <= 4) {
        i = 0;
    } else if (wordPos <= 7 || wordPos === 9) {
        i = 1;
    } else if (wordPos === 8) {
        i = 2;
    }

    if (!firstWord && wordPos !== 1) {
        i++;
    }
    if (wordPos === 3 && (currWord[currWord.length-1] === ',' || currWord[currWord.length-1] === ';')) {
        i++;
    }
    return i;
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
    let boxOne = textDiv.children[1];
    let boxTwo = textDiv.children[2];
    if ((boxOne && boxTwo)) {
        lineHeight = boxTwo.getBoundingClientRect().top - boxOne.getBoundingClientRect().top;
    }
    if (document.activeElement !== document.getElementsByClassName('txtInput')[0]) return;
    let currChar = textSpans[getCurrSpanIndex()+1];
    let xPos = currChar.getBoundingClientRect().x;
    let yPos = currChar.getBoundingClientRect().y;

    let typo = document.getElementsByClassName('txtInput txtInput-error')[0];
    if (xPos < prevXPos && yPos > prevYPos && !typo) {
        textDiv.style.transition = 'top 0.1s ease-out';
        textDiv.style.top = `${lineShift}px`;
        lineShift -= lineHeight;
    }
    prevXPos = xPos;
    prevYPos = yPos;
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
    if (wordPos >= 7) return currWord;
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
        if (currSpan.className === 'typos') break;
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
    9 - new typo beyond word length
*/

    let typo = document.getElementsByClassName('txtInput txtInput-error')[0];
    let currWordAttempt = typo || document.getElementsByClassName('txtInput')[0];
    currWordAttempt = currWordAttempt.value;
    if (currWordAttempt === 'Type the above text here when the race begins') return 0;

    if (typo) {
        if (newTypo) {
            newTypo = false;
            if (currWordAttempt.length > currWord.length) {
                extraTypoChars = currWordAttempt.substr(currWord.length);
                return 9;
            }
        }
        if (typoFromStart) {
            if (currWordAttempt.length > currWord.length) {
                extraTypoChars = currWordAttempt.substr(currWord.length);
                return 7;
            }
            return 4;
        }
        if (currWordAttempt.length === 1) {
            typoFromStart = true;
            return 4;
        }
        if (currWordAttempt.length < currWord.length) return 5;
        if (currWordAttempt.length === currWord.length) return 6;
        if (currWordAttempt.length > currWord.length) {
            extraTypoChars = currWordAttempt.substr(currWord.length);
            if (wordPos === 9) return 9;
            return 8;
        }
    } else {
        newTypo = true;
        if (currWordAttempt.length === 0) {
            typoFromStart = false;
            if (!textSpans[0].textContent.includes(' ')) return 0;
            firstWord = false;
            return 1;
        }
        if (currWordAttempt.length < currWord.length) return 2;
        if (currWordAttempt.length === currWord.length) return 3;
    }
}

function doMode() {
    textDiv = document.querySelector('.inputPanel tbody tr td table tbody tr td div');
    textSpans = document.querySelectorAll('.inputPanel tbody tr td table tbody tr td div div span');

    let divHeight = Math.floor(textDiv.getBoundingClientRect().height);
    if (!(settings.lineScroll && divHeight < height)) {
        textDiv.style.height = `${height}px`;
    }
    textDiv.style.position = 'relative';
    textDiv.style.visibility = "visible";

    if (settings.lineScroll) {
        textDiv.children[0].style.marginTop = '0px';
        textDiv.parentNode.style.overflowY = 'clip';
    }
    currWord = getCurrWord(currWord, wordPos);
    wordPos = getPos(currWord, wordPos);
    if (settings.plusEnable) {
        plusMode();
    }
    if (settings.hideTyped) {
        hideTyped(wordPos);
    }
    if (settings.lineScroll) {
        lineScroll();
    }
    if (settings.correctColor) {
        setCorrectColor();
    }
}

function raceStart() {
    racing = true;
    textDiv = document.querySelector('.inputPanel tbody tr td table tbody tr td div');
    textSpans = document.querySelectorAll('.inputPanel tbody tr td table tbody tr td div div span');
    // Getting height to maintain
    if (settings.lineScroll) {
        lineHeight = Math.ceil(textSpans[0].getBoundingClientRect().height)+0.7;
        height = 3 * lineHeight;
        currRangeHeight = lineHeight;
        lineShift = 0;
        lineStartPos = textSpans[0].getBoundingClientRect().x;
    } else if (settings.plusEnable) {
        height = textDiv.getBoundingClientRect().height;
    }
    doMode();
    monitorRace.observe(textDiv, {subtree: true, childList: true});
}

function raceEnd() {
    monitorRace.disconnect();
    racing = false;
    height = -1;
    wordPos = -1;
    firstWord = true;
    typoFromStart = false;
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
