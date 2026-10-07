/* ============================================================================
 * ALEXIOS Mobile — Breaks (Take Break / End Break)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 * Reuses the Shift Start overlay styles (clockin-gate.css) and the backend
 * helpers clockin-gate.js exposes as window.AlexiosMobile.
 *
 * The guard's break allowance comes from their position's break rule
 * (admin: Create Position → Break Rule Settings), served by GET /mobile/breaks.
 *
 *   Take Break → GET /mobile/breaks
 *                  not allowed → explain (no breaks left / not yet / none)
 *                  allowed     → confirm length + paid/unpaid → POST start
 *   End Break  → POST /mobile/breaks/end; an overrun is shown and logged
 *
 * Only once the backend accepts does the bundle's own button run, so its
 * break timer always matches what was recorded.
 * ========================================================================== */
(function () {
  "use strict";

  var UI = null;
  var passThrough = false;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") n.className = attrs[k];
        else if (k === "text") n.textContent = attrs[k];
        else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function hhmm(iso) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  /* ── Overlay ───────────────────────────────────────────────────────────── */

  function build() {
    if (UI) return UI;
    var sub = el("div", { class: "acg-sub" });
    var body = el("div", { class: "acg-body" });
    var next = el("button", { class: "acg-next", type: "button" });
    var hint = el("div", { class: "acg-foot-hint" });
    var overlay = el("div", { class: "acg-overlay", "data-open": "false", "data-flow": "break" }, [
      el("div", { class: "acg-head" }, [
        el("div", { class: "acg-head-row" }, [
          el("div", { class: "acg-head-txt" }, [el("div", { class: "acg-title", text: "BREAK" }), sub])
        ])
      ]),
      body,
      el("div", { class: "acg-foot" }, [next, hint])
    ]);
    document.body.appendChild(overlay);
    UI = { overlay: overlay, sub: sub, body: body, next: next, hint: hint };
    return UI;
  }

  /**
   * One screen: a title, a message, optional rows, and the main button.
   * `secondary` adds a text link (Cancel) under the button.
   */
  function show(opts) {
    var u = build();
    u.sub.textContent = opts.sub || "";
    u.body.textContent = "";
    u.body.appendChild(el("div", { class: "acg-done" }, [
      el("div", { class: "acg-done-t", text: opts.title }),
      el("div", { class: "acg-done-s", text: opts.text || "" })
    ]));
    if (opts.rows && opts.rows.length) u.body.appendChild(el("div", { class: "acg-card" }, opts.rows));
    u.next.textContent = opts.button || "Please wait";
    u.next.dataset.disabled = String(!opts.onButton);
    u.next.onclick = opts.onButton || null;
    u.hint.textContent = "";
    if (opts.secondary) {
      u.hint.appendChild(el("button", { class: "acg-link", type: "button", text: opts.secondary, onclick: close }));
    }
    setTimeout(function () { u.overlay.dataset.open = "true"; }, 16);
  }

  function close() {
    if (UI) UI.overlay.dataset.open = "false";
  }

  function slotRow(slot) {
    var status = { taken: "Taken", in_progress: "On break", available: "Available now", upcoming: "From " + (slot.availableAt ? hhmm(slot.availableAt) : "later") }[slot.status];
    return el("div", { class: "acg-row" }, [
      el("div", { class: "acg-row-main" }, [
        el("div", { class: "acg-row-t", text: slot.label + " · " + slot.minutes + " min" }),
        el("div", { class: "acg-row-s", text: (slot.paid ? "Paid" : "Unpaid") + (slot.afterHours ? " · after " + slot.afterHours + "h on duty" : "") })
      ]),
      el("div", { class: "acg-row-time", text: status })
    ]);
  }

  /* ── Bundle hand-off ───────────────────────────────────────────────────── */

  /** Runs the bundle's own button (Take Break / End Break) without our intercept. */
  function replay(label) {
    var button = window.AlexiosMobile && window.AlexiosMobile.findButton(label);
    if (!button) return false;
    passThrough = true;
    button.click();
    return true;
  }

  /* ── Take Break ────────────────────────────────────────────────────────── */

  function takeBreak() {
    var mobile = window.AlexiosMobile;
    show({ sub: "CHECKING", title: "Checking your breaks", text: "Looking up your break allowance…" });
    mobile.api("/mobile/breaks")
      .then(function (status) {
        var rows = status.breaks.map(slotRow);
        if (!status.canStartBreak) {
          show({ sub: "NOT AVAILABLE", title: "Cannot take a break", text: status.reason.message, rows: rows, button: "Close", onButton: close });
          return;
        }
        var slot = status.next;
        show({
          sub: status.rule.toUpperCase(),
          title: "Start your " + slot.label.toLowerCase() + "?",
          text: slot.minutes + " minutes · " + (slot.paid ? "paid" : "unpaid") +
                ". End the break from the home screen when you are back on post.",
          rows: rows,
          button: "Start " + slot.minutes + " min break",
          onButton: function () { startBreak(slot); },
          secondary: "Cancel"
        });
      })
      .catch(function (err) {
        show({ sub: "NOT AVAILABLE", title: "Cannot take a break", text: err.message, button: "Close", onButton: close });
      });
  }

  function startBreak(slot) {
    var mobile = window.AlexiosMobile;
    show({ sub: "STARTING", title: "Starting your break", text: "Recording your break…" });
    mobile.api("/mobile/breaks/start", { idempotencyKey: mobile.newIdempotencyKey() })
      .then(function (result) {
        close();
        replay("Take Break");
        if (result.onBreak) window.AlexiosBreakGate.lastEndsAt = result.onBreak.endsAt;
      })
      .catch(function (err) {
        show({ sub: "NOT AVAILABLE", title: "Cannot take a break", text: err.message, button: "Close", onButton: close });
      });
  }

  /* ── End Break ─────────────────────────────────────────────────────────── */

  function endBreak() {
    var mobile = window.AlexiosMobile;
    var key = mobile.newIdempotencyKey();   // reused if the guard retries after an error
    function send() {
      show({ sub: "ENDING", title: "Ending your break", text: "Recording your return to post…" });
      mobile.api("/mobile/breaks/end", { idempotencyKey: key })
        .then(function (result) {
          replay("End Break");
          if (result.overrunMinutes > 0) {
            show({
              sub: "BREAK ENDED",
              title: "Break ran " + result.overrunMinutes + " min over",
              text: "Your break went past its allowance. Your supervisor has been notified.",
              button: "OK", onButton: close
            });
          } else {
            close();
          }
        })
        .catch(function (err) {
          show({ sub: "ERROR", title: "Could not end your break", text: err.message, button: "Try again", onButton: send, secondary: "Cancel" });
        });
    }
    send();
  }

  /* ── Hook ──────────────────────────────────────────────────────────────── */

  function labelOf(node) {
    for (var n = node; n && n !== document.body; n = n.parentElement) {
      if (n.tagName === "BUTTON") {
        var text = n.textContent.trim();
        if (text === "Take Break" || text === "End Break") return text;
        return null;
      }
    }
    return null;
  }

  document.addEventListener("click", function (e) {
    var label = labelOf(e.target);
    if (!label) return;
    if (passThrough) { passThrough = false; return; }
    if (!window.AlexiosMobile) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (label === "Take Break") takeBreak();
    else endBreak();
  }, true);

  window.AlexiosBreakGate = { replay: replay, takeBreak: takeBreak, endBreak: endBreak, lastEndsAt: null };
})();
