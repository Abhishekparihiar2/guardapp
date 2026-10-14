/* ============================================================================
 * ALEXIOS Mobile — Shift Replacement (real data)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * The guard asks for cover on one of their own upcoming shifts:
 *
 *   GET  /mobile/shifts/mine?date=YYYY-MM-DD      7-day strip, that day's shifts, my requests
 *   POST /mobile/shifts/:id/replacement           { reason, details? } (pending)
 *   POST /mobile/shifts/replacements/:id/cancel   take back a request not yet decided
 *
 * A supervisor approves in the CRM's Schedule Requests drawer; the guard then
 * comes off the shift and it becomes an open shift others can claim (Claim
 * Shift tab). Dates are MM/DD/YYYY throughout this tab, as specified.
 *
 * Reuses .acs-* (date strip, card shell, chips) from claim-shift.css.
 * Bundle nodes are React-owned, so they are hidden with display:none rather
 * than removed. A MutationObserver re-applies after every re-render.
 * ========================================================================== */
(function () {
  "use strict";

  var TAB = "Shift Replacement";
  var MAX_DETAILS = 240;
  var state = { date: null, data: null, error: null, loading: false, loadedAt: 0 };
  var panel = null;

  var CAL_ICON =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" ' +
    'stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/>' +
    '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>' +
    '<line x1="3" y1="10" x2="21" y2="10"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function api(path, options) {
    if (!window.AlexiosAuth) return Promise.reject(new Error("Not signed in"));
    return window.AlexiosAuth.fetch(path, options).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) throw new Error((body && body.message) || "Something went wrong. Try again.");
        return body.data;
      });
    });
  }

  /* ── Formatting ─────────────────────────────────────────────────────────── */

  function mdy(ymd) {
    var p = String(ymd).split("-");
    return p[1] + "/" + p[2] + "/" + p[0];
  }

  function ago(iso) {
    var mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
    if (mins < 1) return "Submitted just now";
    if (mins < 60) return "Submitted " + mins + " min ago";
    var hours = Math.round(mins / 60);
    if (hours < 24) return "Submitted " + hours + " hour" + (hours === 1 ? "" : "s") + " ago";
    var days = Math.round(hours / 24);
    return "Submitted " + days + " day" + (days === 1 ? "" : "s") + " ago";
  }

  function me() {
    var user = window.AlexiosAuth && window.AlexiosAuth.user();
    var name = (user && (user.fullName || user.name)) || "Me";
    var initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
    return { name: name, initials: initials || "ME" };
  }

  /* ── Rendering ──────────────────────────────────────────────────────────── */

  function chip(text) {
    return '<span class="acs-chip">' + esc(text) + "</span>";
  }

  function shiftHtml(s) {
    var r = s.replacement;
    var pending = r && r.status === "pending";
    var stateName = pending ? "requested-replacement" : "assigned";
    var eyebrow = pending ? "Pending Cover" : "Assigned · " + s.position.title;
    var action = pending
      ? '<button class="asr-replace" data-variant="done" disabled>Awaiting Cover</button>'
      : '<button class="asr-replace" data-shift="' + esc(s.id) + '" data-line="' + esc(mdy(s.date) + " • " + s.time) + '">Replace</button>';
    var note = r && r.status === "declined" ? '<div class="acs-blocker">Your last request for this shift was declined.</div>' : "";
    return (
      '<div class="acs-card" data-state="' + stateName + '">' +
      '<div class="acs-top"><div class="acs-eyebrow">' + esc(eyebrow) + '</div><div class="acs-time">' + esc(s.time) + "</div></div>" +
      '<div class="acs-title">' + esc(s.title ? s.site.name + " — " + s.title : s.site.name) + "</div>" +
      '<div class="acs-chips">' + chip(s.hours + "h") + chip(s.position.title) + "</div>" +
      '<div class="asr-section-label">SHIFT DATE</div>' +
      '<div class="acs-title" style="font-size:14px;margin-bottom:16px">' + esc(mdy(s.date)) + "</div>" +
      action + note +
      "</div>"
    );
  }

  function requestHtml(r, who) {
    return (
      '<div class="asr-req" data-status="' + esc(r.status) + '">' +
      '<div class="asr-head"><span class="asr-pill">' + esc(r.statusLabel) + '</span><span class="asr-when">' + esc(ago(r.submittedAt)) + "</span></div>" +
      '<div class="asr-who"><div class="asr-avatar">' + esc(who.initials) + "</div><div>" +
      '<div class="asr-name">' + esc(who.name) + "</div>" +
      '<div class="asr-role">' + esc(r.shift.position.title + " • " + r.shift.site.name) + "</div>" +
      "</div></div>" +
      '<div class="asr-divider"></div>' +
      '<div class="asr-section"><div class="asr-section-label">Shift Details</div><div class="asr-shift">' + esc(mdy(r.shift.date) + " • " + r.shift.time) + "</div></div>" +
      '<div class="asr-section"><div class="asr-section-label">Reason</div><div class="asr-reason">' + esc(r.reason || "—") + "</div></div>" +
      (r.coveredBy ? '<div class="asr-covered">Covered by — ' + esc(r.coveredBy) + "</div>" : "") +
      (r.status === "approved" && !r.coveredBy ? '<div class="asr-covered">Released — open for other guards to claim</div>' : "") +
      (r.canCancel ? '<button class="asr-cancel" data-request="' + esc(r.id) + '">Cancel Request</button>' : "") +
      "</div>"
    );
  }

  function dayHtml(d, selected) {
    return (
      '<div class="acs-day" data-selected="' + (d.date === selected) + '" data-empty="' + (d.shifts === 0) + '" data-date="' + d.date + '">' +
      (d.shifts ? '<div class="acs-day-count">' + d.shifts + "</div>" : "") +
      '<span class="acs-day-name">' + esc(d.weekday) + '</span><span class="acs-day-num">' + d.day + "</span>" +
      "</div>"
    );
  }

  function emptyHtml(title, sub, retry) {
    return (
      '<div class="acs-empty" data-show="true"><div class="acs-empty-icon">' + CAL_ICON + "</div>" +
      '<div class="acs-empty-title">' + esc(title) + '</div><div class="acs-empty-sub">' + esc(sub) + "</div>" +
      (retry ? '<button class="acs-retry">Try again</button>' : "") +
      "</div>"
    );
  }

  function render() {
    if (!panel) return;
    var d = state.data;
    if (!d) {
      panel.innerHTML = state.error ? emptyHtml("Couldn’t load your shifts", state.error, true) : emptyHtml("Loading your shifts…", "");
      return;
    }
    var day = d.days.filter(function (x) { return x.date === d.selectedDate; })[0];
    var label = day ? day.weekday.toUpperCase() + " " + day.day : "";
    var who = me();
    panel.innerHTML =
      '<div class="acs-dates">' + d.days.map(function (x) { return dayHtml(x, d.selectedDate); }).join("") + "</div>" +
      '<div class="acs-label">MY SHIFTS <span>· ' + esc(label) + "</span></div>" +
      (d.shifts.length ? '<div class="acs-list">' + d.shifts.map(shiftHtml).join("") + "</div>" : emptyHtml("No shifts", "You have no shifts on this day.")) +
      '<div class="acs-label" style="margin-top:26px">MY REPLACEMENT REQUESTS</div>' +
      (d.requests.length
        ? '<div class="acs-list">' + d.requests.map(function (r) { return requestHtml(r, who); }).join("") + "</div>"
        : emptyHtml("No replacement requests", "Tap Replace on a shift to ask for cover."));
  }

  function load() {
    state.loading = true;
    var date = state.date;
    return api("/mobile/shifts/mine" + (date ? "?date=" + encodeURIComponent(date) : ""))
      .then(function (data) {
        if (date !== state.date) return;
        state.data = data;
        state.date = data.selectedDate;
        state.error = null;
        state.loadedAt = Date.now();
      })
      .catch(function (err) {
        state.error = err.message;
      })
      .then(function () {
        state.loading = false;
        render();
      });
  }

  /* ── Reason sheet ───────────────────────────────────────────────────────── */

  var sheet = null;

  function openSheet(shiftId, line) {
    closeSheet();
    var reasons = (state.data && state.data.reasons) || ["Family emergency", "Illness", "Personal", "Transport", "Other"];
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="asr-scrim" data-open="false">' +
      '<div class="asr-sheet">' +
      '<div class="asr-grip"></div>' +
      '<div class="asr-sheet-title">Request Replacement</div>' +
      '<div class="asr-sheet-sub">' + esc(line) + "</div>" +
      '<div class="asr-section-label">Reason</div>' +
      '<div class="asr-picks">' + reasons.map(function (p) { return '<button class="asr-pick" data-on="false" data-reason="' + esc(p) + '">' + esc(p) + "</button>"; }).join("") + "</div>" +
      '<textarea class="asr-textarea" maxlength="' + MAX_DETAILS + '" placeholder="Add details…"></textarea>' +
      '<div class="asr-count">0 / ' + MAX_DETAILS + "</div>" +
      '<div class="asr-error" role="alert"></div>' +
      '<div class="asr-actions">' +
      '<button class="asr-btn" data-kind="ghost">Cancel</button>' +
      '<button class="asr-btn" data-kind="submit" data-disabled="true">Submit Request</button>' +
      "</div></div></div>";
    sheet = wrap.firstChild;
    document.body.appendChild(sheet);

    var submit = sheet.querySelector('[data-kind="submit"]');
    var text = sheet.querySelector(".asr-textarea");
    var count = sheet.querySelector(".asr-count");
    var error = sheet.querySelector(".asr-error");
    var reason = null;

    text.addEventListener("input", function () { count.textContent = text.value.length + " / " + MAX_DETAILS; });
    sheet.addEventListener("click", function (e) {
      if (e.target === sheet || e.target.closest('[data-kind="ghost"]')) return closeSheet();
      var pick = e.target.closest(".asr-pick");
      if (pick) {
        reason = pick.dataset.reason;
        sheet.querySelectorAll(".asr-pick").forEach(function (p) { p.dataset.on = String(p === pick); });
        submit.dataset.disabled = "false";
        return;
      }
      if (!e.target.closest('[data-kind="submit"]') || submit.dataset.disabled === "true") return;
      var details = text.value.trim();
      if (reason === "Other" && !details) { error.textContent = "Add a few words about why you need cover."; return; }
      error.textContent = "";
      submit.dataset.disabled = "true";
      submit.textContent = "Submitting…";
      api("/mobile/shifts/" + encodeURIComponent(shiftId) + "/replacement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details ? { reason: reason, details: details } : { reason: reason }),
      })
        .then(function () {
          closeSheet();
          return load();
        })
        .catch(function (err) {
          error.textContent = err.message;
          submit.dataset.disabled = "false";
          submit.textContent = "Submit Request";
        });
    });
    setTimeout(function () { if (sheet) sheet.dataset.open = "true"; }, 16);
  }

  function closeSheet() {
    if (sheet) sheet.remove();
    sheet = null;
  }

  function cancelRequest(button) {
    if (!window.confirm("Cancel this replacement request?")) return;
    button.disabled = true;
    button.textContent = "Cancelling…";
    api("/mobile/shifts/replacements/" + encodeURIComponent(button.dataset.request) + "/cancel", { method: "POST" })
      .then(load)
      .catch(function (err) {
        window.alert(err.message);
        load();
      });
  }

  function buildPanel() {
    var el = document.createElement("div");
    el.className = "acs-panel";
    el.dataset.asrPanel = "true";
    el.addEventListener("click", function (e) {
      var day = e.target.closest(".acs-day");
      if (day) {
        if (day.dataset.date === state.date) return;
        state.date = day.dataset.date;
        el.querySelectorAll(".acs-day").forEach(function (d) { d.dataset.selected = String(d === day); });
        load();
        return;
      }
      var replace = e.target.closest(".asr-replace[data-shift]");
      if (replace) return openSheet(replace.dataset.shift, replace.dataset.line);
      var cancel = e.target.closest(".asr-cancel[data-request]");
      if (cancel) return cancelRequest(cancel);
      if (e.target.closest(".acs-retry")) load();
    });
    return el;
  }

  /* ── Tab plumbing ───────────────────────────────────────────────────────── */

  /* The active tab is the one the bundle paints solid white. */
  function activeTab() {
    var buttons = document.querySelectorAll("#root button");
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (b.style.color === "rgb(255, 255, 255)" && b.style.flex === "1 1 0%") return b.textContent.trim();
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
    var content = strip && strip.parentElement.nextElementSibling;
    if (!content) {
      panel = null;
      closeSheet();
      return;
    }

    var on = activeTab() === TAB;
    var mine = content.querySelector("[data-asr-panel]");
    if (on && !mine) {
      mine = panel = buildPanel();
      content.appendChild(mine);
      state.date = null;
      render();
      load();
    } else if (mine) {
      panel = mine;
      if (on && !state.loading && Date.now() - state.loadedAt > 30000) load();
    }
    var want = on ? "flex" : "none";
    if (mine && mine.style.display !== want) mine.style.display = want;

    /* Close the sheet when the tab is left. */
    if (!on) closeSheet();

    /* Hide the bundle's own children while our panel is showing. */
    for (var i = 0; i < content.children.length; i++) {
      var child = content.children[i];
      if (child.dataset.asrPanel || child.dataset.acsPanel || child.dataset.atoPanel) continue;
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

  window.AlexiosShiftReplacement = { apply: apply, reload: load };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
