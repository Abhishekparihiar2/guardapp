/* ============================================================================
 * ALEXIOS Mobile — Schedule (real data)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * The bundle's Schedule screen is a mock-up (a fixed officer, Aug dates, one
 * "Day Shift — Tower B" card). This keeps its header and back button, puts the
 * guard's real name and officer ID in the subtitle, and replaces the body with
 * the guard's own schedule:
 *
 *   GET /mobile/schedule?date=YYYY-MM-DD
 *     → 14-day strip (shift counts, time off), the day's shifts with live
 *       status, supervisor, duties (tour + required tasks) and time off.
 *
 * "Shifts only" / "All items" toggles time off cards in the day's list.
 * View duties opens a sheet; on duty it links into the real tour / task
 * screens patrol.js provides. The Home "Schedule" tile shows today's shift.
 *
 * Bundle nodes are React-owned, so they are hidden with display:none rather
 * than removed (same approach as time-off.js).
 * ========================================================================== */
(function () {
  "use strict";

  var state = { date: null, showAll: false, loading: false, data: null, error: null, loadedAt: 0 };
  var panel = null;
  var subtitleText = null;

  /* ── Helpers ───────────────────────────────────────────────────────────── */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function api(path) {
    if (!window.AlexiosAuth || !window.AlexiosAuth.token()) return Promise.reject(new Error("Not signed in"));
    return window.AlexiosAuth.fetch(path).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) throw new Error((body && body.message) || "Couldn't load your schedule. Try again.");
        return body.data;
      });
    });
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function fmtDate(ymd) {
    var p = String(ymd).split("-");
    return MONTHS[Number(p[1]) - 1] + " " + Number(p[2]) + ", " + p[0];
  }

  function fmtHours(h) {
    return (Math.round(h * 10) / 10).toFixed(1) + " hrs";
  }

  /** A real instant shown in the site's own time zone, e.g. 09:02 AM. */
  function fmtClock(iso, timeZone) {
    try {
      return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: timeZone }).format(new Date(iso));
    } catch (e) {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  }

  function fmtStartsIn(min) {
    if (min == null) return "";
    if (min < 60) return "Starts in " + Math.max(1, min) + " min";
    if (min < 24 * 60) return "Starts in " + Math.round(min / 60) + " h";
    return "";
  }

  var TONE = {
    upcoming: "upcoming", current: "warn", on_duty: "live", on_break: "break",
    completed: "done", missed: "bad", no_clock_out: "warn"
  };

  /* ── Rendering ─────────────────────────────────────────────────────────── */

  function buildPanel() {
    var wrap = document.createElement("div");
    wrap.className = "asch-panel";
    wrap.dataset.aschPanel = "true";
    wrap.addEventListener("click", onClick);
    return wrap;
  }

  function dayStrip(d) {
    return '<div class="asch-dates" role="tablist" aria-label="Days">' + d.days.map(function (day) {
      var sel = day.date === d.selectedDate;
      return '<button type="button" class="asch-day" role="tab" aria-selected="' + sel + '" data-date="' + day.date + '"' +
        ' data-selected="' + sel + '" data-today="' + day.isToday + '" data-empty="' + (!day.shifts && !day.timeOff) + '">' +
        '<span class="asch-day-name">' + esc(day.weekday) + "</span>" +
        '<span class="asch-day-num">' + day.day + "</span>" +
        (day.shifts ? '<span class="asch-day-count">' + day.shifts + "</span>" : "") +
        (day.timeOff ? '<span class="asch-day-off" data-tone="' + day.timeOff + '" title="Time off ' + day.timeOff + '"></span>' : "") +
        "</button>";
    }).join("") + "</div>";
  }

  function shiftCard(s) {
    var tone = TONE[s.status] || "upcoming";
    var dutyCount = (s.duties.tour ? 1 : 0) + s.duties.tasks.length;
    var meta = [s.position.title, s.position.description, fmtHours(s.hours)].filter(Boolean).join(" · ");
    var clock = "";
    if (s.clockedInAt) {
      clock = "Clocked in " + fmtClock(s.clockedInAt, s.site.timezone) +
        (s.clockedOutAt ? " · out " + fmtClock(s.clockedOutAt, s.site.timezone) : "") +
        (s.workedHours != null ? " · " + fmtHours(s.workedHours) + " worked" : "");
    }
    var hint = s.status === "upcoming" ? fmtStartsIn(s.startsInMinutes)
      : s.status === "current" ? "Not clocked in yet"
      : s.status === "missed" ? "No clock-in recorded"
      : s.status === "no_clock_out" ? "Clock-out was never recorded — tell your supervisor"
      : "";
    return '<article class="asch-card" data-tone="' + tone + '">' +
      '<div class="asch-card-top">' +
        '<span class="asch-status"><i></i>' + esc(s.statusLabel) + "</span>" +
        '<span class="asch-date">' + esc(fmtDate(s.date)) + "</span>" +
      "</div>" +
      '<h3 class="asch-title">' + esc(s.title) + "</h3>" +
      '<div class="asch-time">' + esc(s.time) + "</div>" +
      (hint ? '<div class="asch-hint">' + esc(hint) + "</div>" : "") +
      (s.coverRequested ? '<div class="asch-chip">Cover requested · waiting for your supervisor</div>' : "") +
      '<div class="asch-line"><span aria-hidden="true">📍</span><span>' + esc(s.site.name + (s.site.address ? " — " + s.site.address : "")) + "</span></div>" +
      '<div class="asch-line"><span aria-hidden="true">🛡️</span><span>' + esc(meta) + "</span></div>" +
      (clock ? '<div class="asch-line asch-clock"><span aria-hidden="true">⏱</span><span>' + esc(clock) + "</span></div>" : "") +
      (s.notes ? '<div class="asch-notes">' + esc(s.notes) + "</div>" : "") +
      '<div class="asch-foot">' +
        '<span class="asch-sup">' + (s.supervisor ? "Supervisor: " + esc(s.supervisor.name) : "No supervisor assigned") + "</span>" +
        '<button type="button" class="asch-duties" data-duties="' + esc(s.id) + '">' +
          (dutyCount ? "View duties (" + dutyCount + ")" : "View duties") + " →</button>" +
      "</div>" +
    "</article>";
  }

  function timeOffCard(t) {
    return '<article class="asch-card asch-off" data-tone="' + (t.status === "approved" ? "off" : "warn") + '">' +
      '<div class="asch-card-top">' +
        '<span class="asch-status"><i></i>Time off · ' + esc(t.statusLabel) + "</span>" +
        '<span class="asch-date">' + esc(t.startDate === t.endDate ? fmtDate(t.startDate) : fmtDate(t.startDate) + " – " + fmtDate(t.endDate)) + "</span>" +
      "</div>" +
      '<h3 class="asch-title">' + esc(t.leaveTypeLabel) + " leave</h3>" +
      '<div class="asch-line"><span aria-hidden="true">🗓️</span><span>' + esc(t.days + (t.days === 1 ? " day" : " days") + " · " + fmtHours(t.totalHours)) + "</span></div>" +
      (t.notes ? '<div class="asch-notes">' + esc(t.notes) + "</div>" : "") +
    "</article>";
  }

  function nextDayWithShifts(d) {
    for (var i = 0; i < d.days.length; i++) {
      if (d.days[i].date > d.selectedDate && d.days[i].shifts) return d.days[i];
    }
    return null;
  }

  function render() {
    if (!panel) return;
    var d = state.data;
    if (!d) {
      panel.innerHTML = state.error
        ? '<div class="asch-empty"><b>Couldn\'t load your schedule</b><span>' + esc(state.error) + '</span><button type="button" class="asch-retry" data-retry="1">Try again</button></div>'
        : '<div class="asch-empty"><span class="asch-spinner" aria-hidden="true"></span><span>Loading your schedule…</span></div>';
      return;
    }
    var weekday = d.selectedLabel.split(",")[0].toUpperCase();
    var items = d.shifts.map(shiftCard);
    if (state.showAll) items = d.timeOff.map(timeOffCard).concat(items);
    var count = d.shifts.length + (state.showAll ? d.timeOff.length : 0);

    var body;
    if (items.length) {
      body = '<div class="asch-list">' + items.join("") + "</div>";
    } else {
      var next = nextDayWithShifts(d);
      var offNote = !state.showAll && d.timeOff.length ? '<span>You have time off this day — tap “All items” to see it.</span>' : "";
      body = '<div class="asch-empty"><b>No shifts on ' + esc(d.selectedLabel) + "</b>" + offNote +
        (next ? '<button type="button" class="asch-retry" data-date="' + next.date + '">Next shift: ' + esc(next.weekday + " " + next.day + " " + next.month) + " →</button>" : "") +
        "</div>";
    }

    panel.innerHTML =
      dayStrip(d) +
      '<div class="asch-body">' +
        '<div class="asch-head">' +
          '<div class="asch-label">GUARD SHIFTS · ' + esc(weekday) + " (" + count + ")</div>" +
          '<button type="button" class="asch-toggle" data-toggle="1" aria-pressed="' + state.showAll + '">' + (state.showAll ? "ALL ITEMS" : "SHIFTS ONLY") + "</button>" +
        "</div>" + body +
      "</div>" +
      (state.loading ? '<div class="asch-refreshing" aria-hidden="true"></div>' : "");

    var sel = panel.querySelector('.asch-day[data-selected="true"]');
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: "nearest", inline: "center" });
  }

  /* ── Duties sheet ──────────────────────────────────────────────────────── */

  function openDuties(shift) {
    closeDuties();
    var onShift = shift.status === "on_duty" || shift.status === "on_break";
    var patrol = window.AlexiosPatrol;
    var tour = shift.duties.tour;
    var rows = [];
    if (tour) {
      rows.push('<div class="asch-duty"><b>Tour · ' + esc(tour.name) + "</b><span>" +
        esc(tour.checkpoints + " checkpoint" + (tour.checkpoints === 1 ? "" : "s") + (tour.estDurationMin ? " · about " + tour.estDurationMin + " min" : "")) + "</span></div>");
    }
    shift.duties.tasks.forEach(function (t) {
      var done = t.status === "completed";
      rows.push('<div class="asch-duty" data-done="' + done + '"><b>' + esc(t.label) + "</b><span>" +
        esc(t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1).replace(/_/g, " ") : "Shift task") + "</span></div>");
    });
    var actions = "";
    if (onShift && patrol) {
      if (tour) actions += '<button type="button" class="asch-sheet-btn" data-open="tours">Open tours</button>';
      if (shift.duties.tasks.length) actions += '<button type="button" class="asch-sheet-btn" data-open="tasks">Open tasks</button>';
    }
    var wrap = document.createElement("div");
    wrap.className = "asch-sheet-backdrop";
    wrap.innerHTML =
      '<div class="asch-sheet" role="dialog" aria-modal="true" aria-label="Shift duties">' +
        '<div class="asch-sheet-grip"></div>' +
        '<div class="asch-sheet-title">' + esc(shift.title) + "</div>" +
        '<div class="asch-sheet-sub">' + esc(fmtDate(shift.date) + " · " + shift.time) + "</div>" +
        (rows.length ? '<div class="asch-duty-list">' + rows.join("") + "</div>" : '<div class="asch-empty"><span>No tour or tasks are set for this shift.</span></div>') +
        (rows.length && !onShift ? '<div class="asch-sheet-note">You can start these once you clock in for this shift.</div>' : "") +
        '<div class="asch-sheet-actions">' + actions + '<button type="button" class="asch-sheet-btn" data-close="1">Close</button></div>' +
      "</div>";
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap || e.target.closest("[data-close]")) { closeDuties(); return; }
      var open = e.target.closest("[data-open]");
      if (open && patrol) {
        closeDuties();
        if (open.dataset.open === "tours") patrol.openTours();
        else patrol.openTasks();
      }
    });
    document.body.appendChild(wrap);
  }

  function closeDuties() {
    var old = document.querySelector(".asch-sheet-backdrop");
    if (old) old.remove();
  }

  /* ── Events & loading ──────────────────────────────────────────────────── */

  function onClick(e) {
    var day = e.target.closest("[data-date]");
    if (day) { if (day.dataset.date !== (state.data && state.data.selectedDate)) load(day.dataset.date); return; }
    if (e.target.closest("[data-toggle]")) { state.showAll = !state.showAll; render(); return; }
    if (e.target.closest("[data-retry]")) { load(state.date); return; }
    var duties = e.target.closest("[data-duties]");
    if (duties && state.data) {
      var shift = state.data.shifts.filter(function (s) { return s.id === duties.dataset.duties; })[0];
      if (shift) openDuties(shift);
    }
  }

  var requestSeq = 0;

  function load(date) {
    var seq = ++requestSeq;
    state.loading = true;
    state.date = date === undefined ? state.date : date;
    state.error = null;
    render();
    var asked = state.date;
    return api("/mobile/schedule" + (asked ? "?date=" + encodeURIComponent(asked) : ""))
      .then(function (data) {
        if (seq !== requestSeq) return;
        state.data = data;
        state.date = data.selectedDate;
        state.loadedAt = Date.now();
        subtitleText = ("Officer " + data.officer.name + (data.officer.officerId ? " · " + data.officer.officerId : "")).toUpperCase();
        paintSubtitle();
        if (data.selectedDate === data.today) paintHomeTile(data);
      })
      .catch(function (err) {
        if (seq !== requestSeq) return;
        state.error = err.message;
        // Keep showing the last day only if it's the one that failed to refresh.
        if (state.data && asked && state.data.selectedDate !== asked) state.data = null;
      })
      .then(function () {
        if (seq !== requestSeq) return;
        state.loading = false;
        render();
      });
  }

  /* ── Screen plumbing ───────────────────────────────────────────────────── */

  /** The bundle's Schedule header: title "SCHEDULE" with the officer line under it. */
  function findScreen() {
    var leaves = document.querySelectorAll("#root div");
    for (var i = 0; i < leaves.length; i++) {
      var n = leaves[i];
      if (n.childElementCount === 0 && n.textContent.trim() === "SCHEDULE") {
        var sub = n.nextElementSibling;
        var header = n.parentElement && n.parentElement.parentElement;
        var body = header && header.nextElementSibling;
        if (sub && body) return { subtitle: sub, body: body };
      }
    }
    return null;
  }

  function paintSubtitle() {
    var screen = findScreen();
    if (screen && subtitleText && screen.subtitle.textContent !== subtitleText) screen.subtitle.textContent = subtitleText;
  }

  function apply() {
    var screen = findScreen();
    if (!screen) {
      if (panel && !panel.isConnected) panel = null;
      closeDuties();
      return;
    }
    var body = screen.body;
    var mine = body.querySelector("[data-asch-panel]");
    if (!mine) {
      mine = panel = buildPanel();
      body.appendChild(mine);
      render();
      // Opening the screen starts from today; coming back within 30 s keeps the chosen day.
      if (!state.data || Date.now() - state.loadedAt > 30000) load(null);
    } else {
      panel = mine;
    }
    for (var i = 0; i < body.children.length; i++) {
      var child = body.children[i];
      if (child === mine || child.dataset.aschHidden) continue;
      child.dataset.aschHidden = "true";
      child.style.display = "none";
    }
    paintSubtitle();
  }

  /* ── Home tile: today's shift under "Schedule" ─────────────────────────── */

  var homeTileText = null;

  function paintHomeTile(data) {
    if (data) {
      var first = data.shifts[0];
      homeTileText = first ? first.time + (data.shifts.length > 1 ? " +" + (data.shifts.length - 1) : "")
        : data.timeOff.some(function (t) { return t.status === "approved"; }) ? "Time off today" : "No shift today";
    }
    if (!homeTileText) return;
    var leaves = document.querySelectorAll("#root div");
    for (var i = 0; i < leaves.length; i++) {
      var n = leaves[i];
      if (n.childElementCount === 0 && n.textContent.trim() === "Schedule" && n.nextElementSibling && !findScreen()) {
        if (n.nextElementSibling.textContent !== homeTileText) n.nextElementSibling.textContent = homeTileText;
        return;
      }
    }
  }

  function refreshHomeTile() {
    if (!window.AlexiosAuth || !window.AlexiosAuth.token()) return;
    api("/mobile/schedule").then(paintHomeTile).catch(function () { /* keep the last text */ });
  }

  function start() {
    var root = document.getElementById("root");
    if (!root) { setTimeout(start, 300); return; }
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; apply(); paintHomeTile(); }, 60);
    }).observe(root, { childList: true, subtree: true, characterData: true });
    apply();
    setTimeout(refreshHomeTile, 1500);
    // Statuses move with the clock (upcoming → current → missed): refresh while the screen is open.
    setInterval(function () {
      if (panel && panel.isConnected && !state.loading) load(state.date);
    }, 60 * 1000);
    setInterval(refreshHomeTile, 5 * 60 * 1000);
  }

  window.AlexiosSchedule = { apply: apply, reload: function () { return load(state.date); }, open: function (date) { return load(date); } };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
