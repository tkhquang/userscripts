// ==UserScript==
// @name         Steam Community - Complete Your Set (Steam Forum Trading Helper)
// @icon         https://store.steampowered.com/favicon.ico
// @namespace    https://github.com/tkhquang
// @version      1.0
// @description  Automatically detects missing cards from a card set, help you auto-fill New Trading Thread input areas
// @author       Aleks
// @license      MIT; https://raw.githubusercontent.com/tkhquang/userscripts/master/LICENSE
// @homepage     https://greasyfork.org/en/scripts/368518-steam-community-complete-your-set-steam-forum-trading-helper
// @match        *://steamcommunity.com/*/*/gamecards/*
// @match        *://steamcommunity.com/app/*/tradingforum/*
// @match        *://steamcommunity.com/app/*/tradingforum
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

// ==Configuration==
const tradeTag = 2;//1 = #Number of Set in Title//2 = Card Name in Title
const tradeMode = 0;//0 = List both Owned and Unonwed Cards//1 = Only List Owned Cards, 2 = Only List Unowned Cards
const showQtyInTitle = false;//Show quantity in title?
const fullSetMode = 2;//0 = Cards Lister Mode//1 = Only check for game set that you have enough cards to make it full//2 = Complete your remainng set
const fullSetTarget = 0;//0 = Don't set a target number of Card Sets//Integer > 0 = Set a target number for Card Sets
const fullSetUnowned = true;//Check for sets that you're missing a whole full set? This has no effect if fullSetMode = 1
const fullSetStacked = false;//false = Will check for the nearest number of your card set, even if you have enough cards to have 2, 3 more set
const useLocalStorage = false;//Use HTML5 Local Storage instead, set this to true if you're using Greasemonkey
const customTitle = " [1:1]";
const customBody = "\n[1:1] Trading";
const haveListTitle = "[H] ";
const wantListTitle = "[W] ";
const haveListBody = "[H]\n";
const wantListBody = "[W]\n";
// ==Configuration==

//Codes

function getInfo() {
    var ularrCards = [], arrCards = [], objCards = {}, total = 0, set, qtyDiff = false, lowestQty;

    function clean(str,replacements) {
        replacements = (replacements) ? new Map([
            [/\s{2,}/g, " "],
            [/\s(\d+)\ of \d+\, Series \d+\s$/, "=.=$1"],
            [/^\s\((\d+)\)\s/, "$1=.="]
        ]) : new Map([
            [/\s{2,}/g, " "],
            [/\s(\d+)\ of \d+\, Series \d+\s$/, "=.=$1"],
            [/^\s/, "0=.="]
        ]);
        replacements.forEach(function(value, key) {
            str = str.replace(key, value);
        });
        return str;
    }
    function getOwnedCards() {
        const ownedCards = document.querySelectorAll(".badge_card_set_card.owned");
        var owned = [];
        for (let i=0; i < ownedCards.length; i++) {
            owned[i] = clean(ownedCards[i].textContent,true);
            owned[i] = owned[i].split("=.=");
        }
        //console.log(owned);
        return owned;
    }
    function getUnownedCards() {
        const unownedCards = document.querySelectorAll(".badge_card_set_card.unowned");
        var unowned = [];
        for (let i=0; i < unownedCards.length; i++) {
            unowned[i] = clean(unownedCards[i].textContent,false);
            unowned[i] = unowned[i].split("=.=");
        }
        //console.log(unowned);
        return unowned;
    }
    function sortArr(arr,index) {
        var sort = [];
        sort = Array(arr.length).fill().map((v,i)=>i+1);
        arr = arr.map(function(item) {
            let n = sort.indexOf(Number(item[index]));
            sort[n] = "";
            return [n, item];
        }).sort().map(function(j) {
            return j[1];
        });
        return arr;
    }
    ularrCards = getOwnedCards().concat(getUnownedCards());
    arrCards = sortArr(ularrCards, 2);
    //console.log(arrCards);
    set = (arrCards.length>0) ? arrCards.length : 0;
    arrCards.forEach(function(card) {
        let curQty = Number(card[0]);
        if (arrCards[0][0] !== card[0]) qtyDiff = true;
        lowestQty = (!lowestQty||curQty<=lowestQty) ? curQty : lowestQty;
        total += curQty;
        objCards["card"+card[2]] = {
            "order":Number(card[2]),
            "name":card[1],
            "quantity":curQty
        };
    });
    //console.log(objCards);
    return {objCards,total,set,qtyDiff,lowestQty};
}

