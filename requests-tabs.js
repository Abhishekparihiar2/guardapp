/* ============================================================================
 * ALEXIOS Mobile — Time Off & Shift Requests
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * 1. Home quick-action tile: "Time Off / Requests" -> "Time Off / Shift Requests"
 * 2. Requests page header:   "TIME OFF / LEAVE MANAGEMENT"
 *                            -> "TIME OFF & SHIFTS / REQUEST MANAGEMENT"
 * 3. Tab strip: "All Requests | Approved | Pending | History"
 *               -> "Time Off Request | Claim Shift | Shift Replacement"
 *
 * The tabs are relabelled by position and the fourth is hidden. In the current
 * bundle the tab state only drives the highlight, so no list content depends on
 * the old labels.
 *
 * Everything is React-owned, so text is rewritten (not replaced) and the extra
 * tab is hidden with display:none rather than removed — detaching a node React
 * still has in its tree makes it throw on the next reconcile. A MutationObserver
 * re-applies after every re-render.
 * ========================================================================== */
(function () {
  "use strict";

  var TILE = { from: "Requests", to: "Shift Requests" };

  var HEADER = {
    title: { from: "TIME OFF", to: "TIME OFF & SHIFTS" },
    sub: { from: "LEAVE MANAGEMENT", to: "REQUEST MANAGEMENT" }
  };

  /* Tab labels by position, matched against the bundle's originals. */
  var TABS = [
    { from: "All Requests", to: "Time Off Request" },
    { from: "Approved", to: "Claim Shift" },
    { from: "Pending", to: "Shift Replacement" },
    { from: "History", to: null } // null = hide
  ];

  function leaves(root) {
    return Array.prototype.filter.call(
      (root || document).querySelectorAll("#root div, #root button"),
      function (n) { return n.children.length === 0; }
    );
  }

  function setText(node, text) {
    if (node && node.textContent !== text) node.textContent = text;
  }

  /* --- 1. Home tile ------------------------------------------------------ */
  function patchTile() {
    leaves().forEach(function (node) {
      if (node.textContent.trim() !== "Time Off") return;
      var val = node.nextElementSibling;
      if (val && val.textContent.trim() === TILE.from) setText(val, TILE.to);
    });
  }

  /* --- 2. Page header ---------------------------------------------------- */
  function patchHeader() {
    leaves().forEach(function (node) {
      if (node.textContent.trim() !== HEADER.sub.from) return;
      var title = node.previousElementSibling;
      if (title && title.textContent.trim() === HEADER.title.from) {
        setText(title, HEADER.title.to);
        setText(node, HEADER.sub.to);
      }
    });
  }

  /* --- 3. Tab strip ------------------------------------------------------ */
  function findStrip() {
    var buttons = document.querySelectorAll("#root button");
    for (var i = 0; i < buttons.length; i++) {
      var label = buttons[i].textContent.trim();
      if (label !== TABS[0].from && label !== TABS[0].to) continue;
      var strip = buttons[i].parentElement;
      if (strip && strip.children.length === TABS.length) return strip;
    }
    return null;
  }

  function patchTabs() {
    var strip = findStrip();
    if (!strip) return;

    for (var i = 0; i < TABS.length; i++) {
      var btn = strip.children[i];
      var tab = TABS[i];
      if (!btn) continue;

      if (tab.to === null) {
        btn.style.display = "none";
        continue;
      }
      setText(btn, tab.to);
      /* Three longer labels in the space of four short ones. */
      btn.style.fontSize = "10px";
      btn.style.whiteSpace = "nowrap";
      btn.style.padding = "8px 2px";
    }
  }

  function apply() {
    patchTile();
    patchHeader();
    patchTabs();
  }

  function start() {
    var root = document.getElementById("root");
    if (!root) { setTimeout(start, 300); return; }
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; apply(); }, 60);
    }).observe(root, { childList: true, subtree: true, characterData: true });
    apply();
  }

  window.AlexiosRequestsTabs = { apply: apply, tabs: TABS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
