// ==UserScript==
// @name         Iflix Subtitles Fix for Firefox
// @namespace    https://github.com/tkhquang
// @version      1.9
// @description  Subtitles fix for Firefox
// @author       Aleks
// @homepage     https://greasyfork.org/en/scripts/367324-iflix-subtitles-fix-for-firefox
// @match        *://piay.iflix.com/*
// @run-at       document-start
// @require      https://greasyfork.org/scripts/21927-arrive-js/code/arrivejs.js
// @grant        GM_addStyle
// ==/UserScript==

/* jshint esversion: 6 */

/*==================*
 * Reference: http://ronallo.com/demos/webvtt-cue-settings/
 * You can change the below variables to suite your needs.
 *==================*/

var lineVTT = 14, //See reference
    minfontSize = "12px", //Subtitles font-size won't scale smaller than this value
    fontSize = "3vmin", //font-size = minfontSize + this value
    lineHeight = "150%"; //Better leave this as is - "normal" with lineVTT = 16

var vidPlayer;
var vidState;
var subList;
var selectedSub;
var curLineValue;
var vidStateCheck;

function getVidState() {
    vidPlayer = document.querySelector(".vimond-player-video");
    if (!vidPlayer) {
        vidState = false;
        console.log("iSFix - No video? Try getting it after 5s...");
        vidStateCheck = function vidStateCheck() {
            getVidState();
        };
        setInterval(vidStateCheck, 5000);
        return;
    }
    vidState = true;
    getSubList();
    if (typeof vidStateCheck !== "undefined") {
        clearInterval(vidStateCheck);
    }
}

function getSubList() {
    if (vidState !== true) {
        return;}
    subList = vidPlayer.textTracks;
    onSubAction();
    setTimeout(getSub, 10000);
}

function onSubAction() {
    if (typeof subList === "undefined") {
        return;
    }
    subList.onchange = function() {
        console.log("iSFix - Subtitles onchange action");
        getSub();
    };
}

function getSub() {
    if (typeof subList === "undefined") {
        return;
    }
    var j;
    for (j = 0; j < subList.length; j+=1) {
        if (subList[j].mode === "showing") {
            break;
        }
    }
    selectedSub = subList[j];
    alterSub();
}

function alterSub() {
    if (typeof selectedSub === "undefined") {
        return;
    }
    var k;
    curLineValue = selectedSub.cues[0].line;
    if (curLineValue !== lineVTT) {
        for (k = 0; k < selectedSub.cues.length; k+=1) {
            selectedSub.cues[k].line = lineVTT;
        }
        console.log("iSFix - Done setting lines!");
        setTimeout(lineCheck, 3000);}
}

function lineCheck() {
    if (typeof selectedSub === "undefined") {
        return;
    }
    curLineValue = selectedSub.cues[0].line;
    //if (selectedSub.cues.length === 0) {
    //console.log("No Subtitle");
    //}
    console.log("iSFix - Current line value: " + curLineValue);
    if (curLineValue !== lineVTT) {
        console.log("iSubFix - Unmodified lines => Changing line value...");
        alterSub();
    }
    console.log("iSFix - Passed!!!");
}

function styleSub() {
    if (/^\/play/.test(window.location.pathname) === false) return;
    var css = `video::cue {\
font-size: calc(${minfontSize} + ${fontSize}) !important;\
line-height: ${lineHeight} !important;\
}`;
    if (typeof GM_addStyle !== "undefined") {
        GM_addStyle(css);
    } else {
        var node = document.createElement("style");
        node.type = "text/css";
        node.appendChild(document.createTextNode(css));
        var heads = document.getElementsByTagName("head");
        if (heads.length > 0) {
            heads[0].appendChild(node);
        } else {
            document.documentElement.appendChild(node);
        }
    }
    console.log("iSFix - Styling Done!");
}

(function() {
    'use strict';
    document.arrive(".vimond-player-video", function() {
        setTimeout(getVidState, 1000);
        styleSub();
    });
    document.leave(".vimond-player-video", function() {
        if (vidState === false || vidStateCheck !== undefined) {
            clearInterval(vidStateCheck);
        }
    });
})();