function calcTrade(info,numSet,tradeNeed,CYSstorage) {
    if (!tradeNeed) return;
    var CYStext = [],
        haveListTextTitle = haveListTitle,
        wantListTextTitle = wantListTitle,
        haveListText = haveListBody,
        wantListText = wantListBody;
    Object.keys(info.objCards).map(e => info.objCards[e]).forEach(function(v) {
        let tag = (tradeTag===2) ? v.name : v.order;
        if (v.quantity>numSet&&tradeMode!==2) {
            haveListTextTitle += (showQtyInTitle) ? tag+" (x"+(v.quantity-numSet)+"), " : tag+", ";
            haveListText += "Card "+v.order+" - "+ v.name+" - (x"+(v.quantity-numSet)+")\n";
        }
        if ((v.quantity<numSet||(fullSetMode===0&&v.quantity===numSet))&&tradeMode!==1) {
            wantListTextTitle += (showQtyInTitle) ? tag+" (x"+(numSet-v.quantity)+"), " : tag+", ";
            wantListText += "Card "+v.order+" - "+ v.name+" - (x"+(numSet-v.quantity)+")\n";
        }
    });
    haveListTextTitle = haveListTextTitle.replace(/(?:\,|\,\s+)$/, " ");
    wantListTextTitle = wantListTextTitle.replace(/(?:\,|\,\s+)$/, "");
    //console.log(haveListTextTitle);console.log(wantListTextTitle);console.log(haveListText);console.log(wantListText);
    CYStext = JSON.stringify([
        haveListText+"\n"+wantListText,
        haveListTextTitle + wantListTextTitle,
        window.location.pathname.split("/")[4],
        Date.now()
    ]);
    //console.log(JSON.parse(CYStext));
    CYSstorage.storageSet(CYStext);
    (function createButton() {
        const a = document.createElement("a");
        a.className = "btn_grey_grey btn_medium";
        a.href = "https://steamcommunity.com/app/"+window.location.pathname.split("/")[4]+"/tradingforum/";
        a.innerHTML = "<span>Visit Trading Forum</span>";
        document.querySelector(".gamecards_inventorylink").appendChild(a);
    })();
}

function readInfo(cardInfo,calcTrade,CYSstorage) {
    const info = cardInfo;
    const setDiff = info.total/info.set;
    var numSet, tradeNeed = false;
    if (fullSetTarget !== 0) {
        numSet = fullSetTarget;
        tradeNeed = (Math.floor(setDiff)<numSet||(Math.floor(setDiff)===numSet&&info.qtyDiff)) ? true : false;
        console.log("Target Set :"+fullSetTarget);
        if (!tradeNeed) console.warn("(CYS) Script stopped since you've reached this target already");
    } else {
        let remainSet;
        const remainCards = function remainCards(a) {
            return (Math.abs(info.total-(info.set*a)));
        };
        switch(fullSetMode) {
            case 0:
                numSet = 0;
                tradeNeed = true;
                break;
            case 1:
                if (Math.floor(setDiff)===0) {
                    console.log("You don't have enough cards for a full set");
                    break;
                } else if (Number.isInteger(setDiff)&&info.qtyDiff) {
                    numSet = Math.floor(setDiff);
                    tradeNeed = true;
                    console.log("Your cards are enough to get a full set - "+numSet+" set(s) in Total");
                    break;
                } else if (info.qtyDiff&&Math.floor(setDiff)>1) {
                    numSet = (fullSetStacked) ? Math.floor(setDiff) : info.lowestQty + 1;
                    tradeNeed = true;
                    console.log("Your cards are enough to get a full set - "+numSet+" set(s) in Total");
                    break;
                } else {
                    console.log("You don't have enough cards for a full set");
                    break;
                }
                console.warn("No cases match?");
                break;
            case 2:
                remainSet = (!Number.isInteger(setDiff)||Number.isInteger(setDiff)&&info.qtyDiff) ? true : false;
                if (remainSet) {
                    numSet = (fullSetStacked) ? Math.floor(setDiff + 1) : info.lowestQty + 1;
                    tradeNeed = true;
                    console.log((Number.isInteger(setDiff)) ? "Your cards are enough to get a full set"
                                : "You need "+remainCards(numSet)+" more card(s) to get some full set(s)");
                } else {
                    if (fullSetUnowned) {
                        numSet = Math.floor(setDiff + 1);
                        tradeNeed = true;
                        if (remainCards(numSet)!==info.set&&info.qtyDiff) {
                            console.log("You need "+remainCards(numSet)+" more card(s) to get a full set");
                        } else console.log((info.qtyDiff) ? "Your cards are enough to get a full set" : "You need a whole full set");
                        break;
                    } else {
                        numSet = Math.floor(setDiff);console.log(numSet);
                        console.warn("(CYS) You need a whole full set - Script stopped according to your configurations (fullSetUnowned = false)");
                        break;
                    }
                }
        }
    }
    calcTrade(info, numSet, tradeNeed, CYSstorage);
}

