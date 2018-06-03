// ==UserScript==
// @name         Youtube Show Channel Name In Title
// @namespace    https://github.com/tkhquang
// @version      1.1
// @description  Show channel's name (username) in title page
// @author       Aleks
// @license      MIT; https://raw.githubusercontent.com/tkhquang/userscripts/master/LICENSE
// @homepage     https://greasyfork.org/en/scripts/368421-youtube-show-channel-name-in-title
// @match        http*://www.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    };
}

(function() {
    "use strict";

    var channelName, observer = new MutationObserver(setTitle);
    function setTitle() {
        if (!document.getElementById("owner-name")) {
            setTimeout(setTitle, 1000);
            return;
        }
        channelName = document.getElementById("owner-name").textContent.trim();
        if (document.title.startsWith(channelName + " | ")) return;
        document.title = channelName + " | " + document.title;
    }
    document.addEventListener("yt-navigate-finish", function () {
        if (/^\/watch?/.test(window.location.pathname)) {
            observer.observe(document.getElementsByTagName("title")[0], {
                childList: true,
                attributes: false,
                characterData: false,
                subtree: false
            });
        }
        else {
            observer.disconnect();
            if (document.title.startsWith(channelName + " | ")) {
                document.title = document.title.replace(channelName + " | ", "");
            }
        }
    }, true);
})();
