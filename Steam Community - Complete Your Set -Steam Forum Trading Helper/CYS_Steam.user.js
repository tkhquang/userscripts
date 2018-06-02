// ==UserScript==
// @name         Steam Community - Complete Your Set (Steam Forum Trading Helper)
// @icon         https://store.steampowered.com/favicon.ico
// @namespace    https://github.com/tkhquang
// @version      1.4
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
const steamID64 = "";//Your steamID64, needed for fetch trade data directly from trade forum
const yourLanguage = "";//If things are alright, don't touch this. Check the Langlist below, if you don't see your Language there, please contact me.
const customSteamID = "";//If you have set a custom ID for you Steam account, set this
const customTitle = " [1:1]";
const customBody = "\n[1:1] Trading";
const haveListTitle = "[H] ";
const wantListTitle = "[W] ";
const haveListBody = "[H]\n";
const wantListBody = "[W]\n";
// ==Configuration==

//Codes
const langList = {
    "english":/\s(\d+) of \d+, Series \d+\s$/,
    "bulgarian": /\s(\d+) от \d+, серия \d+\s$/,
    "czech": /\s(\d+) z \d+, \d+. série\s$/,
    "danish":/\s(\d+) af \d+, serie \d+\s$/,
    "dutch":/\s(\d+) van de \d+, serie \d+\s$/,
    "finnish":/\s(\d+) \/ \d+, Sarja \d+\s$/,
    "french":/\s(\d+) sur \d+, séries \d+\s$/,
    "german":/\s(\d+) von \d+, Serie \d+\s$/,
    "greek":/\s(\d+) από \d+, Σειρά \d+\s$/,
    "hungarian":/\s(\d+) \/ \d+, \d+\. sorozat\s$/,
    "italian":/\s(\d+) di \d+, serie \d+\s$/,
    "japanese":/\s\d+ 枚中 (\d+)枚, シリーズ \d+\s$/,
    "koreana":/\s\d+장 중 (\d+)번째, 시리즈 \d+\s$/,
    "norwegian":/\s(\d+) av \d+, serie \d+\s$/,
    "polish":/\s(\d+) z \d+, seria \d+\s$/,
    "portuguese":/\s(\d+) de \d+, \d+\ª Série\s$/,
    "brazilian":/\s(\d+) de \d+, série \d+\s$/,
    "romanian":/\s(\d+) din \d+, seria \d+\s$/,
    "russian":/\s(\d+) из \d+, серия \d+\s$/,
    "schinese":/\s\d+ 张中的第 (\d+) 张，系列 \d+\s$/,
    "spanish":/\s(\d+) de \d+, serie \d+\s$/,
    "swedish":/\s(\d+) av \d+, serie \d+\s$/,
    "tchinese":/\s(\d+) \/ \d+，第 \d+ 套\s$/,
    "thai":/\s(\d+) จาก \d+ ในชุดที่ \d+\s$/,
    "turkish":/\s(\d+)\/\d+, Seri \d+\s$/,
    "ukrainian":/\s(\d+) з \d+, серія №\d+\s$/
};

function getUserLang() {
    let tempLang = null;
    if (yourLanguage.length>0) tempLang = yourLanguage;
    else {
        tempLang = (document.cookie.match(/Steam_Language=(\w+)/)) ? document.cookie.match(/Steam_Language=(\w+)/)[1] : null;
    }
    if (tempLang!==null&&Object.keys(langList).indexOf(tempLang)>-1) {
        console.log(`Your current language: ${tempLang}`);
    } else {
        alert("Couldn't detect you current language using cookies\n"+
              "Or your language setting in the script not right\n"+
              "Please set your Language in the script settings then try again");
        return false;
    }
    return tempLang;
}

function getInfo(doc,lang) {
    var ularrCards = [], arrCards = [], objCards = {}, total = 0, set, qtyDiff = false, lowestQty = Infinity;
    function clean(str,replacements) {
        replacements = (replacements) ? new Map([
            [/\s+/gm, " "],
            [langList[lang], "=.=$1"],
            [/^\s\((\d+)\)\s/, "$1=.="]
        ]) : new Map([
            [/\s+/gm, " "],
            [langList[lang], "=.=$1"],
            [/^\s/, "0=.="]
        ]);
        replacements.forEach(function(value, key) {
            str = str.replace(key, value);
        });
        return str;
    }
    function getOwnedCards() {
        const ownedCards = doc.getElementsByClassName("owned");
        var owned = [];
        for (let i=0; i < ownedCards.length; i++) {
            owned[i] = clean(ownedCards[i].textContent,true);
            owned[i] = owned[i].split("=.=");
        }
        //console.log(owned);
        return owned;
    }
    function getUnownedCards() {
        const unownedCards = doc.getElementsByClassName("unowned");
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
        if (curQty<lowestQty) lowestQty = curQty;
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
    if (CYSstorage === "fetch") {
        (function(reply,topic,btn) {
            if (btn.length>0) btn[0].click();
            reply[0].value = "";
            if (topic.length>0) topic[0].value = "";
            reply[0].value = haveListText+"\n"+wantListText + customBody;
            if (topic.length>0) topic[0].value = haveListTextTitle + wantListTextTitle + customTitle;
        })(document.getElementsByClassName("forumtopic_reply_textarea"),document.getElementsByClassName("forum_topic_input"),
           document.getElementsByClassName("responsive_OnClickDismissMenu"));
        return;
    }
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
        document.getElementsByClassName("gamecards_inventorylink")[0].appendChild(a);
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
                    numSet = (fullSetStacked) ? Math.floor(setDiff + 1) : info.lowestQty+1;
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
                        console.warn("(CYS) You need a whole full set - "+
                                     "Script stopped according to your configurations (fullSetUnowned = false)");
                        break;
                    }
                }
        }
    }
    calcTrade(info, numSet, tradeNeed, CYSstorage);
}

