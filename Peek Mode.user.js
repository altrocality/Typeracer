// ==UserScript==
// @name         Typeracer: Peek Mode
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Shows the current and next 'n' words
// @author       altrocality
// @match        https://play.typeracer.com/*
// @match        https://staging.typeracer.com/*
// @icon         https://www.google.com/s2/favicons?domain=typeracer.com
// ==/UserScript==
/*
/////////////////////////////////////////////////////////////////////////////
To change the settings, press 'change display format' when in a race.

If you're using poem's smooth caret, access the menu by:
    1. Selecting the input box
    2. Press shift + tab, then enter
/////////////////////////////////////////////////////////////////////////////
*/
var peek;
var enabled;

var convertToBool = "true";
var racing = false;
var initHeight;
const doPeekNext = new MutationObserver(peekNext);
const newTheme = typeof com_typeracer_redesign_Redesign === "function";

function loadSettings() {
    enabled = (localStorage.getItem("enabled") === convertToBool);
    peek = parseInt(localStorage.getItem("peek"));
    if (Number.isNaN(peek)) {
        localStorage.setItem("enabled", "true");
        localStorage.setItem("peek", "3");
        enabled = (localStorage.getItem("enabled") === convertToBool);
        peek = parseInt(localStorage.getItem("peek"));
    }
}
function addMenu(displayModes) {
    var menu = document.createElement("tr");
    menu.innerHTML = `
    <td>
         <input type="checkbox" id="peekEnable" style="vertical-align:middle">
         <b>Peek: </b>
         <span> Show the next </span>
         <input type="text" id="peekInput" style="width:2em; text-align:center;">
         <span> words</span>
    </td>
    `;
    menu.className = "peekModeOptions";
    displayModes.append(menu);
    menu.style = "inherit";
    document.getElementById("peekInput").value = peek;
    document.getElementById("peekEnable").checked = enabled;
}

function raceStart() {
    racing = true;
    var textDiv = document.querySelector('.inputPanel tbody tr td table tbody tr td div');

    var textDivRect = textDiv.getBoundingClientRect();
    initHeight = textDivRect.height;

    var config = {subtree: true, childList: true};
    doPeekNext.observe(textDiv, config);
}

function raceEnd() {
    doPeekNext.disconnect();
    racing = false;
}

function status() {
    document.addEventListener('click', function(a) {
        if (a.target == document.getElementsByClassName('raceLeaveLink')[0]) {
            raceEnd();
            return;
        }
    });

    // Config
    var displayModes = document.getElementsByClassName('radioButtons')[0];
    var themeMenuOpen = document.getElementsByClassName('gwt-RadioButton classic')[0];
    var peekModeOptions = document.getElementsByClassName("peekModeOptions")[0];
    if (displayModes && !themeMenuOpen) {
        if (!peekModeOptions) {
            addMenu(displayModes);
        } else {
            var menuPeek = document.getElementById("peekInput");
            var menuEnable = document.getElementById("peekEnable");
            localStorage.setItem("enabled", menuEnable.checked);
            localStorage.setItem("peek", menuPeek.value);
            enabled = (localStorage.getItem("enabled") === convertToBool);
            peek = parseInt(localStorage.getItem("peek"));
        }
    }

    var gameStatusLabels = document.getElementsByClassName('gameStatusLabel');
    // Not in race lobby?
    if (!gameStatusLabels[0]) {
        raceEnd();
        return;
    }
    var gameStatus = gameStatusLabels[0].innerText;
    if (!racing && (gameStatus == 'Go!' || gameStatus.startsWith('The race is on!'))) {
        if (enabled) {
            raceStart();
        } else {
            return;
        }
    }

    if (racing && gameStatus.startsWith("You finished") || document.getElementsByClassName("txtInput txtInput-unfocused")[0]) {
        raceEnd();
    }
}

function addNext(textDiv, textSpans) {
    var hiddenSpan = textSpans[textSpans.length-1];
    var peekedWords = hiddenSpan.textContent.split(" ", peek+1).join(" ")+" ";
    var shownWords = document.createTextNode(peekedWords);
    var currPos = textSpans[textSpans.length-2];

    if (currPos.textContent != peekedWords) {
        var shownSpan = document.createElement("span");
        if (currPos.textContent == " ") {
            // At end of word
            shownWords = document.createTextNode(hiddenSpan.textContent.split(" ", peek).join(" ")+" ");
            shownSpan.appendChild(shownWords);
            currPos.parentNode.insertBefore(shownSpan, currPos.nextSibling);
            shownSpan.className = "nextWords";
        }
        if ((currPos.textContent.match(/ /g)||[]).length != peek) {
            // Avoids adding another shownSpan if at end of word
            shownSpan.appendChild(shownWords);
            currPos.parentNode.insertBefore(shownSpan, currPos.nextSibling);
            shownSpan.className = "nextWords";
        }
    }
}

function peekNext() {
    var textDiv = document.querySelector('.inputPanel tbody tr td table tbody tr td div');
    var textSpans = document.querySelectorAll('.inputPanel tbody tr td table tbody tr td div div span');
    var words = textSpans[textSpans.length-1].textContent;

    // Maintaining initial height
    textDiv.setAttribute("style", "height: "+initHeight+"px");
    textDiv.style.position = "relative";

    var hiddenSpan = textSpans[textSpans.length-1];
    var hiddenSpanNum = (hiddenSpan.textContent.match(/ /g)||[]).length;
    if (peek >= hiddenSpanNum) {
        // Read ahead covers rest of text -> quit
        return;
    } else {
        // Disabled during race?
        if (!enabled) {
            document.getElementsByClassName("nextWords")[0].remove();
            raceEnd();
            return;
        }
        // Hide upcoming words
        textDiv.style.visibility = "hidden";
        for (var i = 0; i < (textSpans.length-1); i++) {
            textSpans[i].style.visibility = "visible";
        }
    }

    // Don't hide smooth caret in new theme
    var smoothCaret = document.getElementById("smoothCaret");
    if (newTheme && smoothCaret) {
        document.getElementById("smoothCaret").style.visibility = "visible";
    }
    addNext(textDiv, textSpans);
}

loadSettings();
setInterval(status, 100);
