/* ============================================================================
 * ALEXIOS Mobile — SOS
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 * Replaces the bundle's mock SOS flow (same three situations) with the real one:
 *
 *   SOS button → pick situation → POST /mobile/sos   (sent at once; GPS is
 *                                                     waited for ≤3 s, never required)
 *   while open → POST /mobile/sos/:id/location every 15 s
 *   Cancel     → reason → POST /mobile/sos/:id/cancel
 *   reload     → GET /mobile/sos/active reopens an open SOS
 *
 * Works on or off duty. Supervisors are notified in-app, live and by phone push.
 * A failed send keeps the same idempotency key, so "Try again" never doubles up.
 * ========================================================================== */
(function () {
  "use strict";

  /* Used if the situations list cannot be loaded: an SOS must never be blocked. */
  var FALLBACK_SITUATIONS = [
    { value: "responding_to_incident", label: "Responding to an incident", description: "Signal an active response" },
    { value: "need_immediate_backup", label: "Need immediate backup", description: "Request officer support" },
    { value: "need_law_enforcement", label: "Need law enforcement", description: "Dispatch police / EMS" }
  ];
  var GPS_WAIT_MS = 3000;
  var SHARE_EVERY_MS = 15000;

  var UI = null;
  var sos = null;            // the open SOS from the backend
  var situations = null;
  var watchId = null;
  var lastShared = null;
  var lastFix = null;
  var pendingKey = null;     // idempotency key of a trigger that has not succeeded yet

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") n.className = attrs[k];
        else if (k === "text") n.textContent = attrs[k];
        else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function mobile() { return window.AlexiosMobile; }
  function hhmm(iso) { return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }

  /* ── Overlay ───────────────────────────────────────────────────────────── */

  function build() {
    if (UI) return UI;
    var sub = el("div", { class: "acg-sub" });
    var body = el("div", { class: "acg-body" });
    var foot = el("div", { class: "acg-foot" });
    var overlay = el("div", { class: "acg-overlay", "data-open": "false", "data-flow": "sos" }, [
      el("div", { class: "acg-head" }, [el("div", { class: "acg-head-row" }, [el("div", { class: "acg-head-txt" }, [el("div", { class: "acg-title", text: "SOS" }), sub])])]),
      body,
      foot
    ]);
    document.body.appendChild(overlay);
    UI = { overlay: overlay, sub: sub, body: body, foot: foot };
    return UI;
  }

  function screen(sub, fill) {
    var u = build();
    u.sub.textContent = sub;
    u.body.textContent = "";
    u.foot.textContent = "";
    fill(u.body, u.foot);
    u.overlay.dataset.open = "true";
  }

  function button(label, onclick, variant) {
    return el("button", { class: "acg-next", type: "button", text: label, "data-variant": variant || null, onclick: onclick });
  }

  function close() { if (UI) UI.overlay.dataset.open = "false"; }

  /* ── Location ──────────────────────────────────────────────────────────── */

  /** Best fix within GPS_WAIT_MS, or the last known one, or none. Never rejects. */
  function quickFix() {
    return Promise.race([
      mobile().currentLocation().catch(function () { return null; }),
      new Promise(function (resolve) { setTimeout(function () { resolve(lastFix); }, GPS_WAIT_MS); })
    ]);
  }

  function startSharing() {
    if (watchId != null || !navigator.geolocation || !sos) return;
    watchId = navigator.geolocation.watchPosition(function (pos) {
      lastFix = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: Math.round(pos.coords.accuracy) };
      if (lastShared && Date.now() - lastShared < SHARE_EVERY_MS) return;
      lastShared = Date.now();
      mobile().api("/mobile/sos/" + sos.id + "/location", lastFix).then(function () {
        if (sos && UI && UI.overlay.dataset.open === "true") renderActive();
      }).catch(function () { /* keep trying on the next fix */ });
    }, function () {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
  }

  function stopSharing() {
    if (watchId != null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    lastShared = null;
  }

  /* ── Screens ───────────────────────────────────────────────────────────── */

  function renderPicker() {
    var list = situations || FALLBACK_SITUATIONS;
    screen("SELECT YOUR SITUATION", function (body, foot) {
      body.appendChild(el("div", { class: "acg-lead", text: "Your supervisors are alerted the moment you choose." }));
      list.forEach(function (s) {
        body.appendChild(el("button", { class: "asos-pick", type: "button", onclick: function () { trigger(s); } }, [
          el("div", {}, [el("div", { class: "asos-pick-t", text: s.label }), el("div", { class: "asos-pick-s", text: s.description || "" })])
        ]));
      });
      foot.appendChild(button("Close — don't send", close, "calm"));
    });
  }

  function renderSending(s) {
    screen("SENDING", function (body) {
      body.appendChild(el("div", { class: "asos-beacon" }));
      body.appendChild(el("div", { class: "asos-big", text: s.label }));
      body.appendChild(el("div", { class: "asos-tag", text: "ALERTING DISPATCH…" }));
    });
  }

  function renderFailed(s, message) {
    screen("NOT SENT", function (body, foot) {
      body.appendChild(el("div", { class: "asos-big", text: "SOS not sent" }));
      body.appendChild(el("div", { class: "acg-lead", text: message + " If this keeps failing, phone your supervisor or emergency services now." }));
      foot.appendChild(button("Try again", function () { trigger(s); }));
      foot.appendChild(button("Close", close, "calm"));
    });
  }

  function renderActive() {
    screen("SOS ACTIVE", function (body, foot) {
      body.appendChild(el("div", { class: "asos-beacon" }));
      body.appendChild(el("div", { class: "asos-big", text: sos.situationLabel }));
      body.appendChild(el("div", { class: "asos-tag", "data-ok": "true", text: sos.status === "acknowledged" ? "SUPERVISOR ACKNOWLEDGED" : "SUPERVISORS NOTIFIED" }));
      body.appendChild(el("div", { class: "acg-card" }, [
        el("div", { class: "acg-row" }, [el("div", { class: "acg-row-main" }, [el("div", { class: "acg-row-s", text: "Site" }), el("div", { class: "acg-row-t", text: sos.site.name })])]),
        el("div", { class: "acg-row" }, [el("div", { class: "acg-row-main" }, [el("div", { class: "acg-row-s", text: "Raised at" }), el("div", { class: "acg-row-t", text: hhmm(sos.triggeredAt) })])]),
        el("div", { class: "acg-row" }, [el("div", { class: "acg-row-main" }, [
          el("div", { class: "acg-row-s", text: "Live location" }),
          el("div", { class: "acg-row-t", text: lastShared ? "Shared at " + hhmm(new Date(lastShared).toISOString()) : watchId != null ? "Waiting for GPS…" : "Unavailable on this device" })
        ])])
      ]));
      body.appendChild(el("div", { class: "acg-lead", text: "Stay where it is safe. Keep this screen open so dispatch can follow your location." }));
      foot.appendChild(button("Cancel SOS (false alarm)", renderCancel, "calm"));
    });
  }

  function renderCancel() {
    screen("CANCEL SOS", function (body, foot) {
      body.appendChild(el("div", { class: "acg-lead", text: "Only cancel if you are safe. Your supervisors will see the reason." }));
      var reason = el("textarea", { class: "ats-textarea", rows: "3", maxlength: "400", placeholder: "Why are you cancelling? (e.g. pressed by accident)" });
      body.appendChild(reason);
      var hint = el("div", { class: "acg-foot-hint" });
      foot.appendChild(button("Cancel the SOS", function () {
        var text = reason.value.trim();
        if (text.length < 3) { hint.textContent = "Say why you are cancelling"; return; }
        hint.textContent = "Cancelling…";
        mobile().api("/mobile/sos/" + sos.id + "/cancel", { reason: text }).then(function () {
          sos = null;
          stopSharing();
          screen("CANCELLED", function (b, f) {
            b.appendChild(el("div", { class: "asos-big", text: "SOS cancelled" }));
            b.appendChild(el("div", { class: "acg-lead", text: "Your supervisors have been told it was a false alarm." }));
            f.appendChild(button("Done", close, "calm"));
          });
        }).catch(function (err) { hint.textContent = err.message; });
      }));
      foot.appendChild(button("Keep SOS active", renderActive, "calm"));
      foot.appendChild(hint);
    });
  }

  /* ── Trigger ───────────────────────────────────────────────────────────── */

  function trigger(s) {
    if (!pendingKey) pendingKey = mobile().newIdempotencyKey();
    renderSending(s);
    quickFix().then(function (fix) {
      var body = { idempotencyKey: pendingKey, situation: s.value };
      if (fix) { body.lat = fix.lat; body.lng = fix.lng; body.accuracyM = fix.accuracyM; }
      return mobile().api("/mobile/sos", body);
    }).then(function (result) {
      pendingKey = null;
      sos = result.sos;
      renderActive();
      startSharing();
    }).catch(function (err) {
      renderFailed(s, err.message);
    });
  }

  function open() {
    if (sos) { renderActive(); return; }
    renderPicker();
    if (!situations) {
      mobile().api("/mobile/sos/situations").then(function (list) {
        situations = list;
        if (!sos && UI.sub.textContent === "SELECT YOUR SITUATION") renderPicker();
      }).catch(function () { /* the built-in list is already showing */ });
    }
  }

  /* ── Hooks ─────────────────────────────────────────────────────────────── */

  function isSosButton(node) {
    for (var n = node; n && n !== document.body; n = n.parentElement) {
      if (n.tagName === "BUTTON") return n.textContent.trim().toUpperCase() === "SOS";
    }
    return false;
  }

  document.addEventListener("click", function (e) {
    if (!isSosButton(e.target) || !window.AlexiosMobile || !window.AlexiosAuth || !window.AlexiosAuth.token()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    open();
  }, true);

  /* Reopen an SOS that is still open after a reload. */
  var restored = false;
  new MutationObserver(function () {
    if (restored || !window.AlexiosMobile || !window.AlexiosAuth || !window.AlexiosAuth.token()) return;
    if (document.querySelector("input[placeholder='Officer ID']")) return;   // still on login
    restored = true;
    mobile().api("/mobile/sos/active").then(function (active) {
      if (!active) return;
      sos = active;
      renderActive();
      startSharing();
    }).catch(function () { restored = false; });
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.AlexiosSos = { open: open, trigger: function (value) {
    var s = (situations || FALLBACK_SITUATIONS).find(function (x) { return x.value === value; });
    if (s) trigger(s);
  }, active: function () { return sos; } };
})();
