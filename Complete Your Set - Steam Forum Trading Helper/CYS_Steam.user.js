// ==UserScript==
// @name         Complete Your Set - Steam Forum Trading Helper
// @icon         https://store.steampowered.com/favicon.ico
// @namespace    https://github.com/tkhquang
// @version      0.8
// @description  Automatically detects missing cards from a card set, help you auto-fill New Trading Thread input areas
// @author       Aleks
// @license      MIT; https://raw.githubusercontent.com/tkhquang/userscripts/master/LICENSE
// @homepage     https://greasyfork.org/en/scripts/368518-complete-your-set-steam-forum-trading-helper/
// @match        *://steamcommunity.com/*/*/gamecards/*
// @match        *://steamcommunity.com/app/*/tradingforum/*
// @match        *://steamcommunity.com/app/*/tradingforum
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

var tradeTag = 2;
//1 = #Number of Set in Title
//2 = Card Name in Title
//Default is 2
var tradeMode = 0;
//0 - List both Owned and Unonwed Cards
//1 - Only List Owned Cards
//2 - Only List Unowned Cards
//Default is 0
var badgeMode = 1;
//0 - Don't check for number of cards to full set, this is more like a cards lister
//1 - Only check for game set that you have enough cards to make it full
//2 - Complete your remaining set
//Default is 1
var badgeNumSet = 0;
//0 - Don't set a target number of Card Sets
//Others - Set a target number for Card Sets - This will also set 'badgeMode = 2'
//Default is 0
var useLocalStorage = false;
//Use HTML5 Local Storage instead, set this to true if you're using Greasemonkey
//Default is false
var customBody = "\n[1:1] Trading";
var customTitle = " [1:1]";
var haveListText = "[H]\n";
var wantListText = "[W]\n";
var haveListTextTitle = "[H] ";
var wantListTextTitle = "[W] ";

//Codes

var CYSstorage = {};

var replaceOwned = new Map([
    [/\s{2,}/g, " "],
    [/\s(\d+)\ of \d+\, Series \d+\s$/, "=.=$1"],
    [/^\s\((\d+)\)\s/, "$1=.="]
]);
var replaceUnowned = new Map([
    [/\s{2,}/g, " "],
    [/\s(\d+)\ of \d+\, Series \d+\s$/, "=.=$1"],
    [/^\s/, "0=.="]
]);
function clean(str, replacements) {
    replacements.forEach(function(value, key){
        str = str.replace(key, value);
    });
    return str;
}

function getOwnedCards() {
    let ownedCards = document.querySelectorAll(".badge_card_set_card.owned");
    let owned = [];
    for (let i=0; i < ownedCards.length; i++) {
        owned[i] = clean(ownedCards[i].textContent,replaceOwned);
        owned[i] = owned[i].split("=.=");
    }
    //console.log(owned);
    return owned;
}

function getUnownedCards() {
    let unownedCards = document.querySelectorAll(".badge_card_set_card.unowned");
    let unowned = [];
    for (let i=0; i < unownedCards.length; i++) {
        unowned[i] = clean(unownedCards[i].textContent,replaceUnowned);
        unowned[i] = unowned[i].split("=.=");
    }
    //console.log(unowned);
    return unowned;
}

function sort(arr, index) {
    let sort = [];
    sort = Array(arr.length).fill().map((v,i)=>i+1);
    arr = arr.map(function(item) {
        var n = sort.indexOf(Number(item[index]));
        sort[n] = "";
        return [n, item];
    }).sort().map(function(j) {
        return j[1];
    });
    return arr;
}

var allCards = [];
function getAllCards() {
    let ulallCards = getOwnedCards().concat(getUnownedCards());
    allCards = sort(ulallCards, 2);
    getTotal();
    //console.log(allCards);
}