function inTrade(CYSstorage) {
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

function getStorage(mode) {
    var storageItem,storageInv,storageClear,storageSet;
    if (!mode) {
        storageInv = function() {
            return ((GM_getValue("CYS-STORAGE"))&&(GM_getValue("CYS-STORAGE").length>0)) ? true : false;
        };
        storageItem = function(index) {
            return JSON.parse(GM_getValue("CYS-STORAGE"))[index];
        };
        storageClear = function() {
            GM_deleteValue("CYS-STORAGE");
            console.log("(CYS) GM Storage Cleared");
        };
        storageSet = function(content) {
            GM_setValue("CYS-STORAGE", content);
            console.log("(CYS) Done storing trade info in GM Storage");
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
            console.log("(CYS) Local Storage Cleared");
        };
        storageSet = function(content) {
            window.localStorage.cardTrade = content;
            console.log("(CYS) Done storing trade info in Local Storage");
        };
    }
    return {storageInv,storageItem,storageClear,storageSet};
}

(function() {
    "use strict";

    var useStorage = useLocalStorage, CYSstorage = {};
    const numChecks = [
        !(Number.isInteger(fullSetTarget)&&fullSetTarget>=0),
        [1,2].indexOf(tradeTag)==-1,
        [0,1,2].indexOf(tradeMode)==-1,
        [0,1,2].indexOf(fullSetMode)==-1,
        typeof(useLocalStorage)!=="boolean"||typeof(showQtyInTitle)!=="boolean"||
        typeof(fullSetUnowned)!=="boolean"||typeof(fullSetStacked)!=="boolean"
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
    if (configCheck(numChecks,true)) {
        alert("(CYS) Invalid Config Settings\nPlease Check Again!");
        return;
    } else if ((!useStorage)&&configCheck(GMChecks,false)) {
        useStorage = true;
        console.warn("(CYS) GM functions are not defined - Switch to use HTML5 Local Storage instead");
    }
    CYSstorage = getStorage(useStorage);
    if (/\/gamecards/.test(window.location.pathname)) {
        if (document.querySelector(".gamecards_inventorylink") === null) {
            console.log("Not your profile?");
            return;
        } else if (CYSstorage.storageInv()) {
            CYSstorage.storageClear();
        }
        readInfo(getInfo(),calcTrade,CYSstorage);
    }
    if (/\/tradingforum/.test(window.location.pathname)) {
        if (!CYSstorage.storageInv()) {
            console.log("(CYS) No Stored Trade Info In Storage");
            return;
        } else if ((new RegExp(CYSstorage.storageItem(2))).test(window.location.pathname)) {
            let storedTime = Date.now() - CYSstorage.storageItem(3);
            console.log("(CYS) Time: "+storedTime+"ms");
            if (storedTime>21600000) {
                if (window.confirm("(CYS) It's been more than 6 hours since you checked your cards\n" +
                                   "It's better to check again\n"+
                                   "Press OK to go to your GameCard Page")) {
                    window.open("https://steamcommunity.com/my/gamecards/"+CYSstorage.storageItem(2),"_blank");
                    return;
                }
            }
            setTimeout(inTrade(CYSstorage), 1000);
        }
    }
})();
