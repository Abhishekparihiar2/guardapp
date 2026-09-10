/* ============================================================================
 * ALEXIOS Mobile — Claim Shift (design only)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * DESIGN ONLY. This renders the static look of the Claim Shift tab — date
 * strip, shift cards, empty state. There is deliberately no logic behind it:
 * the dates do not filter, CLAIM does not submit, and the shifts below are
 * fixed mock-up copy. Selecting a date only moves the highlight, so the strip
 * does not feel dead while the design is being reviewed.
 *
 * When the Claim Shift tab is active the bundle's own content (officer card,
 * leave list, submit button) is hidden and this panel is shown in its place.
 * Bundle nodes are React-owned, so they are hidden with display:none rather
 * than removed — detaching a node React still has in its tree makes it throw
 * on the next reconcile. A MutationObserver re-applies after every re-render.
 * ========================================================================== */
(function () {
  "use strict";

  var TAB = "Claim Shift";

  /* Mock-up copy. Design placeholder, not a data source. */
  var DAYS = [
    { day: "Mon", num: 10, count: 2 },
    { day: "Tue", num: 11, count: 0 },
    { day: "Wed", num: 12, count: 1 },
    { day: "Thu", num: 13, count: 3 },
    { day: "Fri", num: 14, count: 1 },
    { day: "Sat", num: 15, count: 4 },
    { day: "Sun", num: 16, count: 0 }
  ];

  var SHIFTS = [
    {
      state: "urgent", eyebrow: "Urgent · In 18h",
      time: "06:00 AM – 02:00 PM",
      title: "Tower B — Perimeter Sector 4",
      chips: [["8h", ""], ["Armed Guard", ""], ["1.5× pay", "pay"]],
      reqs: [["Armed License", ""], ["CPR Certified", ""]],
      action: "Claim Shift", variant: ""
    },
    {
      state: "open", eyebrow: "Open · Patrol",
      time: "02:00 PM – 10:00 PM",
      title: "Tower A — Lobby & Visitor Desk",
      chips: [["8h", ""], ["Unarmed Guard", ""], ["Standard rate", ""]],
      reqs: [["Access Control", ""]],
      action: "Claim Shift", variant: ""
    },
    {
      state: "requested", eyebrow: "Requested",
      time: "10:00 PM – 06:00 AM",
      title: "Riverside Depot — Night Gate",
      chips: [["8h", ""], ["Armed Guard", ""], ["2× pay", "pay"]],
      reqs: [["Armed License", ""], ["Night Ops", ""]],
      action: "Awaiting Supervisor", variant: "pending", withdraw: true
    },
    {
      state: "overtime", eyebrow: "Overtime · 12h",
      time: "06:00 AM – 06:00 PM",
      title: "Tower B — Loading Bay (12h)",
      chips: [["12h", ""], ["Armed Guard", ""], ["1.5× pay", "pay"]],
      reqs: [["Armed License", ""], ["Hazmat Awareness", "missing"]],
      action: "Requirement Not Met", variant: "blocked"
    }
  ];

  var CAL_ICON =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" ' +
    'stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/>' +
    '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>' +
    '<line x1="3" y1="10" x2="21" y2="10"/></svg>';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function chipHtml(pair) {
    return '<span class="acs-chip"' +
      (pair[1] ? ' data-tone="' + pair[1] + '"' : "") + ">" + esc(pair[0]) + "</span>";
  }

  function cardHtml(s) {
    return '<div class="acs-card" data-state="' + s.state + '">' +
      '<div class="acs-top">' +
        '<div class="acs-eyebrow">' + esc(s.eyebrow) + "</div>" +
        '<div class="acs-time">' + esc(s.time) + "</div>" +
      "</div>" +
      '<div class="acs-title">' + esc(s.title) + "</div>" +
      '<div class="acs-chips">' + s.chips.map(chipHtml).join("") + "</div>" +
      '<div class="acs-req-label">REQUIREMENTS</div>' +
      '<div class="acs-chips">' + s.reqs.map(chipHtml).join("") + "</div>" +
      '<button class="acs-action"' +
        (s.variant ? ' data-variant="' + s.variant + '"' : "") + ">" +
        esc(s.action) + "</button>" +
      (s.withdraw ? '<button class="acs-withdraw">Withdraw request</button>' : "") +
    "</div>";
  }

  function dayHtml(d, selected) {
    return '<div class="acs-day" data-selected="' + (d.num === selected) +
      '" data-empty="' + (d.count === 0) + '" data-num="' + d.num + '">' +
      (d.count ? '<div class="acs-day-count">' + d.count + "</div>" : "") +
      '<span class="acs-day-name">' + d.day + "</span>" +
      '<span class="acs-day-num">' + d.num + "</span>" +
    "</div>";
  }

  function buildPanel() {
    var el = document.createElement("div");
    el.className = "acs-panel";
    el.dataset.acsPanel = "true";
    el.innerHTML =
      '<div class="acs-dates">' +
        DAYS.map(function (d) { return dayHtml(d, 13); }).join("") +
      "</div>" +
      '<div class="acs-label">UNASSIGNED SHIFTS <span>· THU 13</span></div>' +
      '<div class="acs-list">' + SHIFTS.map(cardHtml).join("") + "</div>" +
      '<div class="acs-empty">' +
        '<div class="acs-empty-icon">' + CAL_ICON + "</div>" +
        '<div class="acs-empty-title">No open shifts</div>' +
        '<div class="acs-empty-sub">Nothing unassigned on this day.</div>' +
      "</div>";

    /* Highlight only — presentation, not filtering. */
    el.querySelector(".acs-dates").addEventListener("click", function (e) {
      var day = e.target.closest(".acs-day");
      if (!day) return;
      el.querySelectorAll(".acs-day").forEach(function (d) {
        d.dataset.selected = String(d === day);
      });
    });

    return el;
  }

  /* --- Tab plumbing ------------------------------------------------------ */

  /* The active tab is the one the bundle paints solid white. */
  function activeTab() {
    var buttons = document.querySelectorAll("#root button");
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (b.style.color === "rgb(255, 255, 255)" && b.style.flex === "1 1 0%") {
        return b.textContent.trim();
      }
    }
    return null;
  }

  function tabStrip() {
    var buttons = document.querySelectorAll("#root button");
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent.trim() === TAB) return buttons[i].parentElement;
    }
    return null;
  }

  function apply() {
    var strip = tabStrip();
    if (!strip) return;

    /* The tab strip sits in its own padded wrapper; the bundle's content
       column is the next sibling of that wrapper. */
    var content = strip.parentElement.nextElementSibling;
    if (!content) return;

    var on = activeTab() === TAB;
    var panel = content.querySelector("[data-acs-panel]");

    if (on && !panel) {
      panel = buildPanel();
      content.appendChild(panel);
    }
    var want = on ? "flex" : "none";
    if (panel && panel.style.display !== want) panel.style.display = want;

    /* Hide the bundle's own children while our panel is showing. */
    for (var i = 0; i < content.children.length; i++) {
      var child = content.children[i];
      if (child.dataset.acsPanel || child.dataset.asrPanel) continue;
      if (on) {
        if (child.style.display !== "none") {
          child.dataset.acsHidden = "true";
          child.style.display = "none";
        }
      } else if (child.dataset.acsHidden) {
        delete child.dataset.acsHidden;
        child.style.display = "";
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
      setTimeout(function () { pending = false; apply(); }, 60);
    }).observe(root, { childList: true, subtree: true, attributes: true });
    apply();
  }

  window.AlexiosClaimShift = { apply: apply, days: DAYS, shifts: SHIFTS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
