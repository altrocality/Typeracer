// ==UserScript==
// @name         Typeracer: No unwanted shortcuts
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Can't block ctrl + t/n/w. Allows ctrl + a/bckspc/r/0-9 when typing. Disables spacebar scrolling when not typing
// @author       poem, altrocality
// @match        https://play.typeracer.com/*
// @match        https://staging.typeracer.com/*
// @icon         https://www.google.com/s2/favicons?domain=typeracer.com
// ==/UserScript==


window.addEventListener('keydown', function(e) {
    if (e.target == document.getElementsByClassName('txtInput')[0]) {
        if(e.ctrlKey && e.key != 'a' && e.key != 'Backspace' && e.key != 'r'
           && e.key != '1' && e.key != '2' && e.key != '3' && e.key != '4' && e.key != '5' && e.key != '6' && e.key != '7' && e.key != '8' && e.key != '9' && e.key != '0')
        {
            e.preventDefault();
        }
  } else if (e.target == document.body) {
      if (e.key == ' ') {
          e.preventDefault();
      }
      if (e.ctrlKey && e.key != 'r' && e.key != '1' && e.key != '2' && e.key != '3' && e.key != '4' && e.key != '5' && e.key != '6' && e.key != '7' && e.key != '8' && e.key != '9' && e.key != '0')
    {
        e.preventDefault();
    }
  }
});
