// ==UserScript==
// @name         Youtube Show Channel Name In Title
// @icon         https://s.ytimg.com/yts/img/favicon-vfl8qSV2F.ico
// @namespace    https://github.com/tkhquang
// @version      1.22
// @description  Show channel's name (username) in title page
// @author       AleksT.
// @license      MIT; https://raw.githubusercontent.com/tkhquang/userscripts/master/LICENSE
// @homepage     https://greasyfork.org/en/scripts/368421-youtube-show-channel-name-in-title
// @match        http*://www.youtube.com/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

(function () {
    "use strict";

    var channelName;
    var pattn = Boolean(/^\/watch?/.test(window.location.pathname));
    function setTitle() {
        var ownerName = document.getElementById("owner-name");
        if (!pattn) {
            return;
        }
        if (!ownerName || ownerName.textContent.length === 0) {
            setTimeout(function () {
                setTitle();
            }, 1000);
            return;
        }
        channelName = ownerName.textContent.trim();
        if (document.title.startsWith(channelName + " | ")) {
            return;
        }
        document.title = channelName + " | " + document.title;
    }

    var observer = new MutationObserver(setTitle);
    document.addEventListener("yt-navigate-finish", function () {
        if (pattn) {
            observer.observe(document.getElementsByTagName("title")[0], {
                childList: true,
                attributes: false,
                characterData: false,
                subtree: false
            });
        } else {
            observer.disconnect();
            if (document.title.startsWith(channelName + " | ")) {
                document.title = document.title.replace(channelName + " | ", "");
            }
        }
    }, false);
}());