var totalCards = [];
var total = 0;
function getTotal() {
    for (let i=0; i < allCards.length; i++) {
        let curCard = allCards[i];
        totalCards.push(curCard[0]);
        total += Number(totalCards[i]);
    }
    //console.log(totalCards);
    console.log("Number of cards you've owned: " + total);
    badgeCheck();
}

var badgeNum;
function badgeCheck() {
    if (badgeNumSet !== 0) {
        badgeMode = 2;
        badgeNum = badgeNumSet;
        console.log("Target Set :"+badgeNumSet);
    }
    else {
        switch(badgeMode) {
            case 0:
                badgeNum = 0;
                break;
            case 1:
                badgeNum = Math.floor(total / allCards.length);
                console.log("Your cards are enough to craft " + badgeNum + " badge(s)");
                break;
            case 2:
                var remainSet = !Number.isInteger(total / allCards.length) ? true : false;
                if (remainSet === true) {
                    badgeNum = Math.floor(total / allCards.length + 1);
                    console.log("You need some cards to complete your remaining set\nTotal: "+badgeNum);
                }
                if (remainSet === false) {
                    badgeNum = Math.floor(total / allCards.length);
                }
                break;
        }
    }
    function tradeNeed(value) {
        let tradeCheck = false;
        for (let i=0; i < allCards.length; i++) {
            if (totalCards[i] < badgeNum) {
                tradeCheck = true;
                break;
            }
        }
        return tradeCheck === value;
    }
    if (badgeMode !==0 && tradeNeed(false)) {
        console.log("You don't need to do trading for now");
        return;
    }
    console.log("You can visit trading forum to complete your sets");
    calcTrade();
}

var haveList = [];
var wantList = [];
function calcTrade() {
    let dupCards;
    let needCards;
    for (let i=0; i < allCards.length; i++) {
        if (totalCards[i] > badgeNum) {
            let curCard = allCards[i];
            dupCards = (badgeMode === 0) ? Number(totalCards[i]) : totalCards[i] - badgeNum;
            haveList.push([
                dupCards,
                curCard[2],
                curCard[1]
            ]);
        }
        if ((totalCards[i] < badgeNum)||(badgeMode===0&&totalCards[i]==badgeNum)) {
            let curCard = allCards[i];
            needCards = (badgeMode === 0) ? Number(totalCards[i]) : badgeNum - totalCards[i];
            wantList.push([
                needCards,
                curCard[2],
                curCard[1]
            ]);
        }
    }
    //console.log(haveList); console.log(wantList);
    createText();
}

function createText() {
    for (let i=0; i < haveList.length; i++) {
        if (tradeMode !== 2 && haveList.length > 0) {
            let dup = haveList[i];
            haveListText += dup[1] + " - " + dup[2] + " - x" + dup[0] + "\n";
            haveListTextTitle += dup[tradeTag] + " (x" + dup[0] + "), ";
        }
    }
    for (let i=0; i < wantList.length; i++) {
        if (tradeMode !== 1 && wantList.length > 0) {
            let need = wantList[i];
            wantListText += need[1] + " - " + need[2] + " - x" + need[0] + "\n";
            wantListTextTitle += need[tradeTag] + " (x" + need[0] + "), ";
        }
    }
    haveListTextTitle = haveListTextTitle.replace(/\), $/, ") ");
    wantListTextTitle = wantListTextTitle.replace(/\), $/, ")");
    let CYStext = JSON.stringify([
        haveListText+"\n"+wantListText,
        haveListTextTitle + wantListTextTitle,
        window.location.pathname.split("/")[4],
        Date.now()
    ]);
    CYSstorage.storageSet(CYStext);
    createButton();
}

function inTrade() {
    if (document.querySelector(".btn_darkblue_white_innerfade.btn_medium.responsive_OnClickDismissMenu") === null) {
        console.log("CYS - Something is wrong, have you logged in?");
        return;
    }
    document.querySelector(".btn_darkblue_white_innerfade.btn_medium.responsive_OnClickDismissMenu").click();
    document.querySelector(".forumtopic_reply_textarea").textContent = CYSstorage.storageItem(0) + customBody;
    document.querySelector(".forum_topic_input").value = CYSstorage.storageItem(1) + customTitle;
    setTimeout(function(){
        CYSstorage.storageClear();
    }, 1000);
}

