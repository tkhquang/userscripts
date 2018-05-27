// ==UserScript==
// @name         Complete Your Set - Steam Forum Trading Helper
// @icon         https://store.steampowered.com/favicon.ico
// @namespace    https://github.com/tkhquang
// @version      0.3
// @description  Automatically detects missing cards from a card set, help you auto fill in info New Trading Thread input area
// @author       Aleks
// @license      MIT; https://raw.githubusercontent.com/tkhquang/userscripts/master/LICENSE
// @homepage     https://greasyfork.org/en/scripts/368518-complete-your-set-steam-forum-trading-helper/
// @match        *://steamcommunity.com/*/*/gamecards/*
// @match        *://steamcommunity.com/app/*/tradingforum/*
// @match        *://steamcommunity.com/app/*/tradingforum
// @run-at       document-idle
// @grant        none
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
var customBody = "\n[1:1] Trading";
var customTitle = " [1:1]";

var tradeForum;
function getGameId() {
    let gameId;
    let pathParts = window.location.pathname.split("/");
    for(let i=0; i < pathParts.length; i++) {
        if(/^[0-9]+$/.test(pathParts[i])) {
            gameId = pathParts[i];
        }
    }
    tradeForum = "https://steamcommunity.com/app/" + gameId + "/tradingforum/";
    //console.log("Game ID: " + gameId); console.log(tradeForum);
    createButton();
}

var owned = [];

function getOwnedCards() {
    let ownedCards = document.querySelectorAll(".badge_card_set_card.owned");
    for (let i=0; i < ownedCards.length; i++) {
        owned[i] = ownedCards[i].innerText;
        owned[i] = owned[i].replace(/ of .*/,"").split(/\n/);
    }
    //console.log(owned);
}

var unowned = [];

function getUnownedCards() {
    let unownedCards = document.querySelectorAll(".badge_card_set_card.unowned");
    for (let i=0; i < unownedCards.length; i++) {
        unowned[i] = unownedCards[i].innerText;
        unowned[i] = unowned[i].replace(/ of .*/,"").split(/\n/);
        unowned[i].splice(0, 0, "(0)");
    }
    //console.log(unowned);
}

var allCards = [];

function getAllCards() {
    allCards = owned.concat(unowned);
    //console.log(allCards);
    getTotal();
}

var totalCards = [];
var total = 0;

function getTotal() {
    for (let i=0; i < allCards.length; i++) {
        let curCard = allCards[i];
        totalCards.push(curCard[0].match(/\d+/));
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
                var remainSet = (total / allCards.length !== 1) ? true : false;
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
    getGameId();
    //if (!document.querySelector(".badge_card_to_collect_info")) getGameId();
}

var haveList = [];
var wantList = [];

function calcTrade() {
    let dupCards;
    let needCards;
    for (let i=0; i < allCards.length; i++) {
        if (totalCards[i] > badgeNum) {
            let curCard = allCards[i];
            if (badgeMode !== 0) dupCards = totalCards[i] - badgeNum;
            if (badgeMode === 0) dupCards = Number(totalCards[i]);
            haveList.push([
                dupCards,
                curCard[2],
                curCard[1]
            ]);
        }
        if (totalCards[i] < badgeNum||badgeMode === 0&&totalCards[i]==badgeNum) {
            let curCard = allCards[i];
            if (badgeMode !== 0) needCards = badgeNum - totalCards[i];
            if (badgeMode === 0) needCards = Number(totalCards[i]);
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

var haveListText = "[H]\n";
var wantListText = "[W]\n";
var haveListTextTitle = "[H] ";
var wantListTextTitle = "[W] ";

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
    window.localStorage.cardTrade = JSON.stringify([
        haveListText+"\n"+wantListText,
        haveListTextTitle + wantListTextTitle
    ]);
}

function inTrade() {
    if (document.querySelector(".btn_darkblue_white_innerfade.btn_medium.responsive_OnClickDismissMenu") === null) {
        console.log("CYS - Something is wrong, have you logged in?");
    }
    document.querySelector(".btn_darkblue_white_innerfade.btn_medium.responsive_OnClickDismissMenu").click();
    document.querySelector(".forumtopic_reply_textarea").textContent = JSON.parse(localStorage.cardTrade)[0] + customBody;
    document.querySelector(".forum_topic_input").value = JSON.parse(localStorage.cardTrade)[1] + customTitle;
}

function createButton() {
    var a = document.createElement("a");
    a.className = "btn_grey_grey btn_medium";
    a.href = tradeForum;
    a.innerHTML = "<span>Visit Trading Forum</span>";
    document.querySelector(".gamecards_inventorylink").appendChild(a);
}

function configCheck(value) {
    var numChecks = [
        !Number.isInteger(tradeTag),
        !Number.isInteger(tradeMode),
        !Number.isInteger(badgeMode),
        !Number.isInteger(badgeNumSet),
        tradeTag < 1 || tradeTag > 2,
        tradeMode < 0 || tradeMode > 2,
        badgeMode < 0 || badgeMode > 2,
        badgeNumSet < 0];
    return numChecks.some(function(config) {
        return config === value;
    });
}

(function() {
    "use strict";

    if (configCheck(true)) {
        alert("CYS - Invalid Config Settings\nPlease Check Again!");
        return;
    }
    if (/gamecards/.test(window.location.pathname) === true) {
        if (window.localStorage.cardTrade) {
            window.localStorage.removeItem("cardTrade");
            console.log("CYS - Local Storage Cleared");
        }
        getOwnedCards();
        getUnownedCards();
        setTimeout(getAllCards, 1000);
    }
    if (/gamecards/.test(document.referrer)) {
        setTimeout(inTrade, 2000);
    }
})();
