/* ============================================================================
 * ALEXIOS Mobile — Settings trim
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * Hides whole Settings sections (the header plus every row under it, up to the
 * next header). Currently: Synchronization, Storage, Session.
 *
 * The rows are React-owned, so they are hidden with display:none rather than
 * removed — detaching a node React still has in its tree makes it throw
 * NotFoundError on the next reconcile. A MutationObserver re-hides them after
 * every re-render.
 *
 * To change what is hidden:
 *   window.AlexiosSettingsTrim.configure({ hide: ["STORAGE"] })
 * ========================================================================== */
(function () {
  "use strict";

  var CONFIG = {
    // Section header labels, exactly as rendered (uppercase).
    hide: ["SYNCHRONIZATION", "STORAGE", "SESSION"]
  };

  var MARK = "aotHidden"; // dataset flag, so we can un-hide if config changes

  /* A section header is a leaf DIV carrying the settings label styling.
     Rows are BUTTONs, so this cleanly separates the two. */
  function isHeader(node) {
    return node.tagName === "DIV" &&
      node.children.length === 0 &&
      (node.getAttribute("style") || "").indexOf("letter-spacing") > -1;
  }

  function findHeader(label) {
    var nodes = document.querySelectorAll("#root div[style]");
    for (var i = 0; i < nodes.length; i++) {
      if (isHeader(nodes[i]) && nodes[i].textContent.trim() === label) return nodes[i];
    }
    return null;
  }

  function trim() {
    // ACCOUNT is the first real section and is never hidden, so it doubles as
    // proof that the Settings screen is the one currently mounted.
    var anchor = findHeader("ACCOUNT");
    if (!anchor || !anchor.parentElement) return;

    var kids = anchor.parentElement.children;
    var dropping = false;

    for (var i = 0; i < kids.length; i++) {
      var node = kids[i];
      if (isHeader(node)) {
        dropping = CONFIG.hide.indexOf(node.textContent.trim()) > -1;
      }
      if (dropping) {
        if (node.style.display !== "none") {      // idempotent: no mutation once settled
          node.dataset[MARK] = "1";
          node.style.display = "none";
        }
      } else if (node.dataset[MARK]) {            // config changed — put it back
        delete node.dataset[MARK];
        node.style.display = "";
      }
    }
  }

  function start() {
    var root = document.getElementById("root");
    if (!root) { setTimeout(start, 300); return; }
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; trim(); }, 60);
    }).observe(root, { childList: true, subtree: true });
    trim();
  }

  window.AlexiosSettingsTrim = {
    configure: function (opts) { Object.assign(CONFIG, opts || {}); trim(); return CONFIG; },
    config: CONFIG
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
