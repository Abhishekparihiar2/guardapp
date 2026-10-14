/* ============================================================================
 * ALEXIOS Mobile — Time Off (real data)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * The bundle's Time Off screen is mock-up only: a fixed officer card, three
 * hard-coded leave rows, and a form whose Submit just goes back. When the
 * "Time Off Request" tab is active this panel replaces that content with the
 * guard's own requests from the API, a request form, and Cancel on pending
 * requests:
 *
 *   GET  /mobile/time-off?status=…   list + counts
 *   POST /mobile/time-off            { leaveType, startDate, endDate, totalHours?, notes? }
 *   POST /mobile/time-off/:id/cancel withdraw a pending request
 *
 * Bundle nodes are React-owned, so they are hidden with display:none rather
 * than removed (same approach as claim-shift.js). The form is our own sheet,
 * since the bundle keeps its form values in React state we can't reach.
 * ========================================================================== */
(function () {
  "use strict";

  var TAB = "Time Off Request";
  var FILTERS = [
    { key: "upcoming", label: "Upcoming" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "history", label: "History" },
  ];
  var TYPES = [
    { value: "pto", label: "PTO" },
    { value: "sick", label: "Sick" },
    { value: "unpaid", label: "Unpaid" },
    { value: "other", label: "Other" },
  ];

  var state = { filter: "upcoming", loading: false, data: null, error: null, loadedAt: 0 };
  var panel = null;

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

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function fmtDate(ymd) {
    var p = String(ymd).split("-");
    return MONTHS[Number(p[1]) - 1] + " " + Number(p[2]) + ", " + p[0];
  }

  function fmtRange(r) {
    return r.startDate === r.endDate ? fmtDate(r.startDate) : fmtDate(r.startDate) + " – " + fmtDate(r.endDate);
  }

  function fmtHours(h) {
    var whole = Math.floor(h);
    var mins = Math.round((h - whole) * 60);
    return whole + "h" + (mins ? " " + mins + "m" : "");
  }

  function todayYmd() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function daysBetween(a, b) {
    return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000) + 1;
  }

  /* ── Rendering ──────────────────────────────────────────────────────────── */

  function cardHtml(r) {
    return (
      '<div class="ato-card" data-status="' + esc(r.status) + '">' +
      '<div class="ato-card-top">' +
      '<div class="ato-range">' + esc(fmtRange(r)) + "</div>" +
      '<span class="ato-badge" data-status="' + esc(r.status) + '">' + esc(r.statusLabel) + "</span>" +
      "</div>" +
      '<div class="ato-meta">' +
      '<span class="ato-chip">' + esc(r.leaveTypeLabel) + "</span>" +
      '<span class="ato-chip">' + r.days + (r.days === 1 ? " day" : " days") + "</span>" +
      '<span class="ato-chip">' + esc(fmtHours(r.totalHours)) + "</span>" +
      "</div>" +
      (r.notes ? '<div class="ato-notes">' + esc(r.notes) + "</div>" : "") +
      (r.canCancel ? '<button class="ato-cancel" data-id="' + esc(r.id) + '">Cancel request</button>' : "") +
      "</div>"
    );
  }

  function render() {
    if (!panel) return;
    var d = state.data;
    var s = d ? d.summary : { pending: 0, approved: 0, declined: 0 };
    var next = d && d.summary.nextApproved;
    var list;
    if (state.error && !d) {
      list = '<div class="ato-empty"><div class="ato-empty-title">Couldn’t load time off</div>' +
        '<div class="ato-empty-sub">' + esc(state.error) + '</div><button class="ato-retry">Try again</button></div>';
    } else if (!d) {
      list = '<div class="ato-empty"><div class="ato-empty-sub">Loading…</div></div>';
    } else if (!d.requests.length) {
      list = '<div class="ato-empty"><div class="ato-empty-title">No requests here</div>' +
        '<div class="ato-empty-sub">' + (state.filter === "upcoming" ? "Tap Request Time Off to ask for leave." : "Nothing in this list yet.") + "</div></div>";
    } else {
      list = d.requests.map(cardHtml).join("");
    }

    panel.innerHTML =
      '<div class="ato-stats">' +
      '<div class="ato-stat" data-tone="pending"><b>' + s.pending + "</b><span>Pending</span></div>" +
      '<div class="ato-stat" data-tone="approved"><b>' + s.approved + "</b><span>Approved</span></div>" +
      '<div class="ato-stat" data-tone="declined"><b>' + s.declined + "</b><span>Declined</span></div>" +
      "</div>" +
      (next ? '<div class="ato-next">Next approved leave · <b>' + esc(fmtRange(next)) + "</b> (" + esc(next.leaveTypeLabel) + ")</div>" : "") +
      '<div class="ato-filters">' +
      FILTERS.map(function (f) {
        return '<button class="ato-filter" data-filter="' + f.key + '" data-on="' + (f.key === state.filter) + '">' + f.label + "</button>";
      }).join("") +
      "</div>" +
      '<div class="ato-list">' + list + "</div>" +
      '<button class="ato-primary ato-open-form">Request Time Off</button>';
  }

  function load() {
    state.loading = true;
    var filter = state.filter;
    return api("/mobile/time-off?status=" + encodeURIComponent(filter))
      .then(function (data) {
        if (filter !== state.filter) return;
        state.data = data;
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

  /* ── Request form (our own sheet) ──────────────────────────────────────── */

  function openForm() {
    if (document.querySelector(".ato-sheet-backdrop")) return;
    var today = todayYmd();
    var wrap = document.createElement("div");
    wrap.className = "ato-sheet-backdrop";
    wrap.innerHTML =
      '<form class="ato-sheet" novalidate>' +
      '<div class="ato-sheet-head"><div><div class="ato-sheet-title">NEW REQUEST</div><div class="ato-sheet-sub">LEAVE APPLICATION</div></div>' +
      '<button type="button" class="ato-x" aria-label="Close">×</button></div>' +
      '<label class="ato-field-label">TYPE OF LEAVE</label>' +
      '<div class="ato-types">' +
      TYPES.map(function (t, i) {
        return '<button type="button" class="ato-type" data-value="' + t.value + '" data-on="' + (i === 0) + '">' + t.label + "</button>";
      }).join("") +
      "</div>" +
      '<div class="ato-row">' +
      '<div><label class="ato-field-label" for="ato-start">START DATE</label><input id="ato-start" name="startDate" type="date" min="' + today + '" value="' + today + '" required></div>' +
      '<div><label class="ato-field-label" for="ato-end">END DATE</label><input id="ato-end" name="endDate" type="date" min="' + today + '" value="' + today + '" required></div>' +
      "</div>" +
      '<label class="ato-field-label" for="ato-hours">TOTAL HOURS</label>' +
      '<input id="ato-hours" name="totalHours" type="number" inputmode="decimal" min="0.25" step="0.25" placeholder="8">' +
      '<div class="ato-hint">Leave blank for 8 hours per day.</div>' +
      '<label class="ato-field-label" for="ato-notes">NOTES</label>' +
      '<textarea id="ato-notes" name="notes" maxlength="2000" rows="3" placeholder="Reason or coverage details (optional)"></textarea>' +
      '<div class="ato-error" role="alert"></div>' +
      '<button type="submit" class="ato-primary">Submit Leave Request</button>' +
      '<button type="button" class="ato-secondary ato-close">Cancel</button>' +
      "</form>";
    document.body.appendChild(wrap);

    var form = wrap.querySelector("form");
    var start = form.querySelector("#ato-start");
    var end = form.querySelector("#ato-end");
    var hours = form.querySelector("#ato-hours");
    var errorBox = form.querySelector(".ato-error");
    var submit = form.querySelector("button[type=submit]");
    var leaveType = "pto";

    function close() { wrap.remove(); }
    function syncHint() {
      var days = start.value && end.value && end.value >= start.value ? daysBetween(start.value, end.value) : 1;
      hours.placeholder = String(days * 8);
    }

    wrap.addEventListener("click", function (e) {
      if (e.target === wrap || e.target.closest(".ato-x, .ato-close")) close();
      var type = e.target.closest(".ato-type");
      if (type) {
        leaveType = type.dataset.value;
        form.querySelectorAll(".ato-type").forEach(function (b) { b.dataset.on = String(b === type); });
      }
    });
    start.addEventListener("change", function () {
      end.min = start.value;
      if (end.value < start.value) end.value = start.value;
      syncHint();
    });
    end.addEventListener("change", syncHint);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorBox.textContent = "";
      if (!start.value || !end.value) { errorBox.textContent = "Choose a start and end date."; return; }
      if (end.value < start.value) { errorBox.textContent = "The end date must be on or after the start date."; return; }
      var body = { leaveType: leaveType, startDate: start.value, endDate: end.value };
      if (hours.value !== "") body.totalHours = Number(hours.value);
      var notes = form.querySelector("#ato-notes").value.trim();
      if (notes) body.notes = notes;

      submit.disabled = true;
      submit.textContent = "Submitting…";
      api("/mobile/time-off", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function () {
          close();
          state.filter = "upcoming";
          return load();
        })
        .catch(function (err) {
          errorBox.textContent = err.message;
          submit.disabled = false;
          submit.textContent = "Submit Leave Request";
        });
    });
  }

  function cancelRequest(button) {
    if (!window.confirm("Cancel this time off request?")) return;
    button.disabled = true;
    button.textContent = "Cancelling…";
    api("/mobile/time-off/" + encodeURIComponent(button.dataset.id) + "/cancel", { method: "POST" })
      .then(load)
      .catch(function (err) {
        window.alert(err.message);
        load();
      });
  }

  function buildPanel() {
    var el = document.createElement("div");
    el.className = "ato-panel";
    el.dataset.atoPanel = "true";
    el.addEventListener("click", function (e) {
      var filter = e.target.closest(".ato-filter");
      if (filter) {
        state.filter = filter.dataset.filter;
        state.data = state.data ? Object.assign({}, state.data, { requests: [] }) : null;
        render();
        load();
        return;
      }
      if (e.target.closest(".ato-open-form")) return openForm();
      if (e.target.closest(".ato-retry")) return load();
      var cancel = e.target.closest(".ato-cancel");
      if (cancel) cancelRequest(cancel);
    });
    return el;
  }

  /* ── Tab plumbing (same detection as claim-shift.js) ───────────────────── */

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
      return;
    }

    var on = activeTab() === TAB;
    var mine = content.querySelector("[data-ato-panel]");
    if (on && !mine) {
      mine = panel = buildPanel();
      content.appendChild(mine);
      render();
      load();
    } else if (mine) {
      panel = mine;
      /* Coming back to the screen after a while: refresh statuses the supervisor may have changed. */
      if (on && !state.loading && Date.now() - state.loadedAt > 30000) load();
    }
    var want = on ? "flex" : "none";
    if (mine && mine.style.display !== want) mine.style.display = want;

    for (var i = 0; i < content.children.length; i++) {
      var child = content.children[i];
      if (child.dataset.atoPanel || child.dataset.acsPanel || child.dataset.asrPanel) continue;
      if (on) {
        if (child.style.display !== "none") {
          child.dataset.atoHidden = "true";
          child.style.display = "none";
        }
      } else if (child.dataset.atoHidden) {
        delete child.dataset.atoHidden;
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

  window.AlexiosTimeOff = { apply: apply, reload: load };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
