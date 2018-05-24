// ==UserScript==
// @name         Youtube Show Channel Name In Title
// @namespace    https://github.com/tkhquang
// @version      1.0
// @description  Show channel's name (username) in title page
// @author       Aleks
// @homepage     https://greasyfork.org/en/scripts/368421-youtube-show-channel-name-in-title
// @match        https://www.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    var channelName;

    function setTitle() {
        if (document.querySelector('#owner-name') === null) {
            setTimeout(setTitle, 5000);
            return;
        }
        channelName = document.getElementById("owner-name").textContent;
        if (document.title.startsWith(channelName + " | ")) return;
        document.title = channelName + " | " + document.title;
    }

    var observer = new MutationObserver(setTitle);
    var config = {
        childList: true,
        attributes: false,
        characterData: false,
        subtree: false
    };

    document.addEventListener("yt-navigate-finish", function () {
        if (/^\/watch?/.test(window.location.pathname) === true) {
            observer.observe(document.getElementsByTagName("title")[0], config);
        }
        else {
            observer.disconnect();
            if (document.title.startsWith(channelName + " | ")) {
                document.title = document.title.replace(channelName + " | ", "");
            }
        }
    }, true);
})();
