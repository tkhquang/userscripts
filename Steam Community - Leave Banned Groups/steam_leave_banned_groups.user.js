// ==UserScript==
// @name         Steam Community - Leave Banned Groups
// @icon         https://store.steampowered.com/favicon.ico
// @namespace    https://github.com/tkhquang
// @version      1.10
// @description  Add a button to leave invisble banned groups on steam
// @author       Quang Trinh
// @license      MIT; https://raw.githubusercontent.com/tkhquang/userscripts/master/LICENSE
// @homepage     https://greasyfork.org/en/scripts/391660-steam-community-leave-banned-groups
// @include      /^https?:\/\/steamcommunity\.com\/(?:id|profiles)\/[\w-_]+\/groups\/?$/
// @run-at       document-idle
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @grant        none
// ==/UserScript==

// ==Configuration==
const STEAM_WEB_API = ""; // Required, get from here: https://steamcommunity.com/dev/apikey
// ==Configuration==

(function ($) {
  "use strict";

  if (!STEAM_WEB_API.trim()) {
    alert("Steam Leave Banned Group Userscript\nSteam Web API is required");
    return;
  }

  const steamId = window.g_steamID;
  const sessionId = window.g_sessionID;

  // On not logged in, exit
  if (!steamId || !sessionId) {
    return;
  }

  // On someone else's profile, exit
  if (window.g_rgProfileData.steamid !== steamId ) {
    return;
  }

  async function doAjax (opts) {
    try {
      const data = await $.ajax({
        ...opts
      });
      return data;
    } catch (response) {
      if (response instanceof Error) {
        return Promise.reject(response);
      }
      // is jqXHR
      const error = new Error;
      error.message = response.statusText;
      return Promise.reject(error);
    }
  }

  // Get all groups which the user is in
  async function getAllGroups () {
    try {
      // This return the id [g:1:${id}]
      const { response } = await doAjax({
        type: "GET",
        url: "https://api.steampowered.com/ISteamUser/GetUserGroupList/v1/",
        data: {
          key: STEAM_WEB_API,
          steamid: steamId
        },
        dataType: "json",
      });

      return response.groups
        .map(function (groups) {
          return groups.gid;
        });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function getVisibleGroups () {
    const pattern = /group_(\d+)/;

    try {
      const visibleGroups = $("#search_results")
        .find("div[id^='group_']")
        .toArray()
        .map(function (item) {
          return pattern.exec($(item).attr("id"))[1];
        });
      return visibleGroups;
    } catch (error) {
      return error;
    }
  }

  // Filter out other types of groups (offcial game groups, .etc)
  async function filterOutNotBanned (groupIds) {
    try {
      const results = await Promise.all(groupIds.map(async function (groupId) {
        const html = await doAjax({
          url: `https://steamcommunity.com/gid/[g:1:${groupId}]`,
          type: "get",
          dataType: "html"
        });
        return /This group has been removed for violating/.test(html) ? groupId : null;
      }));
      return results.filter(function (result) {
        return result !== null;
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async function getBannedGroupInfo (groupIds) {
    const pattern = /<!\[CDATA\[(.*)]]>/;

    try {
      const groupInfo = await Promise.all(groupIds.map(async function (groupId) {
        const xml = await doAjax({
          url: `https://steamcommunity.com/gid/[g:1:${groupId}]/memberslistxml/`,
          data: {
            xml: 1
          },
          type: "GET",
          dataType: "xml"
        });
        return {
          groupID64: $(xml).find("groupID64").html(),
          groupName: pattern.exec($(xml).find("groupName").html())[1]
        };
      }));
      return groupInfo;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async function sendLeaveRequest (groupInfo) {
    const data = {
      action: "leave_group",
      sessionid: sessionId,
      ajax: 1,
      steamid: steamId,
      steamids: [groupInfo.groupID64]
    };

    try {
      const response = await doAjax({
        url: `https://steamcommunity.com/profiles/${steamId}/friends/action`,
        type: "POST",
        dataType: "json",
        data
      });
      console.log(`Left ${groupInfo.groupName}`, response);
      return response;
    } catch (error) {
      console.log(`Error leaving ${groupInfo.groupName}`, error);
      return Promise.reject(error);
    }
  }

  $(function () {
    $("<button />", {
      id: "userscript_leave_banned_groups",
      title: "Click to leave banned groups",
      text: "Leave banned groups",
      type: "button"
    }).appendTo(".friends_nav");

    $("<style>")
      .prop("type", "text/css")
      .html(`
        #userscript_leave_banned_groups {
          width: 100%;
          background-color: #015e80;
          border-radius: 5px;
          border: 1px solid #015e80;
          display: inline-block;
          cursor: pointer;
          color: #ffffff;
          padding: 8px 16px;
          text-decoration: none;
          text-shadow: 0px 1px 0px #2f6627;
        }
        #userscript_leave_banned_groups:hover:enabled {
          background-color: #004a50;
        }
        #userscript_leave_banned_groups:active {
          position: relative;
          top: 1px;
        }
        #userscript_leave_banned_groups:disabled {
          cursor: not-allowed;
        }`
      )
      .appendTo("head");

    const btn = $("#userscript_leave_banned_groups");
    const originalText = btn.text();

    let timer;

    function setText (el, text) {
      const $this = el;
      clearTimeout(timer);

      $this.text(text);
      timer = setTimeout(function () {
        $this.text(originalText);
      }, 5000);
    }

    function setPermText (el, text) {
      const $this = el;
      $this.text(text);
    }

    async function initialize () {
      btn.attr("disabled", true);
      setPermText(btn, "Checking...");

      const allGroups = await getAllGroups();
      const visibleGroups = getVisibleGroups();

      // This may be offical game groups or banned groups, .etc
      const unknownGroups = $(allGroups).not(visibleGroups).get();

      // Contains verified banned groups
      const bannedGroups = await filterOutNotBanned(unknownGroups);

      if (!bannedGroups.length) {
        setText(btn, "No banned groups to leave");
        console.log("No banned groups to leave");
        alert("No banned groups to leave");
        return;
      }

      // Get groupID64 and groupName
      const bannedGroupWithInfo = await getBannedGroupInfo(bannedGroups);

      setPermText(btn, `Leaving ${bannedGroupWithInfo.length} groups...`);

      // Send requests to leave those groups
      await Promise.all(bannedGroupWithInfo.map(function (groupInfo) {
        return sendLeaveRequest(groupInfo);
      }));

      // Success
      console.log(`Left ${bannedGroupWithInfo.length} Steam Groups successfully`);
      console.log("Groups", bannedGroupWithInfo);
      setText(btn, `Left ${bannedGroupWithInfo.length} groups`);
      alert(`Left ${bannedGroupWithInfo.length} groups\nCheck the browser console for more information`);
    }

    btn.click(
      async function (e) {
        e.preventDefault();
        try {
          await initialize();
        } catch (error) {
          console.log("An error occured", error);
          alert("An error occured");
          setText(btn, "An error occured");
        } finally {
          btn.removeAttr("disabled");
        }
      }
    );
  });

})(window.jQuery.noConflict(true));
