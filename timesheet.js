/* ============================================================================
 * ALEXIOS Mobile — Timesheets (real data)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * The bundle's Timesheets screen is a mock-up (Marcus Johnson, 08/02–08/08,
 * fixed hours). This keeps its header and back button and replaces the rest
 * with the guard's own hours — the same numbers the admin Timesheets screen
 * shows:
 *
 *   GET  /mobile/timesheet?period=week|month&date=   hours per day, totals, issues
 *   GET  /mobile/timesheet/export?period&date        CSV (Download button)
 *   GET  /mobile/timesheet/requests                  my correction requests
 *   POST /mobile/timesheet/requests                  { date, clockIn, clockOut?, breakMinutes?, reason }
 *   POST /mobile/timesheet/requests/:id/cancel
 *
 * Tap a day for its clock times, issues and approval; past days with a shift
 * can be sent to the supervisor for correction. The Home "Timesheet" tile
 * shows this week's hours.
 * ========================================================================== */
(function () {
  "use strict";

  var state = { period: "week", date: null, loading: false, data: null, error: null, loadedAt: 0 };
  var panel = null;
  var requestSeq = 0;

  /* ── Helpers ───────────────────────────────────────────────────────────── */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function signedIn() { return window.AlexiosAuth && window.AlexiosAuth.token(); }

  function api(path, options) {
    if (!signedIn()) return Promise.reject(new Error("Not signed in"));
    return window.AlexiosAuth.fetch(path, options).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) throw new Error((body && body.message) || "Something went wrong. Try again.");
        return body.data;
      });
    });
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WEEKDAY_LONG = { Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };

  function fmtDate(ymd) {
    var p = String(ymd).split("-");
    return MONTHS[Number(p[1]) - 1] + " " + Number(p[2]) + ", " + p[0];
  }

  function fmtH(h) {
    if (!h) return "0h";
    var r = Math.round(h * 100) / 100;
    return (r % 1 === 0 ? String(r) : String(r).replace(/0+$/, "")) + "h";
  }

  /** "08:57 AM" → "08:57" for <input type=time>. */
  function to24(t) {
    if (!t) return "";
    var m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(t);
    if (!m) return "";
    var h = Number(m[1]) % 12 + (m[3] === "PM" ? 12 : 0);
    return (h < 10 ? "0" : "") + h + ":" + m[2];
  }

  function chipText(day) {
    if (day.status === "none") return "--";
    if (day.status === "upcoming") return fmtH(day.scheduledHours);
    if (day.status === "pto") return "PTO";
    if (day.status === "missing" && !day.hours) return "!";
    return fmtH(day.hours);
  }

  var STATUS_NOTE = {
    ok: "Recorded", edited: "Edited by supervisor", issue: "Needs attention", missing: "Missing clock-out",
    in_progress: "On duty now", upcoming: "Scheduled", pto: "Approved time off", none: "No shift"
  };

  /* ── Rendering ─────────────────────────────────────────────────────────── */

  function buildPanel() {
    var wrap = document.createElement("div");
    wrap.className = "ats-panel";
    wrap.dataset.atsPanel = "true";
    wrap.addEventListener("click", onClick);
    return wrap;
  }

  function dayCell(day, compact) {
    var corr = day.correction && day.correction.status === "pending";
    return '<button type="button" class="ats-cell" data-day="' + day.date + '" data-status="' + day.status + '"' + (compact ? ' data-compact="true"' : "") + ">" +
      '<span class="ats-cell-wd">' + esc(compact ? day.weekday.charAt(0) : day.weekday) + "</span>" +
      '<span class="ats-cell-dn">' + (day.day < 10 ? "0" : "") + day.day + "</span>" +
      '<span class="ats-chip">' + esc(chipText(day)) +
        (day.edited ? '<i class="ats-pen" aria-label="Edited"></i>' : "") +
        (corr ? '<i class="ats-dot" aria-label="Correction requested"></i>' : "") +
      "</span>" +
    "</button>";
  }

  function monthGrid(days) {
    var first = new Date(days[0].date + "T00:00:00Z").getUTCDay();
    var cells = [];
    for (var i = 0; i < first; i++) cells.push('<span class="ats-cell ats-blank"></span>');
    days.forEach(function (d) { cells.push(dayCell(d, true)); });
    return '<div class="ats-month">' + cells.join("") + "</div>";
  }

  function render() {
    if (!panel) return;
    var d = state.data;
    var controls =
      '<div class="ats-top">' +
        '<div class="ats-seg" role="tablist">' +
          '<button type="button" role="tab" data-period="week" aria-selected="' + (state.period === "week") + '">Weekly</button>' +
          '<button type="button" role="tab" data-period="month" aria-selected="' + (state.period === "month") + '">Monthly</button>' +
        "</div>" +
        '<button type="button" class="ats-icon" data-export="1" aria-label="Download timesheet"' + (d ? "" : " disabled") + '>' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>' +
        "</button>" +
      "</div>";

    if (!d) {
      panel.innerHTML = controls + (state.error
        ? '<div class="ats-empty"><b>Couldn\'t load your timesheet</b><span>' + esc(state.error) + '</span><button type="button" class="ats-btn" data-retry="1">Try again</button></div>'
        : '<div class="ats-empty"><span class="ats-spinner" aria-hidden="true"></span><span>Loading your hours…</span></div>');
      return;
    }

    var nav =
      '<div class="ats-row">' +
        '<div class="ats-range">' +
          '<button type="button" data-go="' + esc(d.prevDate || "") + '" aria-label="Previous"' + (d.prevDate ? "" : " disabled") + ">&lt;</button>" +
          '<div><b>' + esc(d.label) + "</b><span>" + (d.isCurrent ? (d.period === "week" ? "THIS WEEK" : "THIS MONTH") : d.dayCount + " DAYS") + "</span></div>" +
          '<button type="button" data-go="' + esc(d.nextDate || "") + '" aria-label="Next"' + (d.nextDate ? "" : " disabled") + ">&gt;</button>" +
        "</div>" +
        '<button type="button" class="ats-req" data-requests="1">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' +
          "<span>Requests</span>" + (d.pendingRequests ? "<b>" + d.pendingRequests + "</b>" : "") +
        "</button>" +
      "</div>";

    var t = d.totals;
    var approval = d.approvalStatus === "approved" ? '<span class="ats-appr" data-s="approved">Approved</span>'
      : d.approvalStatus === "locked" ? '<span class="ats-appr" data-s="locked">Paid · locked</span>'
      : '<span class="ats-appr">Pending approval</span>';

    var card =
      '<section class="ats-card">' +
        '<div class="ats-who">' +
          '<span class="ats-avatar">' + esc(d.officer.initials) + "</span>" +
          '<div class="ats-who-main"><b>' + esc(d.officer.name) + "</b><span>" + esc(d.officer.jobTitle || "Security Officer") + "</span></div>" +
          (d.issueCount ? '<button type="button" class="ats-alert" data-issues="1" aria-label="' + d.issueCount + ' issue(s) this period"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg><b>' + d.issueCount + "</b></button>" : "") +
        "</div>" +
        '<div class="ats-sub"><span>' + (d.period === "week" ? "THIS WEEK'S SHIFTS" : "THIS MONTH'S SHIFTS") + "</span>" + approval + "</div>" +
        (d.period === "week"
          ? '<div class="ats-week">' + d.days.map(function (x) { return dayCell(x, false); }).join("") + "</div>"
          : monthGrid(d.days)) +
        '<div class="ats-legend"><span data-s="ok">Recorded</span><span data-s="edited">Edited</span><span data-s="issue">Issue</span><span data-s="in_progress">On duty</span><span data-s="pto">Time off</span></div>' +
        '<div class="ats-total">' +
          "<span>TOTAL " + (d.period === "week" ? "WEEKLY" : "MONTHLY") + " HOURS</span>" +
          (t.overtimeHours ? '<em class="ats-ot">' + fmtH(t.overtimeHours).toUpperCase() + " OT</em>" : "") +
          "<b>" + fmtH(t.workedHours) + "</b>" +
        "</div>" +
        '<div class="ats-break">' +
          "<span>Scheduled <b>" + fmtH(t.scheduledHours) + "</b></span>" +
          "<span>Regular <b>" + fmtH(t.regularHours) + "</b></span>" +
          (t.ptoHours ? "<span>Time off <b>" + fmtH(t.ptoHours) + "</b></span>" : "") +
          "<span>Shifts <b>" + t.shifts + "</b></span>" +
        "</div>" +
      "</section>" +
      '<p class="ats-hint">Tap a day to see clock times or ask your supervisor to correct it.</p>';

    panel.innerHTML = controls + nav + card + (state.loading ? '<div class="ats-refreshing" aria-hidden="true"></div>' : "");
    if (d.period === "week" && d.isCurrent) {
      var todayCell = panel.querySelector('.ats-week [data-day="' + todayKey(d) + '"]');
      if (todayCell && todayCell.scrollIntoView) todayCell.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }

  function todayKey(d) {
    var last = null;
    d.days.forEach(function (x) { if (x.status !== "upcoming") last = x.date; });
    return last;
  }

  /* ── Sheets ────────────────────────────────────────────────────────────── */

  function sheet(html, onClickInside) {
    closeSheet();
    var wrap = document.createElement("div");
    wrap.className = "ats-sheet-backdrop";
    wrap.innerHTML = '<div class="ats-sheet" role="dialog" aria-modal="true"><div class="ats-grip"></div>' + html + "</div>";
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap || e.target.closest("[data-close]")) { closeSheet(); return; }
      if (onClickInside) onClickInside(e, wrap);
    });
    document.body.appendChild(wrap);
    return wrap;
  }

  function closeSheet() {
    var old = document.querySelector(".ats-sheet-backdrop");
    if (old) old.remove();
  }

  function correctionBlock(c) {
    if (!c) return "";
    return '<div class="ats-corr" data-s="' + c.status + '"><b>Correction · ' + esc(c.statusLabel) + "</b>" +
      "<span>" + esc((c.clockIn || "") + " – " + (c.clockOut || "no clock-out") + (c.breakMinutes != null ? " · " + c.breakMinutes + " min break" : "")) + "</span>" +
      (c.reviewNote ? "<span>Supervisor: " + esc(c.reviewNote) + "</span>" : "") +
      (c.canCancel ? '<button type="button" class="ats-link" data-cancel="' + c.id + '">Withdraw request</button>' : "") +
    "</div>";
  }

  function openDay(day) {
    var rows = [];
    if (day.site || day.post) rows.push(row("Post", [day.post, day.site].filter(Boolean).join(" · ")));
    if (day.status !== "none" && day.status !== "pto") {
      rows.push(row("Clock in", day.clockIn || "Not recorded"));
      rows.push(row("Clock out", day.clockOut ? day.clockOut + (day.autoClockOut ? " (auto)" : "") : day.status === "in_progress" ? "On duty" : "Not recorded"));
      if (day.breakMinutes) rows.push(row("Break", day.breakMinutes + " min"));
      rows.push(row("Hours", fmtH(day.hours) + (day.scheduledHours ? " of " + fmtH(day.scheduledHours) + " scheduled" : "")));
      rows.push(row("Approval", day.approval === "approved" ? "Approved" : day.approval === "locked" ? "Paid · locked" : "Pending"));
    } else if (day.status === "pto") {
      rows.push(row("Hours", fmtH(day.hours) + " approved time off"));
    }
    var issues = day.issues.map(function (i) {
      return '<div class="ats-issue"><b>' + esc(i.label) + "</b>" + (i.note ? "<span>" + esc(i.note) + "</span>" : "") + "</div>";
    }).join("");
    var html =
      '<div class="ats-sheet-title">' + esc(WEEKDAY_LONG[day.weekday] || day.weekday) + ", " + esc(fmtDate(day.date)) + "</div>" +
      '<div class="ats-sheet-sub" data-status="' + day.status + '">' + esc(STATUS_NOTE[day.status] || day.status) + (day.edited && day.status !== "edited" ? " · edited by supervisor" : "") + "</div>" +
      (rows.length ? '<div class="ats-rows">' + rows.join("") + "</div>" : '<div class="ats-empty"><span>No shift on this day.</span></div>') +
      issues + correctionBlock(day.correction) +
      '<div class="ats-actions">' +
        (day.canRequestCorrection ? '<button type="button" class="ats-btn" data-primary="1" data-fix="' + day.date + '">Request correction</button>' : "") +
        '<button type="button" class="ats-btn" data-close="1">Close</button>' +
      "</div>";
    sheet(html, function (e) {
      var fix = e.target.closest("[data-fix]");
      if (fix) { openCorrection(day); return; }
      var cancel = e.target.closest("[data-cancel]");
      if (cancel) withdraw(cancel.dataset.cancel, cancel);
    });
  }

  function row(label, value) {
    return '<div class="ats-kv"><span>' + esc(label) + "</span><b>" + esc(value) + "</b></div>";
  }

  function openCorrection(day) {
    var html =
      '<div class="ats-sheet-title">Correct ' + esc(fmtDate(day.date)) + "</div>" +
      '<div class="ats-sheet-sub">Your supervisor reviews this before your hours change. Times are the site\'s local time.</div>' +
      '<form class="ats-form" novalidate>' +
        '<div class="ats-two">' +
          '<label>Clock in<input type="time" name="clockIn" required value="' + esc(to24(day.clockIn)) + '"></label>' +
          '<label>Clock out<input type="time" name="clockOut" value="' + esc(to24(day.clockOut)) + '"></label>' +
        "</div>" +
        '<label>Break (minutes)<input type="number" name="breakMinutes" min="0" max="240" step="5" inputmode="numeric" value="' + (day.breakMinutes || "") + '" placeholder="0"></label>' +
        '<label>What happened?<textarea name="reason" rows="3" maxlength="500" required placeholder="e.g. Phone died, couldn\'t clock out at 17:00"></textarea></label>' +
        '<div class="ats-error" role="alert" hidden></div>' +
        '<div class="ats-actions"><button type="submit" class="ats-btn" data-primary="1">Send to supervisor</button><button type="button" class="ats-btn" data-close="1">Cancel</button></div>' +
      "</form>";
    var wrap = sheet(html);
    var form = wrap.querySelector("form");
    var err = form.querySelector(".ats-error");
    var submit = form.querySelector("[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var body = {
        date: day.date,
        clockIn: form.clockIn.value,
        clockOut: form.clockOut.value || null,
        breakMinutes: form.breakMinutes.value === "" ? null : Number(form.breakMinutes.value),
        reason: form.reason.value.trim()
      };
      var problem = !body.clockIn ? "Enter the clock-in time." : !body.reason ? "Tell your supervisor what happened." : null;
      if (problem) { err.textContent = problem; err.hidden = false; return; }
      err.hidden = true;
      submit.disabled = true;
      submit.textContent = "Sending…";
      api("/mobile/timesheet/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function () { closeSheet(); toast("Sent to your supervisor"); load(); })
        .catch(function (ex) { err.textContent = ex.message; err.hidden = false; submit.disabled = false; submit.textContent = "Send to supervisor"; });
    });
  }

  function withdraw(id, button) {
    button.disabled = true;
    api("/mobile/timesheet/requests/" + encodeURIComponent(id) + "/cancel", { method: "POST" })
      .then(function () { closeSheet(); toast("Request withdrawn"); load(); })
      .catch(function (ex) { button.disabled = false; toast(ex.message); });
  }

  function openRequests() {
    var wrap = sheet('<div class="ats-sheet-title">Correction requests</div><div class="ats-empty"><span class="ats-spinner"></span></div>', function (e) {
      var cancel = e.target.closest("[data-cancel]");
      if (cancel) withdraw(cancel.dataset.cancel, cancel);
    });
    api("/mobile/timesheet/requests").then(function (list) {
      var box = wrap.querySelector(".ats-sheet");
      var items = list.length ? list.map(function (c) {
        return '<div class="ats-reqrow">' +
          '<div class="ats-reqhead"><b>' + esc(fmtDate(c.date)) + '</b><span class="ats-pill" data-s="' + c.status + '">' + esc(c.statusLabel) + "</span></div>" +
          "<span>" + esc((c.clockIn || "") + " – " + (c.clockOut || "no clock-out") + (c.breakMinutes != null ? " · " + c.breakMinutes + " min break" : "")) + "</span>" +
          (c.reason ? '<span class="ats-reason">“' + esc(c.reason) + "”</span>" : "") +
          (c.reviewNote ? "<span>Supervisor: " + esc(c.reviewNote) + "</span>" : "") +
          (c.canCancel ? '<button type="button" class="ats-link" data-cancel="' + c.id + '">Withdraw request</button>' : "") +
        "</div>";
      }).join("") : '<div class="ats-empty"><span>No requests yet. Tap a day to ask for a correction.</span></div>';
      box.innerHTML = '<div class="ats-grip"></div><div class="ats-sheet-title">Correction requests</div><div class="ats-reqlist">' + items + '</div><div class="ats-actions"><button type="button" class="ats-btn" data-close="1">Close</button></div>';
    }).catch(function (ex) {
      wrap.querySelector(".ats-sheet").innerHTML = '<div class="ats-grip"></div><div class="ats-empty"><b>Couldn\'t load requests</b><span>' + esc(ex.message) + '</span></div><div class="ats-actions"><button type="button" class="ats-btn" data-close="1">Close</button></div>';
    });
  }

  function openIssues(d) {
    var list = d.days.filter(function (x) { return x.issues.length; });
    sheet('<div class="ats-sheet-title">Needs attention</div><div class="ats-sheet-sub">' + d.issueCount + " issue" + (d.issueCount === 1 ? "" : "s") + " this period</div>" +
      list.map(function (x) {
        return '<button type="button" class="ats-issue ats-issue-tap" data-day="' + x.date + '"><b>' + esc(fmtDate(x.date)) + "</b><span>" + esc(x.issues.map(function (i) { return i.label; }).join(" · ")) + "</span></button>";
      }).join("") + '<div class="ats-actions"><button type="button" class="ats-btn" data-close="1">Close</button></div>',
      function (e) {
        var b = e.target.closest("[data-day]");
        if (b) openDay(d.days.filter(function (x) { return x.date === b.dataset.day; })[0]);
      });
  }

  function exportCsv(button) {
    var d = state.data;
    if (!d || !signedIn()) return;
    button.disabled = true;
    window.AlexiosAuth.fetch("/mobile/timesheet/export?period=" + d.period + "&date=" + d.rangeStart)
      .then(function (res) {
        if (!res.ok) throw new Error("Couldn't download the timesheet");
        var name = (/filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") || "") || [])[1] || "timesheet.csv";
        return res.blob().then(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url; a.download = name;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
          toast("Downloaded " + name);
        });
      })
      .catch(function (ex) { toast(ex.message); })
      .then(function () { button.disabled = false; });
  }

  function toast(text) {
    var t = document.createElement("div");
    t.className = "ats-toast";
    t.setAttribute("role", "status");
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  /* ── Events & loading ──────────────────────────────────────────────────── */

  function onClick(e) {
    var d = state.data;
    var p = e.target.closest("[data-period]");
    if (p) { if (p.dataset.period !== state.period) { state.period = p.dataset.period; load(state.date); } return; }
    var go = e.target.closest("[data-go]");
    if (go) { if (go.dataset.go) load(go.dataset.go); return; }
    if (e.target.closest("[data-retry]")) { load(); return; }
    var ex = e.target.closest("[data-export]");
    if (ex) { exportCsv(ex); return; }
    if (e.target.closest("[data-requests]")) { openRequests(); return; }
    if (e.target.closest("[data-issues]") && d) { openIssues(d); return; }
    var cell = e.target.closest("[data-day]");
    if (cell && d) {
      var day = d.days.filter(function (x) { return x.date === cell.dataset.day; })[0];
      if (day) openDay(day);
    }
  }

  function load(date) {
    var seq = ++requestSeq;
    if (date !== undefined) state.date = date;
    state.loading = true;
    state.error = null;
    render();
    var q = "?period=" + state.period + (state.date ? "&date=" + encodeURIComponent(state.date) : "");
    return api("/mobile/timesheet" + q)
      .then(function (data) {
        if (seq !== requestSeq) return;
        state.data = data;
        state.loadedAt = Date.now();
        if (data.isCurrent && data.period === "week") paintHomeTile(data);
      })
      .catch(function (err) {
        if (seq !== requestSeq) return;
        state.error = err.message;
        state.data = null;
      })
      .then(function () {
        if (seq !== requestSeq) return;
        state.loading = false;
        render();
      });
  }

  /* ── Screen plumbing ───────────────────────────────────────────────────── */

  /** The bundle's Timesheets header ("TIMESHEETS" over "STAFF HOUR LOGS") and the container it sits in. */
  function findScreen() {
    var leaves = document.querySelectorAll("#root div");
    for (var i = 0; i < leaves.length; i++) {
      var n = leaves[i];
      if (n.childElementCount === 0 && n.textContent.trim() === "TIMESHEETS") {
        var header = n.parentElement && n.parentElement.parentElement;
        if (header && header.parentElement) return { header: header, body: header.parentElement };
      }
    }
    return null;
  }

  function apply() {
    var screen = findScreen();
    if (!screen) {
      if (panel && !panel.isConnected) { panel = null; closeSheet(); }
      return;
    }
    var body = screen.body;
    var mine = body.querySelector("[data-ats-panel]");
    if (!mine) {
      mine = panel = buildPanel();
      body.appendChild(mine);
      render();
      // Opening the screen starts at this week; coming back within 30 s keeps where the guard was.
      if (!state.data || Date.now() - state.loadedAt > 30000) { state.period = "week"; load(null); }
    } else {
      panel = mine;
    }
    for (var i = 0; i < body.children.length; i++) {
      var child = body.children[i];
      if (child === mine || child === screen.header || child.dataset.atsHidden) continue;
      child.dataset.atsHidden = "true";
      child.style.display = "none";
    }
  }

  /* ── Home tile: this week's hours under "Timesheet" ────────────────────── */

  var homeTileText = null;

  function paintHomeTile(data) {
    if (data) homeTileText = fmtH(data.totals.workedHours) + " this week" + (data.issueCount ? " · " + data.issueCount + " issue" + (data.issueCount === 1 ? "" : "s") : "");
    if (!homeTileText || findScreen()) return;
    var leaves = document.querySelectorAll("#root div");
    for (var i = 0; i < leaves.length; i++) {
      var n = leaves[i];
      if (n.childElementCount === 0 && n.textContent.trim() === "Timesheet" && n.nextElementSibling) {
        if (n.nextElementSibling.textContent !== homeTileText) n.nextElementSibling.textContent = homeTileText;
        return;
      }
    }
  }

  function refreshHomeTile() {
    if (!signedIn()) return;
    api("/mobile/timesheet?period=week").then(paintHomeTile).catch(function () { /* keep the last text */ });
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
    setTimeout(refreshHomeTile, 1800);
    setInterval(refreshHomeTile, 5 * 60 * 1000);
    // On duty, today's hours grow: refresh the open screen every 2 minutes.
    setInterval(function () { if (panel && panel.isConnected && !state.loading && !document.querySelector(".ats-sheet-backdrop")) load(); }, 2 * 60 * 1000);
  }

  window.AlexiosTimesheet = { apply: apply, reload: function () { return load(); } };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
