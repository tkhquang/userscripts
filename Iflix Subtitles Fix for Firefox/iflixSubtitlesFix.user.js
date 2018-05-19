// ==UserScript==
// @name         Iflix Subtitles Fix for Firefox
// @namespace    https://github.com/tkhquang
// @version      1.8
// @description  Subtitles fix for Firefox
// @author       Aleks
// @homepage     https://greasyfork.org/en/scripts/367324-iflix-subtitles-fix-for-firefox-59
// @include      *://piay.iflix.com/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

/*==================*
 * Reference: http://ronallo.com/demos/webvtt-cue-settings/
 * You can change the below variables to suite your needs.
 *==================*/

var lineVTT = 14, //See reference
    minfontSize = "12px", //Subtitles font-size won't scale smaller than this value
    fontSize = "3vmin", //font-size = minfontSize + this value
    lineHeight = "150%"; //Better leave this as is

var vimond;
var vimondSubList;
var vidState;
var selectedSub;
var curLineValue;
var vidStateCheck;

var getVidState = function getVidState() {
    vimond = document.getElementsByTagName("video")[0];
    if (typeof vimond === "undefined") {
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
};


var getSubList = function getSubList() {
    if (vidState !== true) {
        return;}
    vimondSubList = vimond.textTracks;
    onSubAction();
    setTimeout(getSub, 10000);
};

var onSubAction = function onSubAction() {
    if (typeof vimondSubList === "undefined") {
        return;
    }
    vimondSubList.onchange = function() {
        console.log("iSFix - Subtitles onchange action");
        getSub();
    };
};

var getSub = function getSub() {
    if (typeof vimondSubList === "undefined") {
        return;
    }
    var j;
    for (j = 0; j < vimondSubList.length; j+=1) {
        if (vimondSubList[j].mode === "showing") {
            break;
        }
    }
    selectedSub = vimondSubList[j];
    setTimeout(alterSub, 500);
};

var alterSub = function alterSub() {
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
};

var lineCheck = function lineCheck() {
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
};
var styleSub = function styleSub() {
    var css = "";
    if (false ||
        (document.location.href.indexOf("https://piay.iflix.com/play/") === 0) ||
        (document.location.href.indexOf("http://piay.iflix.com/play/*") === 0)) {
        css = `video::cue {\
font-size: calc(${minfontSize} + ${fontSize}) !important;\
line-height: ${lineHeight} !important;\
}`;
    }
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
};

document.onreadystatechange = function () {
    if (document.readyState === "complete" ) {
        console.log("iSFix - Observation started");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === "childList") {
                    for (let i = 0; i < mutation.addedNodes.length; i+=1) {
                        if (mutation.addedNodes[i].nodeName === "VIDEO") {
                            console.log("iSFix - Video element available");
                            styleSub();
                            setTimeout(getVidState, 1000);
                            //getVidState();
                        }
                    }
                }
                for (let i = 0; i < mutation.removedNodes.length; i+=1) {
                    if (mutation.removedNodes[i].nodeName === "video") {
                        console.log("iSFix - Video element removed");
                        if (vidState === false || vidStateCheck !== undefined) {
                            clearInterval(vidStateCheck);
                        }
                    }
                }
            });
        });

        observer.observe(document,{
            childList: true,
            attributes: false,
            characterData: false,
            subtree: true
        });
    }
};
