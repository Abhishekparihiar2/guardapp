/* ============================================================================
 * ALEXIOS Mobile — Live location over Socket.IO (clock-in → clock-out)
 * ----------------------------------------------------------------------------
 * The socket exists only while the guard is on duty, or while a screen that
 * needs live updates holds it open (chat.js: retain("chat") / release("chat")).
 * Signed in, not clocked in and no such screen open means no socket at all.
 * Location is only ever shared on duty.
 *
 *   clock in   → clockin-gate.js calls onDuty() → socket opens, GPS on, fixes
 *                streamed as "location:update" every SEND_EVERY_MS (acknowledged)
 *   break      → keeps sharing
 *   clock out  → clockout-gate.js calls offDuty() (or the server emits
 *                "tracking.stop") → GPS off, socket closed
 *   app open / back in foreground → GET /mobile/duty (plain HTTP) decides
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
  var onDutyNow = false;    // what the backend last told us
  var dutyChecked = false;  // initial GET /mobile/duty done for this sign-in
  var holders = {};         // screens keeping the socket open off duty, e.g. { chat: true }
  var listeners = [];       // onEvent() subscribers: every "event" envelope + connect notices

  /** The one gate for every socket connect. */
  function wantSocket() {
    return onDutyNow || Object.keys(holders).length > 0;
  }

  function notify(envelope) {
    listeners.slice().forEach(function (fn) {
      try { fn(envelope); } catch (e) { /* one bad listener must not stop the others */ }
    });
  }

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
      // Duty may have ended (or the chat closed) while the client script was loading.
      if (socket || !signedIn() || !wantSocket()) return;
      socket = window.io({
        path: "/socket.io",
        transports: ["websocket", "polling"],
        // A function, so every reconnect sends the current (possibly refreshed) token.
        auth: function (cb) { cb({ token: window.AlexiosAuth.token() }); }
      });
      socket.on("connect", function () {
        flushQueue();
        // Listeners refetch on (re)connect: events sent while disconnected are not replayed.
        notify({ channel: null, payload: { type: "socket.connected" } });
      });
      // A reconnect after a network drop may have missed "tracking.stop": confirm duty.
      socket.io.on("reconnect", syncDuty);
      // Rejected by the auth middleware (usually an expired token): refresh it, then retry.
      // Socket.IO does not retry these on its own.
      socket.on("connect_error", function () {
        setTimeout(function () {
          if (!socket || socket.connected || !signedIn() || !wantSocket()) return;
          window.AlexiosAuth.fetch("/me").catch(function () {}).then(function () { if (socket) socket.connect(); });
        }, RETRY_AUTH_MS);
      });
      socket.on("event", function (envelope) {
        var payload = envelope && envelope.payload;
        if (!payload) return;
        if (payload.type === "tracking.start") onDuty();
        else if (payload.type === "tracking.stop") offDuty();
        notify(envelope);
      });
    }).catch(function () {
      // Client script failed to load: try again shortly while still wanted.
      setTimeout(function () { if (wantSocket() && !socket) connect(); }, RETRY_AUTH_MS);
    });
  }

  function disconnect() {
    if (socket) socket.disconnect();
    socket = null;
  }

  /* ── Duty: the only thing that opens or closes the socket ──────────────── */

  function onDuty() {
    onDutyNow = true;
    connect();
    start();
  }

  function offDuty() {
    onDutyNow = false;
    stop();
    if (!wantSocket()) disconnect();   // an open chat keeps the socket
  }

  function retain(reason) {
    holders[reason] = true;
    if (signedIn()) connect();
  }

  function release(reason) {
    delete holders[reason];
    if (!wantSocket()) disconnect();
  }

  /** Subscribe to every socket envelope; returns an unsubscribe function. */
  function onEvent(fn) {
    listeners.push(fn);
    return function () { listeners = listeners.filter(function (l) { return l !== fn; }); };
  }

  function syncDuty() {
    if (!signedIn()) return;
    window.AlexiosMobile.api("/mobile/duty").then(function (duty) {
      dutyChecked = true;
      if (duty.state === "on_duty" || duty.state === "on_break") onDuty();
      else offDuty();
    }).catch(function () { /* keep the current state; retried on next foreground */ });
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
      if (ack && !ack.ok && ack.code === "NOT_ON_DUTY") offDuty();
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

  /* Check duty once after sign-in (local check only, no network while waiting);
     drop everything on sign-out. */
  setInterval(function () {
    if (!signedIn()) {
      dutyChecked = false;
      holders = {};
      if (onDutyNow || socket) offDuty();
      return;
    }
    if (!dutyChecked) syncDuty();
  }, 3000);

  /* Clocked in or out on another device while the app was in the background. */
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && signedIn()) syncDuty();
  });

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
    check: syncDuty,
    /** Called by clockin-gate.js once the backend accepts the clock-in. */
    onDuty: onDuty,
    /** Called by clockout-gate.js once the backend accepts the clock-out. */
    offDuty: offDuty,
    /** Keep the socket open off duty while a live screen is showing (no location is shared). */
    retain: retain,
    release: release,
    onEvent: onEvent,
    connected: function () { return Boolean(socket && socket.connected); }
  };
})();
