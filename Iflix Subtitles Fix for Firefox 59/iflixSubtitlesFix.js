// ==UserScript==
// @name         Iflix Subtitles Fix for Firefox 59
// @namespace    https://github.com/tkhquang
// @version      1.5
// @description  Subtitles fix for Firefox
// @author       Aleks
// @include      *://piay.iflix.com/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

var i;
var j;
var k;
var l;
var vimond;
var vimondSubList;
var vidState;
var selectedSub;
var CurLineValue;
var vidStateCheck;
var getVidState = function getVidState() {
    vimond = document.getElementsByTagName("video")[0];
    if (vimond === undefined) {
        vidState = false;
        console.log("iSFix - No video? Try getting it after 5s...");
        vidStateCheck = function vidStateCheck() {
            getVidState();
        };
        setInterval(vidStateCheck, 5000);
    }
    vidState = true;
    getSubList();
    if (vidStateCheck !== undefined) {
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
    if (vimondSubList !== undefined) {
        vimondSubList.onchange = function() {
            console.log("iSFix - Subtitles onchange action");
            getSub();
        };
    }
};

var getSub = function getSub() {
    if (vimondSubList !== undefined) {
    for (j = 0; j < vimondSubList.length; j+=1) {
        if (vimondSubList[j].mode === "showing") {
            break;
        }
    }
    selectedSub = vimondSubList[j];
    setTimeout(alterSub, 500);
    }
};

var alterSub = function alterSub() {
    if (selectedSub !== undefined) {
        CurLineValue = selectedSub.cues[0].line;
        if (CurLineValue !== 14) {
            for (k = 0; k < selectedSub.cues.length; k+=1) {
                selectedSub.cues[k].line = 14;
            }
            console.log("iSFix - Done setting lines!");
            setTimeout(lineCheck, 3000);}
    }
    return;
};

var lineCheck = function lineCheck() {
    if (selectedSub !== undefined) {
        CurLineValue = selectedSub.cues[0].line;
        //if (selectedSub.cues.length == 0) {
        //console.log("No Subtitle");
        //}
        console.log("iSFix - Current line value: " + CurLineValue);
        if (CurLineValue !== 14) {
            console.log("iSubFix - Unmodified lines => Changing line value...");
            alterSub();
        }
        console.log("iSFix - Passed!!!");
    }
    return;
};
var styleSub = function styleSub() {
    var css = "";
    if (false || (document.location.href.indexOf("https://piay.iflix.com/play/") === 0) || (document.location.href.indexOf("http://piay.iflix.com/play/*") === 0)){
        css += [
            "::cue {",
            "    font-size: 32px !important;",
            "    padding: 3px !important;",
            "    line-height: 1.5 !important;",
            "}"
        ].join("\n");}
    if (typeof GM_addStyle != "undefined") {
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
                if (mutation.type==="childList") {
                    for (i=0; i<mutation.addedNodes.length; i+=1) {
                        if (mutation.addedNodes[i].nodeName==="VIDEO") {
                            console.log("iSFix - Video element available");
                            styleSub();
                            setTimeout(getVidState, 1000);
                            //getVidState();
                        }
                    }
                }
                for (l = 0; l<mutation.removedNodes.length; l+=1) {
                    if (mutation.removedNodes[l].nodeName==="video") {
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