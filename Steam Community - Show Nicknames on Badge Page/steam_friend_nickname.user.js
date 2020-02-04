// ==UserScript==
// @name         Steam Community - Show Nicknames on Badge Page
// @icon         https://store.steampowered.com/favicon.ico
// @namespace    https://github.com/tkhquang
// @version      1.00
// @description  Show nicknames for friends with cards on Badge Page if exists
// @author       Quang Trinh
// @license      MIT; https://raw.githubusercontent.com/tkhquang/userscripts/master/LICENSE
// @match        *://steamcommunity.com/*/*/gamecards/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  Array.from(document.querySelectorAll(".badge_friendwithgamecard .persona"))
    .forEach(friend => {
      fetch(`https://steamcommunity.com/miniprofile/${friend.getAttribute("data-miniprofile")}`)
        .then(
          function(response) {
            if (response.status !== 200) {
              console.log(`An error occured. Status Code: ${response.status}`);
              return;
            }

            response
              .text()
              .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                friend.innerText = doc.querySelector(".persona").innerText;
              });
          }
        )
        .catch(err => {
          console.log("Fetch Error :-S", err);
        });
    });
}());