function createButton() {
    var a = document.createElement("a");
    a.className = "btn_grey_grey btn_medium";
    a.href = "https://steamcommunity.com/app/"+window.location.pathname.split("/")[4]+"/tradingforum/";
    a.innerHTML = "<span>Visit Trading Forum</span>";
    document.querySelector(".gamecards_inventorylink").appendChild(a);
}

var numChecks = [
    !(Number.isInteger(badgeNumSet)&&badgeNumSet>=0),
    [1,2].indexOf(tradeTag)==-1,
    [0,1,2].indexOf(tradeMode)==-1,
    [0,1,2].indexOf(badgeMode)==-1,
    typeof(useLocalStorage)!=="boolean"
], GMChecks = [
    typeof GM_setValue!=="undefined",
    typeof GM_getValue!=="undefined",
    typeof GM_deleteValue!=="undefined"
];
function configCheck(condi,value) {
    return condi.some(function(config) {
        return config === value;
    });
}

function getStorage(mode) {
    let storageItem,storageInv,storageClear,storageSet;
    if (!mode) {
        storageInv = function() {
            return ((GM_getValue("CYS-STORAGE"))&&(GM_getValue("CYS-STORAGE").length>0)) ? true : false;
        };
        storageItem = function(index) {
            return JSON.parse(GM_getValue("CYS-STORAGE"))[index];
        };
        storageClear = function() {
            GM_deleteValue("CYS-STORAGE");
            console.log("CYS - GM Storage Cleared");
        };
        storageSet = function(content) {
            GM_setValue("CYS-STORAGE", content);
        };
    }
    if (mode) {
        storageInv = function() {
            return ((window.localStorage.cardTrade)&&(window.localStorage.cardTrade.length>0)) ? true : false;
        };
        storageItem = function(index) {
            return JSON.parse(localStorage.cardTrade)[index];
        };
        storageClear = function() {
            window.localStorage.removeItem("cardTrade");
            console.log("CYS - Local Storage Cleared");
        };
        storageSet = function(content) {
            window.localStorage.cardTrade = content;
        };
    }
    return {storageInv,storageItem,storageClear,storageSet};
}

(function() {
    "use strict";

    if (configCheck(numChecks,true)) {
        alert("CYS - Invalid Config Settings\nPlease Check Again!");
        return;
    } else if ((!useLocalStorage)&&configCheck(GMChecks,false)) {
        useLocalStorage=true;
        console.log("CYS - GM functions are not defined - Switch to use HTML5 Local Storage instead");
    }
    CYSstorage = getStorage(useLocalStorage);
    if (/\/gamecards/.test(window.location.pathname)) {
        if (document.querySelector(".gamecards_inventorylink") === null) {
            console.log("Not your profile?");
            return;
        } else if (CYSstorage.storageInv()) {
            CYSstorage.storageClear();
        }
        getAllCards();
    }
    if (/\/tradingforum/.test(window.location.pathname)) {
        if (!CYSstorage.storageInv()) {
            console.log("CYS - No Stored Trade Info In Storage");
            return;
        } else if ((new RegExp(CYSstorage.storageItem(2))).test(window.location.pathname)) {
            let storedTime = Date.now() - CYSstorage.storageItem(3);
            console.log("CYS - Time: "+storedTime+"ms");
            if (storedTime>21600000) {
                if (window.confirm("CYS - It's been more than 6 hours since you checked your cards\n" +
                                   "It's better to check again\n"+
                                   "Press OK to go to your GameCard Page")) {
                    window.open("https://steamcommunity.com/my/gamecards/"+CYSstorage.storageItem(2),"_blank");
                    return;
                }
            }
            setTimeout(inTrade,1000);
        }
    }
})();
