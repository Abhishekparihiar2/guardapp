/* ============================================================================
 * ALEXIOS Mobile — Live location over Socket.IO (clock-in → clock-out)
 * ----------------------------------------------------------------------------
 * While signed in, the app keeps one socket open to the API. The server says
 * when to share:
 *
 *   clock in   → server emits "tracking.start" → GPS on, fixes streamed as
 *                "location:update" every SEND_EVERY_MS (acknowledged)
 *   break      → keeps sharing
 *   clock out  → server emits "tracking.stop"  → GPS off
 *   reload     → on connect, GET /mobile/duty decides start / stop
 *
 * Fixes that can't go over the socket (offline, reconnecting, no ack) are
 * queued and sent as one batch to POST /mobile/location once back online.
 * The admin live map receives every stored point in real time.
 * ========================================================================== */
(function () {
  "use strict";

  var SEND_EVERY_MS = 10 * 1000;     // the server stores at most one point per 5 s
  var ACK_TIMEOUT_MS = 8 * 1000;
  var RETRY_AUTH_MS = 5 * 1000;
  var MAX_QUEUE = 100;
  /** No fix from watchPosition for this long (desktop, mock location): ask for one directly. */
  var FALLBACK_AFTER_MS = 15 * 1000;

  var socket = null;
  var clientLoading = null;
  var watchId = null;
  var tracking = false;
  var lastSentAt = 0;
  var lastAck = null;
  var queue = [];
  var battery = null;
  var lastFixAt = 0;
  var fallbackTimer = null;
  var polling = false;

  function signedIn() {
    return Boolean(window.AlexiosMobile && window.AlexiosAuth && window.AlexiosAuth.token());
  }

  /** The Socket.IO client is served by the API itself (proxied by dev-server.mjs). */
  function loadClient() {
    if (window.io) return Promise.resolve();
    if (clientLoading) return clientLoading;
    clientLoading = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "/socket.io/socket.io.js";
      script.onload = resolve;
      script.onerror = function () { clientLoading = null; reject(new Error("Socket.IO client unavailable")); };
      document.head.appendChild(script);
    });
    return clientLoading;
  }

  /* ── Socket ────────────────────────────────────────────────────────────── */

  function connect() {
    if (socket) return;
    loadClient().then(function () {
      if (socket || !signedIn()) return;
      socket = window.io({
        path: "/socket.io",
        transports: ["websocket", "polling"],
        // A function, so every reconnect sends the current (possibly refreshed) token.
        auth: function (cb) { cb({ token: window.AlexiosAuth.token() }); }
      });
      socket.on("connect", function () {
        syncDuty();
        flushQueue();
      });
      // Rejected by the auth middleware (usually an expired token): refresh it, then retry.
      // Socket.IO does not retry these on its own.
      socket.on("connect_error", function () {
        setTimeout(function () {
          if (!socket || socket.connected || !signedIn()) return;
          window.AlexiosAuth.fetch("/me").catch(function () {}).then(function () { if (socket) socket.connect(); });
        }, RETRY_AUTH_MS);
      });
      socket.on("event", function (envelope) {
        var payload = envelope && envelope.payload;
        if (!payload) return;
        if (payload.type === "tracking.start") start();
        else if (payload.type === "tracking.stop") stop();
      });
    }).catch(function () { /* retried by the watchdog below */ });
  }

  function disconnect() {
    stop();
    if (socket) socket.disconnect();
    socket = null;
  }

  function syncDuty() {
    if (!signedIn()) return;
    window.AlexiosMobile.api("/mobile/duty").then(function (duty) {
      if (duty.state === "on_duty" || duty.state === "on_break") start();
      else stop();
    }).catch(function () {});
  }

  /* ── GPS ───────────────────────────────────────────────────────────────── */

  function start() {
    if (tracking || !navigator.geolocation) return;
    tracking = true;
    lastSentAt = 0;
    lastFixAt = Date.now();
    if (navigator.getBattery) {
      navigator.getBattery().then(function (b) {
        battery = b;
      }).catch(function () {});
    }
    watchId = navigator.geolocation.watchPosition(function (pos) {
      onFix({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: Math.round(pos.coords.accuracy), at: pos.timestamp });
    }, function () {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
    fallbackTimer = setInterval(fallbackFix, SEND_EVERY_MS);
  }

  /** Same source as clock-in (honours AlexiosClockInGate.mockLocation for desk testing). */
  function fallbackFix() {
    if (!tracking || polling || Date.now() - lastFixAt < FALLBACK_AFTER_MS) return;
    polling = true;
    window.AlexiosMobile.currentLocation().then(function (fix) {
      onFix({ lat: fix.lat, lng: fix.lng, accuracyM: fix.accuracyM, at: Date.now() });
    }).catch(function () {}).then(function () { polling = false; });
  }

  function stop() {
    if (!tracking) return;
    flushQueue();
    tracking = false;
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    clearInterval(fallbackTimer);
    fallbackTimer = null;
  }

  function onFix(fix) {
    lastFixAt = Date.now();
    if (!tracking || Date.now() - lastSentAt < SEND_EVERY_MS) return;
    lastSentAt = Date.now();
    var point = {
      lat: fix.lat,
      lng: fix.lng,
      accuracyM: fix.accuracyM,
      recordedAt: new Date(fix.at || Date.now()).toISOString()
    };
    if (battery) point.batteryPct = Math.round(battery.level * 100);
    send(point);
  }

  function enqueue(point) {
    queue.push(point);
    if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  }

  function send(point) {
    if (!socket || !socket.connected) return enqueue(point);
    socket.timeout(ACK_TIMEOUT_MS).emit("location:update", point, function (err, ack) {
      if (err) return enqueue(point);   // no ack in time: send it later in a batch
      lastAck = { at: new Date().toISOString(), ack: ack };
      if (ack && !ack.ok && ack.code === "NOT_ON_DUTY") stop();
    });
  }

  /** Points that missed the socket go in one HTTP batch. */
  function flushQueue() {
    if (!queue.length || !signedIn()) return;
    var batch = queue.slice(0, MAX_QUEUE);
    window.AlexiosMobile.api("/mobile/location", { points: batch }).then(function () {
      queue = queue.slice(batch.length);
    }).catch(function (err) {
      if (err.code === "NOT_ON_DUTY") queue = [];
    });
  }

  /* Connect once signed in; drop the socket on sign-out. */
  setInterval(function () {
    if (signedIn()) connect();
    else if (socket) disconnect();
  }, 3000);

  window.AlexiosLiveLocation = {
    status: function () {
      return {
        connected: Boolean(socket && socket.connected),
        tracking: tracking,
        queued: queue.length,
        lastSentAt: lastSentAt ? new Date(lastSentAt).toISOString() : null,
        lastAck: lastAck
      };
    },
    tracking: function () { return tracking; },
    queued: function () { return queue.length; },
    flush: flushQueue,
    check: syncDuty
  };
})();
