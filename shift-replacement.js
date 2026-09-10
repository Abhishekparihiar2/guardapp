/* ============================================================================
 * ALEXIOS Mobile — Shift Replacement (design only)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * DESIGN ONLY. Same footing as claim-shift.js: the date strip does not filter,
 * REPLACE opens the reason sheet but SUBMIT does nothing, and the requests
 * below are fixed mock-up copy showing the pending / approved / declined
 * states side by side. Employee details vary per card on purpose — they are
 * placeholders, not the logged-in officer.
 *
 * Dates are MM/DD/YYYY throughout this tab, as specified.
 *
 * Reuses .acs-* (date strip, card shell, chips) from claim-shift.css.
 * Bundle nodes are React-owned, so they are hidden with display:none rather
 * than removed. A MutationObserver re-applies after every re-render.
 * ========================================================================== */
(function () {
  "use strict";

  var TAB = "Shift Replacement";

  var DAYS = [
    { day: "Mon", num: 10, count: 1 },
    { day: "Tue", num: 11, count: 1 },
    { day: "Wed", num: 12, count: 0 },
    { day: "Thu", num: 13, count: 2 },
    { day: "Fri", num: 14, count: 1 },
    { day: "Sat", num: 15, count: 0 },
    { day: "Sun", num: 16, count: 1 }
  ];

  /* The officer's own assigned shifts for the selected day. */
  var SHIFTS = [
    {
      state: "assigned", eyebrow: "Assigned · Patrol",
      time: "09:00 AM – 05:00 PM",
      date: "08/13/2026",
      title: "Westfield Mall — North Concourse",
      chips: [["8h", ""], ["Patrol Supervisor", ""], ["Standard rate", ""]],
      action: "Replace", variant: ""
    },
    {
      state: "requested-replacement", eyebrow: "Pending Cover",
      time: "06:00 PM – 02:00 AM",
      date: "08/13/2026",
      title: "Tower B — Perimeter Sector 4",
      chips: [["8h", ""], ["Armed Guard", ""], ["1.5× pay", "pay"]],
      action: "Awaiting Cover", variant: "done"
    }
  ];

  /* Varied placeholder employees — deliberately not one fixed officer. */
  var REQUESTS = [
    {
      status: "pending", label: "Pending", when: "Submitted 1 hour ago",
      initials: "SC", name: "Sarah Chen",
      role: "Patrol Supervisor • Westfield Mall",
      shift: "08/03/2026 • 09:00 AM - 05:00 PM",
      reason: "Family emergency",
      cancel: true
    },
    {
      status: "approved", label: "Approved", when: "Submitted 2 days ago",
      initials: "DO", name: "Daniel Ortiz",
      role: "Armed Security Guard • Riverside Depot",
      shift: "08/05/2026 • 10:00 PM - 06:00 AM",
      reason: "Medical appointment scheduled outside of working hours could not be moved.",
      covered: "Covered by — Marcus Johnson"
    },
    {
      status: "declined", label: "Declined", when: "Submitted 3 days ago",
      initials: "PN", name: "Priya Nair",
      role: "Access Control Officer • Tower A",
      shift: "08/07/2026 • 02:00 PM - 10:00 PM",
      reason: "Personal commitment",
      covered: null
    }
  ];

  var PICKS = ["Family emergency", "Illness", "Personal", "Transport", "Other"];

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

  function shiftHtml(s) {
    return '<div class="acs-card" data-state="' + s.state + '">' +
      '<div class="acs-top">' +
        '<div class="acs-eyebrow">' + esc(s.eyebrow) + "</div>" +
        '<div class="acs-time">' + esc(s.time) + "</div>" +
      "</div>" +
      '<div class="acs-title">' + esc(s.title) + "</div>" +
      '<div class="acs-chips">' + s.chips.map(chipHtml).join("") + "</div>" +
      '<div class="asr-section-label">SHIFT DATE</div>' +
      '<div class="acs-title" style="font-size:14px;margin-bottom:16px">' +
        esc(s.date) + "</div>" +
      '<button class="asr-replace"' +
        (s.variant ? ' data-variant="' + s.variant + '"' : "") +
        ' data-shift="' + esc(s.date + " • " + s.time) + '">' +
        esc(s.action) + "</button>" +
    "</div>";
  }

  function requestHtml(r) {
    return '<div class="asr-req" data-status="' + r.status + '">' +
      '<div class="asr-head">' +
        '<span class="asr-pill">' + esc(r.label) + "</span>" +
        '<span class="asr-when">' + esc(r.when) + "</span>" +
      "</div>" +
      '<div class="asr-who">' +
        '<div class="asr-avatar">' + esc(r.initials) + "</div>" +
        "<div>" +
          '<div class="asr-name">' + esc(r.name) + "</div>" +
          '<div class="asr-role">' + esc(r.role) + "</div>" +
        "</div>" +
      "</div>" +
      '<div class="asr-divider"></div>' +
      '<div class="asr-section">' +
        '<div class="asr-section-label">Shift Details</div>' +
        '<div class="asr-shift">' + esc(r.shift) + "</div>" +
      "</div>" +
      '<div class="asr-section">' +
        '<div class="asr-section-label">Reason</div>' +
        '<div class="asr-reason">' + esc(r.reason) + "</div>" +
      "</div>" +
      (r.covered ? '<div class="asr-covered">' + esc(r.covered) + "</div>" : "") +
      (r.cancel ? '<button class="asr-cancel">Cancel Request</button>' : "") +
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

  function sheetHtml() {
    return '<div class="asr-scrim" data-open="false">' +
      '<div class="asr-sheet">' +
        '<div class="asr-grip"></div>' +
        '<div class="asr-sheet-title">Request Replacement</div>' +
        '<div class="asr-sheet-sub" data-asr-shiftline>08/13/2026 • 09:00 AM – 05:00 PM</div>' +
        '<div class="asr-section-label">Reason</div>' +
        '<div class="asr-picks">' +
          PICKS.map(function (p) {
            return '<button class="asr-pick" data-on="false">' + esc(p) + "</button>";
          }).join("") +
        "</div>" +
        '<textarea class="asr-textarea" placeholder="Add details…"></textarea>' +
        '<div class="asr-count">0 / 240</div>' +
        '<div class="asr-actions">' +
          '<button class="asr-btn" data-kind="ghost">Cancel</button>' +
          '<button class="asr-btn" data-kind="submit" data-disabled="true">Submit Request</button>' +
        "</div>" +
      "</div>" +
    "</div>";
  }

  /* --- Sheet (presentation only: opens, closes, highlights) -------------- */
  var sheet = null;

  function ensureSheet() {
    if (sheet && document.body.contains(sheet)) return sheet;
    var wrap = document.createElement("div");
    wrap.innerHTML = sheetHtml();
    sheet = wrap.firstChild;
    document.body.appendChild(sheet);

    var submit = sheet.querySelector('[data-kind="submit"]');

    sheet.addEventListener("click", function (e) {
      if (e.target === sheet || e.target.closest('[data-kind="ghost"]')) {
        sheet.dataset.open = "false";
        return;
      }
      var pick = e.target.closest(".asr-pick");
      if (pick) {
        sheet.querySelectorAll(".asr-pick").forEach(function (p) {
          p.dataset.on = String(p === pick);
        });
        submit.dataset.disabled = "false";
      }
    });

    return sheet;
  }

  function openSheet(shiftLine) {
    var s = ensureSheet();
    var line = s.querySelector("[data-asr-shiftline]");
    if (line && shiftLine) line.textContent = shiftLine;
    setTimeout(function () { s.dataset.open = "true"; }, 16);
  }

  /* --- Panel ------------------------------------------------------------- */
  function buildPanel() {
    var el = document.createElement("div");
    el.className = "acs-panel";
    el.dataset.asrPanel = "true";
    el.innerHTML =
      '<div class="acs-dates">' +
        DAYS.map(function (d) { return dayHtml(d, 13); }).join("") +
      "</div>" +
      '<div class="acs-label">MY SHIFTS <span>· THU 13</span></div>' +
      '<div class="acs-list">' + SHIFTS.map(shiftHtml).join("") + "</div>" +
      '<div class="acs-label" style="margin-top:26px">MY REPLACEMENT REQUESTS</div>' +
      '<div class="acs-list">' + REQUESTS.map(requestHtml).join("") + "</div>" +
      '<div class="acs-empty">' +
        '<div class="acs-empty-icon">' + CAL_ICON + "</div>" +
        '<div class="acs-empty-title">No replacement requests</div>' +
        '<div class="acs-empty-sub">Nothing submitted for this day.</div>' +
      "</div>";

    /* Highlight only — presentation, not filtering. */
    el.querySelector(".acs-dates").addEventListener("click", function (e) {
      var day = e.target.closest(".acs-day");
      if (!day) return;
      el.querySelectorAll(".acs-day").forEach(function (d) {
        d.dataset.selected = String(d === day);
      });
    });

    el.addEventListener("click", function (e) {
      var btn = e.target.closest(".asr-replace");
      if (btn && btn.dataset.variant !== "done") openSheet(btn.dataset.shift);
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

    var content = strip.parentElement.nextElementSibling;
    if (!content) return;

    var on = activeTab() === TAB;
    var panel = content.querySelector("[data-asr-panel]");

    if (on && !panel) {
      panel = buildPanel();
      content.appendChild(panel);
    }
    var want = on ? "flex" : "none";
    if (panel && panel.style.display !== want) panel.style.display = want;

    /* Close the sheet when the tab is left. */
    if (!on && sheet) sheet.dataset.open = "false";

    /* Hide the bundle's own children while our panel is showing. */
    for (var i = 0; i < content.children.length; i++) {
      var child = content.children[i];
      if (child.dataset.asrPanel || child.dataset.acsPanel) continue;
      if (on) {
        if (child.style.display !== "none") {
          child.dataset.asrHidden = "true";
          child.style.display = "none";
        }
      } else if (child.dataset.asrHidden) {
        delete child.dataset.asrHidden;
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

  window.AlexiosShiftReplacement = {
    apply: apply, days: DAYS, shifts: SHIFTS, requests: REQUESTS
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
