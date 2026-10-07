/* ============================================================================
 * ALEXIOS Mobile — Clock Out (on time or early)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 * Reuses the Shift Start overlay styles (clockin-gate.css) and the backend
 * helpers clockin-gate.js exposes as window.AlexiosMobile.
 *
 * Clock Out is held until the backend accepts it:
 *
 *   POST /mobile/clock-out/check  → on time or early (+ reason list)
 *
 *   On time  → POST /mobile/clock-out straight away, no extra screens.
 *   Early    → three screens, then POST /mobile/clock-out with the reason:
 *                1. Leaving early   — how early, shift end, supervisor notified
 *                2. Reason          — pick one; Other needs a description
 *                3. Confirm         — summary, then Confirm Early Clock Out
 *
 * When the backend accepts, the bundle's own Clock Out → Confirm runs so the
 * home screen switches to off duty. The task lock (task-status.js) still
 * applies first: while a flagged activity has no reason, Clock Out stays
 * locked and this add-on stays out of the way.
 * ========================================================================== */
(function () {
  "use strict";

  var ICON = {
    back: '<svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.5 15.5L1.5 8.5L8.5 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    done: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
  };

  var EARLY_STEPS = [
    { id: "early", label: "Leaving Early" },
    { id: "reason", label: "Reason" },
    { id: "confirm", label: "Confirm" }
  ];

  var UI = null;
  var state = null;

  function freshState() {
    return {
      /* loading → steps (early only) → submitting → done, or blocked */
      status: "loading",
      message: "",
      error: "",
      index: 0,
      check: null,         // response of /mobile/clock-out/check
      location: null,
      idempotencyKey: null,
      reason: null,
      note: "",
      endedAt: null
    };
  }

  /* ── DOM helper (same shape as the other add-ons) ──────────────────────── */

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") n.className = attrs[k];
        else if (k === "html") n.innerHTML = attrs[k];
        else if (k === "text") n.textContent = attrs[k];
        else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function field(label, value) {
    return el("div", { class: "acg-field" }, [
      el("div", { class: "acg-field-l", text: label }),
      el("div", { class: "acg-field-v", text: value })
    ]);
  }

  function hhmm(date) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  /** Shift times arrive as wall-clock "YYYY-MM-DDTHH:mm" in the site's zone. */
  function wallHhmm(value) {
    return String(value || "").slice(11, 16);
  }

  /* ── Overlay ───────────────────────────────────────────────────────────── */

  function build() {
    if (UI) return UI;
    var back = el("button", { class: "acg-back", type: "button", "aria-label": "Back", html: ICON.back, onclick: prev });
    var sub = el("div", { class: "acg-sub" });
    var count = el("div", { class: "acg-count" });
    var fill = el("div", { class: "acg-bar-fill" });
    var body = el("div", { class: "acg-body" });
    var next = el("button", { class: "acg-next", type: "button", onclick: advance });
    var hint = el("div", { class: "acg-foot-hint" });

    var overlay = el("div", { class: "acg-overlay", "data-open": "false", "data-flow": "clock-out" }, [
      el("div", { class: "acg-head" }, [
        el("div", { class: "acg-head-row" }, [
          back,
          el("div", { class: "acg-head-txt" }, [el("div", { class: "acg-title", text: "CLOCK OUT" }), sub]),
          count
        ]),
        el("div", { class: "acg-bar" }, [fill])
      ]),
      body,
      el("div", { class: "acg-foot" }, [next, hint])
    ]);
    document.body.appendChild(overlay);
    UI = { overlay: overlay, back: back, sub: sub, count: count, fill: fill, body: body, next: next, hint: hint };
    return UI;
  }

  function open() {
    build();
    render();
    setTimeout(function () { UI.overlay.dataset.open = "true"; }, 16);
  }

  function close() {
    if (!UI) return;
    UI.overlay.dataset.open = "false";
    setTimeout(function () { UI.body.textContent = ""; }, 260);
  }

  /* ── Screens ───────────────────────────────────────────────────────────── */

  function screenEarly(body) {
    var check = state.check;
    body.appendChild(el("div", { class: "acg-done" }, [
      el("div", { class: "acg-done-t", text: check.early.label + " early" }),
      el("div", {
        class: "acg-done-s",
        text: "Your shift at " + check.shift.site.name + " is scheduled to end at " +
              wallHhmm(check.shift.end) + ". Leaving now needs a reason, and your " +
              "supervisor will be notified."
      })
    ]));
    body.appendChild(el("div", { class: "acg-card" }, [
      field("Scheduled end", wallHhmm(check.shift.end)),
      field("Clocking out at", hhmm(new Date())),
      field("Leaving early by", check.early.label)
    ]));
  }

  function screenReason(body) {
    body.appendChild(el("div", { class: "acg-lead", text: "Why are you leaving before the end of your shift?" }));
    state.check.reasons.forEach(function (option) {
      var on = state.reason === option.value;
      body.appendChild(el("button", {
        class: "acg-check", type: "button", "data-on": String(on),
        onclick: function () { state.reason = option.value; render(); }
      }, [
        el("span", { class: "acg-box", html: ICON.check }),
        el("span", { text: option.label })
      ]));
    });

    var other = state.reason === "other";
    body.appendChild(el("div", { class: "acg-label", text: other ? "Describe the reason (required)" : "Additional details (optional)" }));
    var note = el("textarea", {
      class: "ats-textarea", rows: "3", maxlength: "500",
      placeholder: other ? "Tell your supervisor what happened…" : "Anything your supervisor should know"
    });
    note.value = state.note;
    note.addEventListener("input", function () {
      state.note = note.value;
      UI.next.dataset.disabled = String(!stepReady());
      UI.hint.textContent = hintFor();
    });
    body.appendChild(note);
  }

  function screenConfirm(body) {
    var check = state.check;
    var label = (check.reasons.find(function (r) { return r.value === state.reason; }) || {}).label || state.reason;
    body.appendChild(el("div", { class: "acg-lead", text: "Check the details before you clock out. This cannot be undone." }));
    var card = el("div", { class: "acg-card" }, [
      field("Site", check.shift.site.name),
      field("Clocking out at", hhmm(new Date())),
      field("Scheduled end", wallHhmm(check.shift.end)),
      field("Leaving early by", check.early.label),
      field("Reason", label)
    ]);
    if (state.note.trim()) card.appendChild(field("Details", state.note.trim()));
    body.appendChild(card);
  }

  /* ── Render ────────────────────────────────────────────────────────────── */

  function renderNotice(u, title, text, buttonLabel) {
    u.back.dataset.hidden = "true";
    u.sub.textContent = title;
    u.count.textContent = "";
    u.fill.style.width = "0%";
    u.hint.textContent = "";
    u.next.dataset.disabled = String(!buttonLabel);
    u.next.textContent = buttonLabel || "Please wait";
    u.body.appendChild(el("div", { class: "acg-done" }, [
      el("div", { class: "acg-done-t", text: title }),
      el("div", { class: "acg-done-s", text: text })
    ]));
  }

  function stepReady() {
    var step = EARLY_STEPS[state.index];
    if (step.id === "reason") return Boolean(state.reason) && (state.reason !== "other" || state.note.trim().length > 0);
    return true;
  }

  function hintFor() {
    if (state.error) return state.error;
    if (EARLY_STEPS[state.index].id !== "reason" || stepReady()) return "";
    return state.reason === "other" ? "Describe the reason to continue" : "Choose a reason to continue";
  }

  function render() {
    var u = build();
    u.body.textContent = "";

    if (state.status === "loading") return renderNotice(u, "CHECKING", "Confirming your location and shift…", "");
    if (state.status === "blocked") return renderNotice(u, "CANNOT CLOCK OUT", state.message, "Close");
    if (state.status === "submitting" && !state.check.early.isEarly) return renderNotice(u, "CLOCKING OUT", "Recording your clock-out…", "");

    if (state.status === "done") {
      u.back.dataset.hidden = "true";
      u.sub.textContent = "SHIFT ENDED";
      u.count.textContent = "";
      u.fill.style.width = "100%";
      u.hint.textContent = "";
      u.next.dataset.disabled = "false";
      u.next.textContent = "Go to home";
      u.body.appendChild(el("div", { class: "acg-done" }, [
        el("div", { class: "acg-done-ico", html: ICON.done }),
        el("div", { class: "acg-done-t", text: "Clocked Out" }),
        el("div", {
          class: "acg-done-s",
          text: state.check.early.isEarly
            ? "Your early clock-out and reason were sent to your supervisor."
            : "Your shift has ended. Thank you."
        }),
        el("div", { class: "acg-done-stamp", text: hhmm(state.endedAt) })
      ]));
      return;
    }

    var step = EARLY_STEPS[state.index];
    var last = state.index === EARLY_STEPS.length - 1;
    u.back.dataset.hidden = "false";
    u.sub.textContent = step.label.toUpperCase();
    u.count.textContent = (state.index + 1) + "/" + EARLY_STEPS.length;
    u.fill.style.width = Math.round(((state.index + 1) / EARLY_STEPS.length) * 100) + "%";

    if (step.id === "early") screenEarly(u.body);
    else if (step.id === "reason") screenReason(u.body);
    else screenConfirm(u.body);

    var submitting = state.status === "submitting";
    u.next.dataset.disabled = String(submitting || !stepReady());
    u.next.textContent = submitting ? "Clocking out…" : last ? "Confirm Early Clock Out" : "Continue";
    u.hint.textContent = hintFor();
    u.body.scrollTop = 0;
  }

  /* ── Navigation ────────────────────────────────────────────────────────── */

  function advance() {
    if (state.status === "done" || state.status === "blocked") { close(); return; }
    if (state.status !== "steps" || !stepReady()) return;
    state.error = "";
    if (state.index < EARLY_STEPS.length - 1) { state.index++; render(); return; }
    submit();
  }

  function prev() {
    if (state.status !== "steps") return;
    if (state.index === 0) { close(); return; }   // backing out of screen 1 cancels
    state.index--;
    state.error = "";
    render();
  }

  /* ── Backend ───────────────────────────────────────────────────────────── */

  function block(message) {
    state.status = "blocked";
    state.message = message;
    render();
  }

  function startClockOut() {
    var mobile = window.AlexiosMobile;
    state = freshState();
    open();
    if (!mobile) { block("The app is still loading. Try again in a moment."); return; }

    mobile.currentLocation()
      .then(function (location) {
        state.location = location;
        return mobile.api("/mobile/clock-out/check", location);
      })
      .then(function (check) {
        if (!check.canClockOut) { block(check.reason.message); return; }
        state.check = check;
        state.idempotencyKey = mobile.newIdempotencyKey();
        if (check.early.isEarly) { state.status = "steps"; render(); }
        else submit();                                // on time: no extra screens
      })
      .catch(function (err) { block(err.message); });
  }

  function submit() {
    var mobile = window.AlexiosMobile;
    state.status = "submitting";
    render();

    var early = state.check.early.isEarly;
    // Re-read the location in case the guard moved while on the reason screens.
    mobile.currentLocation()
      .catch(function () { return state.location; })
      .then(function (location) {
        return mobile.api("/mobile/clock-out", {
          lat: location.lat,
          lng: location.lng,
          accuracyM: location.accuracyM,
          idempotencyKey: state.idempotencyKey,     // same key on retry → no duplicate punch
          reason: early ? state.reason : undefined,
          note: early && state.note.trim() ? state.note.trim() : undefined
        });
      })
      .then(function () {
        state.status = "done";
        state.endedAt = new Date();
        finishBundleClockOut();
        render();
        if (!early) setTimeout(close, 1400);        // on time: brief confirmation, then home
      })
      .catch(function (err) {
        if (!early || err.code === "NOT_CLOCKED_IN" || err.code === "OUTSIDE_GEOFENCE" || err.code === "ON_BREAK") {
          block(err.message);
          return;
        }
        state.status = "steps";
        state.error = err.message;
        render();
      });
  }

  /* ── Bundle hand-off ───────────────────────────────────────────────────────
   * Replays the bundle's own Clock Out → Confirm so its screen goes off duty.
   * ------------------------------------------------------------------------ */

  var passThrough = false;

  function finishBundleClockOut() {
    var findButton = window.AlexiosMobile.findButton;
    var clockOut = findButton("Clock Out");
    if (!clockOut) return;
    passThrough = true;
    clockOut.click();
    var tries = 0;
    (function confirmWhenShown() {
      var confirm = findButton("Confirm");
      if (confirm) { confirm.click(); return; }
      if (++tries < 20) setTimeout(confirmWhenShown, 50);
    })();
  }

  function clockOutButton(node) {
    for (var n = node; n && n !== document.body; n = n.parentElement) {
      if (n.tagName === "BUTTON" && n.textContent.trim() === "Clock Out") return n;
    }
    return null;
  }

  /** task-status.js locks Clock Out until flagged activities have a reason. */
  function taskLockActive() {
    var tasks = window.AlexiosTaskStatus;
    if (!tasks || !tasks.flags) return false;
    return Object.keys(tasks.flags).some(function (key) { return !tasks.flags[key].reason; });
  }

  document.addEventListener("click", function (e) {
    if (!clockOutButton(e.target)) return;
    if (passThrough) { passThrough = false; return; }
    if (taskLockActive()) return;                   // let the task lock screen handle it
    e.preventDefault();
    e.stopImmediatePropagation();
    startClockOut();
  }, true);

  window.AlexiosClockOutGate = { open: startClockOut, close: close };
})();
