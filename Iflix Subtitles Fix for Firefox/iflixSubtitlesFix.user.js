// ==UserScript==
// @name         Iflix Subtitles Fix for Firefox
// @namespace    https://github.com/tkhquang
// @version      2.0
// @description  Subtitles fix for Firefox
// @author       Aleks
// @homepage     https://greasyfork.org/en/scripts/367324-iflix-subtitles-fix-for-firefox
// @match        http*://piay.iflix.com/*
// @run-at       document-start
// @require      https://greasyfork.org/scripts/21927-arrive-js/code/arrivejs.js
// @grant        GM_addStyle
// @noframes
// ==/UserScript==

/*
 * arrive.js
 * v2.4.1
 * https://github.com/uzairfarooq/arrive
 * MIT licensed
 *
 * Copyright (c) 2014-2017 Uzair Farooq
 */

/*==================*
 * Reference: http://ronallo.com/demos/webvtt-cue-settings/
 * You can change the below variables to suite your needs.
 *==================*/

// ==Configuration==
const lineVTT = 14; //See reference
const minfontSize = "12px"; //Subtitles font-size won't scale smaller than this value
const fontSize = "3vmin"; //font-size = minfontSize + this value
const lineHeight = "150%"; //Better leave this as is - "normal" with lineVTT = 16
// ==Configuration==

//Codes
function styleSub() {
    if (/^\/play/.test(window.location.pathname) === false) return;
    const css = `video::cue {\
font-size: calc(${minfontSize} + ${fontSize}) !important;\
line-height: ${lineHeight} !important;\
}`;
    if (typeof GM_addStyle !== "undefined") {
        GM_addStyle(css);
    } else {
        const node = document.createElement("style");
        node.type = "text/css";
        node.appendChild(document.createTextNode(css));
        const heads = document.getElementsByTagName("head");
        if (heads.length > 0) {
            heads[0].appendChild(node);
        } else {
            document.documentElement.appendChild(node);
        }
    }
    console.log("iSFix - Styling Done!");
}

function getVidState(vidPlayer,timer) {
    if (timer === true && vidPlayer.length === 0) {
        console.warn("iSFix - No video? Try getting it after 5s...");
        timer = setTimeout(function () {
            getVidState(vidPlayer,true);
        }, 5000);
    }
    else if (!timer) clearTimeout(timer);
    else {
        clearTimeout(timer);
        styleSub();
        getSubList(vidPlayer);
    }
    return;
}

function getSubList(vidPlayer) {
    const subList = vidPlayer[0].textTracks;
    if (subList.length === 0) {
        console.warn("iSFix - No subtitles?");
        return;
    }
    function getSub(subList) {
        return (function () {
            for (let i = 0; i < subList.length; i+=1) {
                if (subList[i].mode === "showing") {
                    return subList[i];
                }
            }
            return false;
        })();
    }
    subList.onchange = function() {
        console.log("iSFix - Subtitles onchange action");
        alterSub(getSub(subList));
    };
    alterSub(getSub(subList));
    setTimeout(alterSub(getSub(subList)), 10000);
}

function alterSub(activeSub) {
    if (!activeSub) return;
    let curLineValue = activeSub.cues[0].line;
    if (curLineValue !== lineVTT) {
        for (let i = 0; i < activeSub.cues.length; i+=1) {
            activeSub.cues[i].line = lineVTT;
        }
        console.log("iSFix - Done setting lines!");
    }
    setTimeout(lineCheck(activeSub), 5000);
}

function lineCheck(activeSub) {
    let curLineValue = activeSub.cues[0].line;
    console.log("iSFix - Current line value: " + curLineValue);
    if (curLineValue !== lineVTT) {
        console.warn("iSFix - Unmodified lines => Try changing line value...");
        alterSub(activeSub);
    }
    console.log("iSFix - Passed!!!");
}

(function() {
    "use strict";
    document.arrive(".vimond-player-video", function() {
        console.log("iSFix - Video element available");
        setTimeout(getVidState(document.getElementsByClassName("vimond-player-video"),true), 1000);
    });
    document.leave(".vimond-player-video", function() {
        console.log("iSFix - Video element unavailable");
        getVidState(document.getElementsByClassName("vimond-player-video"),false);
    });
})();