function inTrade(CYSstorage,disBtn) {
    if (disBtn.length===0) return;
    disBtn[0].click();
    document.getElementsByClassName("forumtopic_reply_textarea")[0].value = CYSstorage.storageItem(0) + customBody;
    document.getElementsByClassName("forum_topic_input")[0].value = CYSstorage.storageItem(1) + customTitle;
    setTimeout(function() {
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

function passiveFetch(lang) {
    const checkURL1 = "https://steamcommunity.com/profiles/";
    const checkURL2 = "https://steamcommunity.com/id/";
    const appID = window.location.pathname.split("/")[2];
    var steamID = (function () {
        const pattn = [/steamRememberLogin=(\d{17})/,/\/steamcommunity.com\/(?:id|profiles)\/(\w+)\//];
        let tempID = null,
            userAva = document.getElementsByClassName("user_avatar");
        if (/^7656119[0-9]{10}$/.test(steamID64)) tempID = steamID64;
        else if (customSteamID.length > 1) tempID = customSteamID;
        else if (document.cookie.match(pattn[0])) {
            tempID = document.cookie.match(pattn[0])[1];
        }
        else if (userAva.length>0){
            if (userAva[0].href.match(pattn[1])) tempID = userAva[0].href.match(pattn[1])[1];
        }
        return tempID;
    })();
    if (steamID === null) {
        alert("(CYS) SteamID not set, failed to get it from cookies\n"+
              "Cannot perform fetching your cards data\nPlease try setting your steamID manually");
        return;
    }
    console.log("Your SteamID = "+steamID);
    var URL = (/^7656119[0-9]{10}$/.test(steamID)) ? checkURL1+steamID : checkURL2+steamID;
    var resURL;
    fetch(URL+"/gamecards/"+appID+`/?l=${lang}`, {
        method: "GET",
        mode: "same-origin"}) .then(function(response) {
        resURL = response.url;
        return response.text();
    })
        .then(function(text) {
        if (!text.match(document.getElementsByClassName("apphub_AppName")[0].textContent.trim()&&
                        !resURL.match("/gamecards/"+appID))) {
            alert("(CYS) Something went wrong, cannot fetch date, please try doing it manually");
            return;
        }
        const gameCardPage = document.createElement("div");
        gameCardPage.innerHTML = text;
        readInfo(getInfo(gameCardPage,lang),calcTrade,"fetch");
    })
        .catch(function(error) {
        alert("(CYS) Something went wrong, cannot fetch date, please try doing it manually");
        console.log("Cannot fetch data, please try doing it manually", error);
    });
}

function fetchButton(subsBtn,tradeofBtn,lang) {
    if (subsBtn.length===0&&tradeofBtn.length===0) return;
    var btn = (subsBtn[0]||tradeofBtn[0]);
    const a = document.createElement("a");
    a.className = (subsBtn.length>0) ? "btn_grey_black btn_medium" : "btn_darkblue_white_innerfade btn_medium";
    a.onclick = function(){passiveFetch(lang);};
    a.innerHTML = "<span>Fetch Info</span>";
    btn.appendChild(a);
}

(function() {
    "use strict";

    var useStorage = useLocalStorage, CYSstorage = {}, userLang;
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
    userLang = getUserLang();
    if (!userLang) return;
    if (/\/gamecards\//.test(window.location.pathname)) {
        if (document.getElementsByClassName("gamecards_inventorylink").length === 0) {
            console.log("Not your profile?");
            return;
        } else if (CYSstorage.storageInv()) {
            CYSstorage.storageClear();
        }
        readInfo(getInfo(document,userLang),calcTrade,CYSstorage);
    }
    if (/\/tradingforum/.test(window.location.pathname)) {
        fetchButton(document.getElementsByClassName("forum_subscribe_button"),
                    document.getElementsByClassName("forum_topic_tradeoffer_button_ctn"),userLang);
        if (!CYSstorage.storageInv()) {
            console.log("(CYS) No Stored Trade Info In Storage");
            return;
        } else if ((new RegExp(CYSstorage.storageItem(2))).test(window.location.pathname)) {
            let storedTime = Date.now() - CYSstorage.storageItem(3);
            console.log("(CYS) Time: "+storedTime+"ms");
            if (storedTime>21600000) {
                if (window.confirm("(CYS) It's been more than 6 hours since you checked your cards\n" +
                                   "You can go back to your GameCard Page or do an info Fetch, "+
                                   "since your stored trade info might be outdated\n"+
                                   "Hit OK will take you go back to your GameCard Page")) {
                    window.open("https://steamcommunity.com/my/gamecards/"+CYSstorage.storageItem(2),"_blank");
                    return;
                }
            }
            setTimeout(inTrade(CYSstorage,document.getElementsByClassName("responsive_OnClickDismissMenu")), 1000);
        }
    }
})();
