/* ============================================================================
 * ALEXIOS Mobile — Claim Shift (real data)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * Open (unassigned, published) shifts the guard can pick up, from the API:
 *
 *   GET  /mobile/shifts/open?date=YYYY-MM-DD   7-day strip with counts + that day's shifts
 *   POST /mobile/shifts/:id/claim              claim (pending until a supervisor approves)
 *   POST /mobile/shifts/claims/:id/withdraw    take back a claim not yet decided
 *
 * Each shift says whether the guard can claim it and, if not, why (an overlapping
 * shift, time off, a site ban, work-policy hours…), using the same checks the
 * scheduler's assignment runs. A supervisor approves claims in the CRM's Schedule
 * Requests drawer, which assigns the shift.
 *
 * When the Claim Shift tab is active the bundle's own content is hidden and this
 * panel is shown in its place. Bundle nodes are React-owned, so they are hidden
 * with display:none rather than removed. A MutationObserver re-applies after
 * every re-render.
 * ========================================================================== */
(function () {
  "use strict";

  var TAB = "Claim Shift";
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

  /* ── Rendering ──────────────────────────────────────────────────────────── */

  function chip(text, tone) {
    return '<span class="acs-chip"' + (tone ? ' data-tone="' + tone + '"' : "") + ">" + esc(text) + "</span>";
  }

  function eyebrow(s) {
    if (s.myClaim && s.myClaim.status === "pending") return "Requested";
    if (s.urgent) return "Urgent · In " + Math.max(1, Math.round(s.startsInHours)) + "h";
    return "Open · " + s.position.title;
  }

  function cardState(s) {
    if (s.myClaim && s.myClaim.status === "pending") return "requested";
    return s.urgent ? "urgent" : "open";
  }

  function actionHtml(s) {
    var claim = s.myClaim;
    if (claim && claim.status === "pending") {
      return '<button class="acs-action" data-variant="pending" disabled>' + esc(claim.statusLabel) + "</button>" +
        '<button class="acs-withdraw" data-claim="' + esc(claim.id) + '">Withdraw request</button>';
    }
    if (claim && claim.status === "approved") {
      return '<button class="acs-action" data-variant="pending" disabled>Approved · Yours</button>';
    }
    if (!s.canClaim) {
      return '<button class="acs-action" data-variant="blocked" disabled>Can’t claim</button>' +
        (s.blocker ? '<div class="acs-blocker">' + esc(s.blocker.message) + "</div>" : "");
    }
    var note = claim && claim.status === "declined" ? '<div class="acs-blocker">Your earlier claim was declined.</div>' : "";
    return '<button class="acs-action" data-shift="' + esc(s.id) + '">Claim Shift</button>' + note;
  }

  function cardHtml(s) {
    var chips = [chip(s.hours + "h"), chip(s.position.title)];
    return (
      '<div class="acs-card" data-state="' + cardState(s) + '">' +
      '<div class="acs-top">' +
      '<div class="acs-eyebrow">' + esc(eyebrow(s)) + "</div>" +
      '<div class="acs-time">' + esc(s.time) + "</div>" +
      "</div>" +
      '<div class="acs-title">' + esc(s.title ? s.site.name + " — " + s.title : s.site.name) + "</div>" +
      '<div class="acs-chips">' + chips.join("") + "</div>" +
      (s.notes ? '<div class="acs-notes">' + esc(s.notes) + "</div>" : "") +
      actionHtml(s) +
      "</div>"
    );
  }

  function dayHtml(d, selected) {
    return (
      '<div class="acs-day" data-selected="' + (d.date === selected) + '" data-empty="' + (d.openShifts === 0) + '" data-date="' + d.date + '">' +
      (d.openShifts ? '<div class="acs-day-count">' + d.openShifts + "</div>" : "") +
      '<span class="acs-day-name">' + esc(d.weekday) + "</span>" +
      '<span class="acs-day-num">' + d.day + "</span>" +
      "</div>"
    );
  }

  function emptyHtml(title, sub, retry) {
    return (
      '<div class="acs-empty" data-show="true">' +
      '<div class="acs-empty-icon">' + CAL_ICON + "</div>" +
      '<div class="acs-empty-title">' + esc(title) + "</div>" +
      '<div class="acs-empty-sub">' + esc(sub) + "</div>" +
      (retry ? '<button class="acs-retry">Try again</button>' : "") +
      "</div>"
    );
  }

  function render() {
    if (!panel) return;
    var d = state.data;
    if (!d) {
      panel.innerHTML = state.error ? emptyHtml("Couldn’t load open shifts", state.error, true) : emptyHtml("Loading open shifts…", "");
      return;
    }
    var day = d.days.filter(function (x) { return x.date === d.selectedDate; })[0];
    var label = day ? day.weekday.toUpperCase() + " " + day.day : "";
    panel.innerHTML =
      '<div class="acs-dates">' + d.days.map(function (x) { return dayHtml(x, d.selectedDate); }).join("") + "</div>" +
      (d.pendingClaims
        ? '<div class="acs-summary">' + d.pendingClaims + " claim" + (d.pendingClaims === 1 ? "" : "s") + " awaiting your supervisor</div>"
        : "") +
      '<div class="acs-label">UNASSIGNED SHIFTS <span>· ' + esc(label) + "</span></div>" +
      (d.shifts.length
        ? '<div class="acs-list">' + d.shifts.map(cardHtml).join("") + "</div>"
        : emptyHtml("No open shifts", "Nothing unassigned on this day."));
  }

  function load() {
    state.loading = true;
    var date = state.date;
    return api("/mobile/shifts/open" + (date ? "?date=" + encodeURIComponent(date) : ""))
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

  function claim(button) {
    button.disabled = true;
    button.textContent = "Claiming…";
    api("/mobile/shifts/" + encodeURIComponent(button.dataset.shift) + "/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(load)
      .catch(function (err) {
        window.alert(err.message);
        load();
      });
  }

  function withdraw(button) {
    if (!window.confirm("Withdraw your claim for this shift?")) return;
    button.disabled = true;
    button.textContent = "Withdrawing…";
    api("/mobile/shifts/claims/" + encodeURIComponent(button.dataset.claim) + "/withdraw", { method: "POST" })
      .then(load)
      .catch(function (err) {
        window.alert(err.message);
        load();
      });
  }

  function buildPanel() {
    var el = document.createElement("div");
    el.className = "acs-panel";
    el.dataset.acsPanel = "true";
    el.addEventListener("click", function (e) {
      var day = e.target.closest(".acs-day");
      if (day) {
        if (day.dataset.date === state.date) return;
        state.date = day.dataset.date;
        el.querySelectorAll(".acs-day").forEach(function (d) { d.dataset.selected = String(d === day); });
        load();
        return;
      }
      var action = e.target.closest(".acs-action[data-shift]");
      if (action) return claim(action);
      var back = e.target.closest(".acs-withdraw[data-claim]");
      if (back) return withdraw(back);
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
    /* The tab strip sits in its own padded wrapper; the bundle's content
       column is the next sibling of that wrapper. */
    var content = strip && strip.parentElement.nextElementSibling;
    if (!content) {
      panel = null;
      return;
    }

    var on = activeTab() === TAB;
    var mine = content.querySelector("[data-acs-panel]");
    if (on && !mine) {
      mine = panel = buildPanel();
      content.appendChild(mine);
      state.date = null;
      render();
      load();
    } else if (mine) {
      panel = mine;
      /* Back on the tab after a while: shifts may have been filled or opened. */
      if (on && !state.loading && Date.now() - state.loadedAt > 30000) load();
    }
    var want = on ? "flex" : "none";
    if (mine && mine.style.display !== want) mine.style.display = want;

    /* Hide the bundle's own children while our panel is showing. */
    for (var i = 0; i < content.children.length; i++) {
      var child = content.children[i];
      if (child.dataset.acsPanel || child.dataset.asrPanel || child.dataset.atoPanel) continue;
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

  window.AlexiosClaimShift = { apply: apply, reload: load };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
