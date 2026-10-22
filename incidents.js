/* ============================================================================
 * ALEXIOS Mobile — Incidents (real data)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 * Requires alexios-ui.css + incidents.css, and clockin-gate.js (window.AlexiosMobile).
 *
 * Home → Incidents opens:
 *   1. REPORT AN INCIDENT — incident types the admin publishes in Report Settings
 *   2. MY REPORTS         — this officer's incident reports, filterable by date
 *
 * Picking a type loads its form: the admin's own Form Builder fields, or the
 * backend's standard incident form (when, where, what happened, people,
 * who was called, photos). Every incident has a severity that starts at the
 * type's and the officer can change. Filing alerts managers straight away.
 *
 * Offline: a report filed without a connection is held on the device, photos
 * included, and sent when the connection returns. It carries its idempotency
 * key from the start, so a retry can never file it twice.
 *
 * Backend (all under /api/v1, guard token):
 *   GET  /mobile/incidents                 types + my last 10
 *   GET  /mobile/incidents/mine?from&to    my reports (ISO instants)
 *   GET  /mobile/incidents/:typeId         fields, sites, default severity
 *   POST /mobile/incidents/:typeId         {idempotencyKey, siteId, severity, answers}
 *   GET  /mobile/incidents/submissions/:id one report with answers + photos
 *   POST /mobile/uploads/photo (kind=incident) → photo key, before submitting
 * ========================================================================== */
(function () {
  "use strict";

  var CONFIG = { maxPhotos: 6 };

  /* ── Icons ─────────────────────────────────────────────────────────────── */

  var ICON = {
    back:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    chev:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    down:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    alert: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    cam:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    img:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
    x:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    done:  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    cloud: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13v8m-4-4 4 4 4-4"/><path d="M20.9 15.3A5 5 0 0 0 18 6h-1.3A8 8 0 1 0 4 14.3"/></svg>',
    spin:  '<svg class="asc-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.6"/></svg>',
    filter:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.5V19l4 2v-8.5z"/></svg>',
    off:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l22 22M16.7 11.1A6 6 0 0 1 19 13M8.5 8.6A10 10 0 0 0 2 13m3.5 3.5A14 14 0 0 1 12 15m0 5h.01"/></svg>'
  };

  var SEVERITIES = ["low", "medium", "high", "critical"];
  var HOUR = 3600 * 1000;

  function cap(s) { s = String(s || ""); return s ? s[0].toUpperCase() + s.slice(1) : ""; }

  /* ── Device store: drafts and the outgoing queue ─────────────────────────
   * Only what hasn't reached the server lives here. Filed reports always come
   * from the backend, so My Reports is the same on every device.
   * ---------------------------------------------------------------------- */

  var Store = (function () {
    var K_QUEUE = "alexios.incidents.queue.v1";
    var K_DRAFT = "alexios.incidents.draft.";
    var memory = null; // fallback when localStorage is blocked or full

    // The mock build kept demo reports on the device; they are not real filings.
    try {
      ["alexios.incidents.reports.v1", "alexios.incidents.seeded.v1", "alexios.incidents.seq.v1"].forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* storage blocked */ }

    function read() {
      if (memory) return memory;
      try { var raw = localStorage.getItem(K_QUEUE); return raw ? JSON.parse(raw) : []; }
      catch (e) { return []; }
    }
    function write(list) {
      try { localStorage.setItem(K_QUEUE, JSON.stringify(list)); memory = null; }
      catch (e) { memory = list; }   // quota hit — hold in memory for this session
    }
    return {
      queue: read,
      enqueue: function (item) { var l = read().filter(function (q) { return q.idempotencyKey !== item.idempotencyKey; }); l.unshift(item); write(l); },
      update: function (key, patch) {
        write(read().map(function (q) { return q.idempotencyKey === key ? Object.assign(q, patch) : q; }));
      },
      dequeue: function (key) { write(read().filter(function (q) { return q.idempotencyKey !== key; })); },
      saveDraft: function (typeId, values) {
        try { localStorage.setItem(K_DRAFT + typeId, JSON.stringify(values)); } catch (e) {}
      },
      loadDraft: function (typeId) {
        try { var raw = localStorage.getItem(K_DRAFT + typeId); return raw ? JSON.parse(raw) : null; }
        catch (e) { return null; }
      },
      clearDraft: function (typeId) {
        try { localStorage.removeItem(K_DRAFT + typeId); } catch (e) {}
      }
    };
  })();

  /* ── API ───────────────────────────────────────────────────────────────── */

  function mobile() { return window.AlexiosMobile; }
  function signedIn() { return !!(window.AlexiosAuth && mobile()); }
  function api(path, body) {
    if (!mobile()) return Promise.reject(new Error("You are not signed in."));
    return mobile().api(path, body);
  }
  function newKey() { return mobile().newIdempotencyKey(); }

  /** No server answer at all (vs. the server saying no): the report should wait on the device. */
  function isOffline(err) {
    return !err.code && (!navigator.onLine || /No connection/i.test(err.message || ""));
  }

  var Api = {
    hub: function () { return api("/mobile/incidents"); },
    type: function (id) { return api("/mobile/incidents/" + encodeURIComponent(id)); },
    mine: function (range) {
      var q = [];
      if (range[0]) q.push("from=" + encodeURIComponent(range[0].toISOString()));
      if (range[1]) q.push("to=" + encodeURIComponent(range[1].toISOString()));
      return api("/mobile/incidents/mine" + (q.length ? "?" + q.join("&") : ""));
    },
    submission: function (id) { return api("/mobile/incidents/submissions/" + encodeURIComponent(id)); },
    submit: function (typeId, payload) { return api("/mobile/incidents/" + encodeURIComponent(typeId), payload); },
    /** One photo (a data URL held on the device) → its upload key. */
    upload: function (dataUrl) {
      var form = new FormData();
      form.append("kind", "incident");
      form.append("file", dataUrlToBlob(dataUrl), "incident.jpg");
      return window.AlexiosAuth.fetch("/mobile/uploads/photo", { method: "POST", body: form }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          if (!res.ok) {
            var err = new Error((json && json.message) || "Photo upload failed (" + res.status + ")");
            err.code = (json && json.error && json.error.code) || "UPLOAD_FAILED";
            throw err;
          }
          return json.data.key;
        });
      }, function () { throw new Error("No connection to the server. Try again."); });
    },
    photo: function (ref) {
      return window.AlexiosAuth.fetch("/mobile/uploads/photo/" + ref.kind + "/" + encodeURIComponent(ref.fileName))
        .then(function (res) { return res.ok ? res.blob() : null; });
    }
  };

  function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl).split(",");
    var mime = (parts[0].match(/:(.*?);/) || [])[1] || "image/jpeg";
    var bin = atob(parts[1] || "");
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  /* ── Sending a report (now, or later from the queue) ───────────────────── */

  function isPhotoType(t) { return t === "photo" || t === "photo_high" || t === "photo_gallery"; }

  /**
   * Uploads any photos not yet uploaded, then files the report. Photo keys are
   * remembered on the item, so a retry after a dropped connection doesn't
   * upload them again.
   */
  function send(item) {
    item.uploaded = item.uploaded || {};
    var photoFields = item.fields.filter(function (f) { return isPhotoType(f.type) && (item.values[f.key] || []).length; });
    var chain = Promise.resolve();
    photoFields.forEach(function (f) {
      if (item.uploaded[f.key]) return;
      chain = chain.then(function () {
        return Promise.all(item.values[f.key].map(Api.upload)).then(function (keys) {
          item.uploaded[f.key] = keys;
          if (item.queued) Store.update(item.idempotencyKey, { uploaded: item.uploaded });
        });
      });
    });
    return chain.then(function () {
      var answers = {};
      item.fields.forEach(function (f) {
        var v = item.values[f.key];
        if (f.type === "divider") return;
        if (isPhotoType(f.type)) {
          var keys = item.uploaded[f.key] || [];
          if (keys.length) answers[f.key] = f.type === "photo_gallery" ? keys : keys[0];
          return;
        }
        if (isBlank(v) && f.type !== "checkbox") return;
        if (f.type === "datetime") answers[f.key] = new Date(v).toISOString();
        else if (f.type === "number") answers[f.key] = Number(v);
        else if (f.type === "checkbox") answers[f.key] = !!v;
        else answers[f.key] = v;
      });
      var payload = { idempotencyKey: item.idempotencyKey, severity: item.severity, answers: answers };
      if (item.siteId) payload.siteId = item.siteId;
      return Api.submit(item.typeId, payload);
    });
  }

  var flushing = false;
  function flushQueue() {
    var waiting = Store.queue().filter(function (q) { return !q.error; });
    if (flushing || !waiting.length || !navigator.onLine || !signedIn()) return Promise.resolve();
    flushing = true;
    var sent = 0;
    return waiting.reduce(function (p, item) {
      return p.then(function () {
        return send(item).then(function () {
          Store.dequeue(item.idempotencyKey);
          Store.clearDraft(item.typeId);
          sent++;
        }).catch(function (err) {
          // Still no connection: keep it. The server refused it: keep it, and say why.
          if (!isOffline(err)) Store.update(item.idempotencyKey, { error: err.message || "The server refused this report." });
        });
      });
    }, Promise.resolve()).then(function () {
      flushing = false;
      refreshHomeTile();
      if (!sent) return;
      if (UI.overlay && UI.overlay.dataset.open === "true") {
        toast(sent + (sent === 1 ? " report" : " reports") + " sent.", "ok");
        if (UI.stack.length === 1) UI.stack[0]();
      }
    });
  }

  window.addEventListener("online", function () { flushQueue(); });

  /* ── Helpers ───────────────────────────────────────────────────────────── */

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

  function when(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function pad(v) { return ("0" + v).slice(-2); }

  function localDateTimeValue(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  /** IR-YYMMDD-0131: the filing date and the server's id, so the officer can quote it. */
  function referenceOf(id, iso) {
    var d = new Date(iso);
    var stamp = isNaN(d) ? "" : String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + "-";
    return "IR-" + stamp + ("000" + id).slice(-4);
  }

  function isBlank(v) {
    if (v == null) return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "boolean") return v === false;
    return String(v).trim() === "";
  }

  /* Server status → chip. */
  function chipOf(statusLabel) {
    if (statusLabel === "Rejected") return { state: "rejected", text: "REJECTED" };
    if (statusLabel === "Manager review") return { state: "review", text: "IN REVIEW" };
    if (statusLabel === "Approved") return { state: "synced", text: "APPROVED" };
    return { state: "synced", text: "FILED" };
  }

  /* Photos are downscaled before they are held on the device or uploaded. */
  function shrink(file, maxPx, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("Could not read that image")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("Could not read that image")); };
        img.onload = function () {
          var scale = Math.min(1, maxPx / Math.max(img.width, img.height));
          var c = document.createElement("canvas");
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ── Overlay shell ─────────────────────────────────────────────────────── */

  var UI = { overlay: null, header: null, body: null, footer: null, toast: null, timer: null, stack: [] };

  function phoneShell() {
    var root = document.getElementById("root");
    if (!root) return null;
    var all = root.querySelectorAll("div[style]");
    for (var i = 0; i < all.length; i++) {
      var s = all[i].getAttribute("style") || "";
      if (s.indexOf("100dvh") > -1 && s.indexOf("position: relative") > -1) return all[i];
    }
    return null;
  }

  function syncRect() {
    if (!UI.overlay) return;
    var shell = phoneShell();
    var r = shell ? shell.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    UI.overlay.style.left = r.left + "px";
    UI.overlay.style.top = r.top + "px";
    UI.overlay.style.width = r.width + "px";
    UI.overlay.style.height = r.height + "px";
  }

  function build() {
    if (UI.overlay) return;
    UI.header = el("div", { class: "asc-hd" });
    UI.body = el("div", { class: "asc-body" });
    UI.footer = el("div", { class: "ain-footer", hidden: "" });
    UI.toast = el("div", { class: "asc-toast", role: "status", "aria-live": "polite" });
    UI.overlay = el("div", {
      class: "asc-overlay", id: "ain-overlay",
      role: "dialog", "aria-modal": "true", "aria-label": "Incidents"
    }, [UI.header, UI.body, UI.footer, UI.toast]);
    document.body.appendChild(UI.overlay);

    syncRect();
    window.addEventListener("resize", syncRect);
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(syncRect);
      var shell = phoneShell();
      if (shell) ro.observe(shell);
      ro.observe(document.documentElement);
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && UI.overlay.dataset.open === "true") goBack();
    });
  }

  function setHeader(title, sub) {
    UI.header.textContent = "";
    UI.header.appendChild(el("button", {
      class: "asc-back", "aria-label": "Back", html: ICON.back, onclick: goBack
    }));
    UI.header.appendChild(el("div", {}, [
      el("div", { class: "asc-hd-title", text: title }),
      sub ? el("div", { class: "asc-hd-sub", text: sub }) : null
    ]));
  }

  function setFooter(node) {
    UI.footer.textContent = "";
    if (node) { UI.footer.appendChild(node); UI.footer.hidden = false; }
    else UI.footer.hidden = true;
  }

  function toast(msg, tone) {
    UI.toast.textContent = msg;
    UI.toast.dataset.tone = tone || "ok";
    UI.toast.dataset.open = "true";
    clearTimeout(UI.timer);
    UI.timer = setTimeout(function () { UI.toast.dataset.open = "false"; }, 3400);
  }

  function loading(text) {
    UI.body.textContent = "";
    UI.body.appendChild(el("div", { class: "asc-empty", html: ICON.spin + "<div></div>" }));
    UI.body.lastChild.lastChild.textContent = text;
  }

  function failed(err, retry) {
    UI.body.textContent = "";
    UI.body.appendChild(el("div", { class: "asc-empty", text: (err && err.message) || "Something went wrong." }));
    UI.body.appendChild(el("button", { class: "asc-btn", "data-kind": "ghost", text: "RETRY", onclick: retry }));
  }

  /* ── Screen 1: incident types + my reports ─────────────────────────────── */

  /* Which zone the list screen is showing. Module-level so the choice
     survives opening a report and coming back. */
  var listTab = "report";
  var hubCache = null;

  function screenList() {
    setHeader("Incidents", "Report and review");
    setFooter(null);
    if (!hubCache) loading("Loading incident types…");
    else renderList(hubCache);

    Api.hub().then(function (hub) {
      hubCache = hub;
      if (UI.stack[UI.stack.length - 1] === screenList) renderList(hub);
      paintHomeTile(hub);
    }).catch(function (e) {
      if (!hubCache) failed(e, screenList);
    });
  }

  /* Tab strip plus whichever zone is selected. Re-rendered in place on a tab
     change, so switching tabs never pushes a screen onto the stack. */
  function renderList(hub) {
    UI.body.textContent = "";

    if (!navigator.onLine) {
      UI.body.appendChild(el("div", { class: "ain-offline" }, [
        el("span", { html: ICON.off }),
        el("span", { text: "You're offline. You can still file reports — they'll send when you reconnect." })
      ]));
    }

    var queued = Store.queue();
    var tabs = el("div", { class: "ain-tabs" });
    [
      { key: "report", label: "Report an Incident" },
      { key: "mine", label: "My Reports" + (queued.length ? " · " + queued.length + " waiting" : "") }
    ].forEach(function (t) {
      tabs.appendChild(el("button", {
        class: "ain-tab", "data-on": String(listTab === t.key), text: t.label,
        onclick: function () {
          if (listTab === t.key) return;
          listTab = t.key;
          renderList(hub);
        }
      }));
    });
    UI.body.appendChild(tabs);

    if (listTab === "report") zoneTypes(hub.types);
    else zoneReports(queued);
  }

  function zoneTypes(types) {
    if (!types.length) {
      UI.body.appendChild(el("div", {
        class: "asc-empty",
        text: "No incident types have been published yet. Ask your supervisor to add them in Report Settings."
      }));
      return;
    }
    // Most serious first, then by name.
    types.slice().sort(function (a, b) {
      return SEVERITIES.indexOf(b.severity) - SEVERITIES.indexOf(a.severity) || a.name.localeCompare(b.name);
    }).forEach(function (type) {
      var sev = cap(type.severity);
      UI.body.appendChild(el("button", {
        class: "ain-type", "data-sev": sev, "data-locked": String(!type.mobileReady),
        onclick: function () {
          if (!type.mobileReady) { toast("This incident type has to be filed on the web portal (" + type.blockedBy.join(", ") + ").", "err"); return; }
          push(function () { screenForm(type); });
        }
      }, [
        el("div", { class: "ain-type-body" }, [
          el("div", { class: "ain-type-top" }, [
            el("div", { class: "ain-type-name", text: type.name }),
            el("span", { class: "ain-sev", "data-sev": sev, text: sev.toUpperCase() })
          ]),
          el("div", { class: "ain-type-code", text: type.code + (type.group ? " · " + type.group : "") }),
          type.description ? el("div", { class: "ain-type-desc", text: type.description }) : null,
          !type.mobileReady ? el("div", { class: "ain-type-desc", text: "Web portal only" }) : null
        ]),
        el("div", { class: "asc-chev", html: ICON.chev })
      ]));
    });
  }

  /* ── Date filter ───────────────────────────────────────────────────────
   * Narrows MY REPORTS to a filed-date range, asked of the server in the
   * officer's own local days. "all" is the resting state.
   * -------------------------------------------------------------------- */

  var PRESETS = [
    { value: "all",    label: "All dates" },
    { value: "today",  label: "Today" },
    { value: "7",      label: "Last 7 days" },
    { value: "30",     label: "Last 30 days" },
    { value: "custom", label: "Custom range" }
  ];

  var reportFilter = { preset: "all", from: "", to: "" };

  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function endOfDay(d) { var x = new Date(d); x.setHours(23, 59, 59, 999); return x; }

  /* Resolves the filter to [from, to] instants, or null for no bound. */
  function filterRange(f) {
    var now = new Date();
    if (f.preset === "today") return [startOfDay(now), endOfDay(now)];
    if (f.preset === "7" || f.preset === "30") {
      var days = parseInt(f.preset, 10);
      return [startOfDay(new Date(now.getTime() - (days - 1) * 24 * HOUR)), endOfDay(now)];
    }
    if (f.preset === "custom") {
      return [
        f.from ? startOfDay(new Date(f.from + "T00:00")) : null,
        f.to ? endOfDay(new Date(f.to + "T00:00")) : null
      ];
    }
    return [null, null];
  }

  function filterActive(f) {
    if (f.preset === "all") return false;
    if (f.preset === "custom") return !!(f.from || f.to);
    return true;
  }

  function filterLabel(f) {
    if (!filterActive(f)) return "All dates";
    if (f.preset === "custom") {
      var d = function (v) { if (!v) return ""; var p = v.split("-"); return p[1] + "/" + p[2] + "/" + p[0]; };
      if (f.from && f.to) return d(f.from) + " – " + d(f.to);
      return f.from ? "From " + d(f.from) : "Until " + d(f.to);
    }
    for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].value === f.preset) return PRESETS[i].label;
    return "All dates";
  }

  function zoneReports(queued) {
    var on = filterActive(reportFilter);
    var count = el("span", { text: "Loading…" });
    UI.body.appendChild(el("div", { class: "ain-toolbar" }, [
      el("div", { class: "ain-toolbar-sum" }, [count, el("span", { class: "ain-toolbar-range", text: filterLabel(reportFilter) })]),
      el("button", {
        class: "ain-filter", "data-on": String(on), type: "button",
        "aria-label": "Filter reports by date",
        html: ICON.filter + "<span>Filter</span>",
        onclick: openDateFilter
      })
    ]));

    // Reports still on this device come first: they are what needs attention.
    if (queued.length) {
      UI.body.appendChild(el("div", { class: "ain-divider" }, [el("span", { text: "Waiting to send · " + queued.length })]));
      queued.forEach(function (item) { UI.body.appendChild(queuedRow(item)); });
    }

    var host = el("div", { class: "ain-replist" }, [el("div", { class: "asc-empty", html: ICON.spin + "<div>Loading your reports…</div>" })]);
    UI.body.appendChild(host);

    Api.mine(filterRange(reportFilter)).then(function (res) {
      host.textContent = "";
      var items = res.items;
      count.textContent = items.length + (items.length === 1 ? " report" : " reports") + (items.length >= 100 ? " (latest 100)" : "");
      if (!items.length) {
        host.appendChild(el("div", {
          class: "asc-empty",
          text: on ? "No reports filed in this date range." : "You haven't filed any incident reports. Pick a type on the Report an Incident tab to start one."
        }));
        if (on) host.appendChild(el("button", {
          class: "asc-btn", "data-kind": "ghost", text: "CLEAR FILTER",
          onclick: function () { reportFilter = { preset: "all", from: "", to: "" }; renderList(hubCache); }
        }));
        return;
      }
      // Grouped by incident type, in the order they were last used.
      var groups = [], byName = {};
      items.forEach(function (r) {
        if (!byName[r.name]) { byName[r.name] = []; groups.push(r.name); }
        byName[r.name].push(r);
      });
      groups.forEach(function (name) {
        host.appendChild(el("div", { class: "ain-divider" }, [el("span", { text: name + " · " + byName[name].length })]));
        byName[name].forEach(function (r) { host.appendChild(reportRow(r)); });
      });
    }).catch(function (e) {
      host.textContent = "";
      count.textContent = "";
      host.appendChild(el("div", { class: "asc-empty", text: e.message || "Could not load your reports." }));
    });
  }

  function openDateFilter() {
    var draft = { preset: reportFilter.preset, from: reportFilter.from, to: reportFilter.to };

    var scrim = el("div", { class: "asc-scrim" });
    function close() {
      scrim.dataset.open = "false";
      setTimeout(function () { scrim.remove(); }, 260);
    }

    var list = el("div", { class: "ain-optlist" });
    var custom = el("div", { class: "ain-daterow" });

    function paintCustom() {
      custom.hidden = draft.preset !== "custom";
      if (custom.hidden) return;
      custom.textContent = "";
      [["from", "From"], ["to", "To"]].forEach(function (pair) {
        var key = pair[0];
        var input = el("input", { class: "ain-input", type: "date", value: draft[key] || "" });
        input.addEventListener("change", function () { draft[key] = input.value; });
        custom.appendChild(el("label", { class: "ain-datefield" }, [el("span", { class: "ain-label", text: pair[1] }), input]));
      });
    }

    function paint() {
      list.textContent = "";
      PRESETS.forEach(function (p) {
        var sel = draft.preset === p.value;
        list.appendChild(el("button", {
          class: "ain-opt", "data-on": String(sel), type: "button",
          onclick: function () { draft.preset = p.value; paint(); paintCustom(); }
        }, [el("span", {}, [el("div", { text: p.label })]), sel ? el("span", { html: ICON.check }) : null]));
      });
    }
    paint();
    paintCustom();

    scrim.appendChild(el("div", { class: "asc-sheet" }, [
      el("div", { class: "asc-sheet-title", text: "Filter by date" }),
      list,
      custom,
      el("div", { class: "asc-actions" }, [
        el("button", {
          class: "asc-btn", "data-kind": "ghost", text: "CLEAR",
          onclick: function () { reportFilter = { preset: "all", from: "", to: "" }; close(); renderList(hubCache); }
        }),
        el("button", {
          class: "asc-btn", "data-kind": "primary", text: "APPLY",
          onclick: function () { reportFilter = draft; close(); renderList(hubCache); }
        })
      ])
    ]));

    UI.overlay.appendChild(scrim);
    setTimeout(function () { scrim.dataset.open = "true"; }, 16);
  }

  function reportRow(r) {
    var chip = chipOf(r.statusLabel);
    return el("button", {
      class: "ain-rep",
      onclick: function () { push(function () { screenReport(r); }); }
    }, [
      el("div", { class: "ain-rep-body" }, [
        el("div", { class: "ain-rep-ref", text: referenceOf(r.id, r.submittedAt) + (r.severity ? " · " + cap(r.severity) : "") }),
        el("div", { class: "ain-rep-sum", text: r.summary || r.name }),
        el("div", { class: "ain-rep-when", text: when(r.submittedAt) + (r.siteName ? " · " + r.siteName : "") })
      ]),
      el("span", { class: "ain-sync", "data-state": chip.state, text: chip.text })
    ]);
  }

  function queuedRow(item) {
    return el("button", {
      class: "ain-rep",
      onclick: function () { push(function () { screenQueued(item.idempotencyKey); }); }
    }, [
      el("div", { class: "ain-rep-body" }, [
        el("div", { class: "ain-rep-ref", text: item.typeName + " · " + cap(item.severity) }),
        el("div", { class: "ain-rep-sum", text: item.error || item.values.description || "Saved on this device" }),
        el("div", { class: "ain-rep-when", text: when(item.createdAt) })
      ]),
      el("span", { class: "ain-sync", "data-state": item.error ? "rejected" : "pending", text: item.error ? "NOT SENT" : "PENDING" })
    ]);
  }

  /* ── Screen 2: the incident form ───────────────────────────────────────── */

  function screenForm(type) {
    setHeader(type.name, type.code + " · " + cap(type.severity));
    setFooter(null);
    loading("Loading the form…");
    Api.type(type.id).then(function (form) {
      if (UI.stack[UI.stack.length - 1] && UI.body.querySelector(".asc-spin")) renderForm(type, form);
    }).catch(function (e) {
      failed(e, function () { screenForm(type); });
    });
  }

  function renderForm(type, form) {
    var fields = form.fields.map(function (f) {
      var t = f.type === "photo_high" ? "photo" : f.type;
      return { key: f.key, type: t, label: f.label, required: f.required, helpText: f.helpText, options: f.options || [], choices: f.choices, supported: f.supported };
    });
    var draft = Store.loadDraft(type.id) || {};
    var values = draft.values || {};
    var restored = Object.keys(values).length > 0;
    var meta = {
      siteId: draft.siteId || form.defaultSiteId || (form.sites[0] && form.sites[0].id) || null,
      severity: draft.severity || form.defaultSeverity || type.severity || "medium"
    };
    var errors = {};

    // The moment of the incident starts at now, which is right far more often
    // than an empty field the officer has to fill by hand.
    fields.forEach(function (f) {
      if (f.type === "datetime" && isBlank(values[f.key])) values[f.key] = localDateTimeValue();
    });

    function persist() { Store.saveDraft(type.id, { values: values, siteId: meta.siteId, severity: meta.severity }); }

    /* Values change WITHOUT a repaint: each control updates itself in place.
       A full repaint here would steal focus mid-keystroke in text fields. */
    function set(key, v) {
      values[key] = v;
      persist();
      if (!errors[key]) return;
      delete errors[key];
      var wrap = formEl.querySelector('[data-field="' + key + '"]');
      if (!wrap) return;
      wrap.dataset.error = "false";
      var msg = wrap.querySelector(".ain-err");
      if (msg) msg.remove();
    }

    var formEl = el("div", { class: "ain-form" });
    var noSite = !form.sites.length;
    var blocked = !form.mobileReady || noSite;

    function paint() {
      formEl.textContent = "";
      formEl.appendChild(severityField(meta, persist));
      formEl.appendChild(siteField(form, meta, persist));
      fields.forEach(function (f) { formEl.appendChild(renderField(f, values, errors, set)); });
      UI.body.textContent = "";
      if (!navigator.onLine) {
        UI.body.appendChild(el("div", { class: "ain-offline" }, [
          el("span", { html: ICON.off }),
          el("span", { text: "Offline — this report will be held on your device and sent automatically." })
        ]));
      }
      if (noSite) UI.body.appendChild(el("div", { class: "ain-offline", text: "You aren't assigned to a site yet, so you can't file an incident. Ask your supervisor to assign you." }));
      else if (!form.mobileReady) UI.body.appendChild(el("div", { class: "ain-offline", text: "This incident type has to be filed on the web portal (" + form.blockedBy.join(", ") + ")." }));
      UI.body.appendChild(formEl);
    }

    var submitBtn = el("button", { class: "ain-submit", html: "SUBMIT INCIDENT", onclick: doSubmit });
    if (blocked) submitBtn.disabled = true;
    setFooter(el("div", {}, [
      submitBtn,
      el("div", { class: "ain-draft", text: restored ? "Draft restored — saved as you type" : "Saved as you type" })
    ]));

    function doSubmit() {
      errors = {};
      var firstBad = null;
      fields.forEach(function (f) {
        if (f.type === "divider") return;
        if (f.required && isBlank(values[f.key])) {
          errors[f.key] = f.type === "checkbox" ? "This must be confirmed." : "This field is required.";
          if (!firstBad) firstBad = f.key;
        }
      });
      if (firstBad) { showErrors(firstBad); return; }

      submitBtn.disabled = true;
      submitBtn.innerHTML = ICON.spin + " SUBMITTING";

      var item = {
        idempotencyKey: newKey(),
        typeId: type.id,
        typeName: type.name,
        severity: meta.severity,
        siteId: meta.siteId,
        fields: fields.filter(function (f) { return f.type !== "divider"; }).map(function (f) { return { key: f.key, type: f.type, label: f.label }; }),
        values: JSON.parse(JSON.stringify(values)),
        createdAt: new Date().toISOString()
      };

      send(item).then(function (res) {
        Store.clearDraft(type.id);
        hubCache = null;
        refreshHomeTile();
        replaceTop(function () { screenDone(type, res.submission); });
      }).catch(function (err) {
        if (isOffline(err)) {
          item.queued = true;
          Store.enqueue(item);
          Store.clearDraft(type.id);
          refreshHomeTile();
          replaceTop(function () { screenSaved(type, item); });
          return;
        }
        submitBtn.disabled = false;
        submitBtn.innerHTML = "SUBMIT INCIDENT";
        // "What happened?: this field is required" → highlight that field.
        var hit = fields.filter(function (f) { return (err.message || "").indexOf(f.label + ":") === 0; })[0];
        if (hit) { errors[hit.key] = err.message.slice(hit.label.length + 1).trim(); showErrors(hit.key); }
        else toast(err.message || "Could not submit. Try again.", "err");
      });
    }

    function showErrors(firstKey) {
      paint();
      var node = formEl.querySelector('[data-field="' + firstKey + '"]');
      if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
      toast("Check the highlighted fields.", "err");
    }

    paint();
  }

  /* Severity: four chips, starting at the type's. */
  function severityField(meta, persist) {
    var row = el("div", { class: "ain-sevpick", role: "radiogroup", "aria-label": "Severity" });
    function paintChips() {
      row.textContent = "";
      SEVERITIES.forEach(function (s) {
        row.appendChild(el("button", {
          class: "ain-sev", type: "button", role: "radio", "data-sev": cap(s),
          "data-on": String(meta.severity === s), "aria-checked": String(meta.severity === s), text: s.toUpperCase(),
          onclick: function () { meta.severity = s; persist(); paintChips(); }
        }));
      });
    }
    paintChips();
    return el("div", { class: "ain-field", "data-field": "__severity" }, [
      el("div", { class: "ain-label" }, [el("span", { text: "Severity" })]),
      el("div", { class: "ain-help", text: "Set by the incident type. Change it if this one is more or less serious." }),
      row
    ]);
  }

  /* Site: fixed when the officer works one, a picker when several. */
  function siteField(form, meta, persist) {
    var wrap = el("div", { class: "ain-field", "data-field": "__site" }, [el("div", { class: "ain-label" }, [el("span", { text: "Site" })])]);
    if (!form.sites.length) return wrap;
    var nameOf = function (id) { var s = form.sites.filter(function (x) { return x.id === id; })[0]; return s ? s.name : ""; };
    if (form.sites.length === 1) {
      wrap.appendChild(el("div", { class: "ain-input", "data-readonly": "true", text: form.sites[0].name }));
      return wrap;
    }
    var btn = pickerButton(nameOf(meta.siteId), function () {
      openPicker("Site", form.sites.map(function (s) { return { value: s.id, label: s.name }; }), meta.siteId, false, function (picked) {
        meta.siteId = picked; persist(); btn.setLabel(nameOf(picked));
      });
    });
    wrap.appendChild(btn);
    return wrap;
  }

  /* ── Field renderers ───────────────────────────────────────────────────── */

  function renderField(f, values, errors, set) {
    if (f.type === "divider") {
      return el("div", { class: "ain-divider", "data-field": f.key }, [el("span", { text: f.label || "" })]);
    }
    return el("div", { class: "ain-field", "data-field": f.key, "data-error": String(!!errors[f.key]) }, [
      el("div", { class: "ain-label" }, [
        el("span", { text: f.label }),
        f.required ? el("span", { class: "ain-req", text: "*" }) : null
      ]),
      f.helpText ? el("div", { class: "ain-help", text: f.helpText }) : null,
      buildControl(f, values, set),
      errors[f.key] ? el("div", { class: "ain-err" }, [el("span", { html: ICON.alert }), el("span", { text: errors[f.key] })]) : null
    ]);
  }

  function buildControl(f, values, set) {
    var v = values[f.key];

    switch (f.type) {
      case "short":
        return el("input", {
          class: "ain-input", type: "text", maxlength: "500", value: v || "",
          oninput: function (e) { set(f.key, e.target.value); }
        });

      case "number":
        return el("input", {
          class: "ain-input", type: "number", inputmode: "decimal", value: v == null ? "" : v,
          oninput: function (e) { set(f.key, e.target.value); }
        });

      case "long":
        var ta = el("textarea", { class: "ain-textarea", maxlength: "5000", oninput: function (e) { set(f.key, e.target.value); } });
        ta.value = v || "";   // textarea takes its value as content, not an attribute
        return ta;

      case "date":
      case "time":
      case "datetime":
        return el("input", {
          class: "ain-input", type: f.type === "datetime" ? "datetime-local" : f.type, value: v || "",
          max: f.type === "datetime" ? localDateTimeValue() : null,
          oninput: function (e) { set(f.key, e.target.value); }
        });

      case "checkbox": {
        var cb = el("div", { class: "ain-check", "data-on": String(!!v), role: "checkbox", tabindex: "0", "aria-checked": String(!!v) }, [
          el("span", { class: "ain-box", html: ICON.check }),
          el("span", { text: f.label })
        ]);
        var toggle = function () {
          var nv = !values[f.key];
          set(f.key, nv);
          cb.dataset.on = String(nv);
          cb.setAttribute("aria-checked", String(nv));
        };
        cb.addEventListener("click", toggle);
        cb.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } });
        return cb;
      }

      case "single": {
        var bSingle = pickerButton(v || "", function () {
          openPicker(f.label, f.options.map(function (o) { return { value: o }; }), values[f.key], false, function (picked) {
            set(f.key, picked); bSingle.setLabel(picked);
          });
        });
        return bSingle;
      }

      case "multi": {
        var cur = v || [];
        var bMulti = pickerButton(cur.length ? cur.join(", ") : "", function () {
          openPicker(f.label, f.options.map(function (o) { return { value: o }; }), values[f.key] || [], true, function (picked) {
            set(f.key, picked); bMulti.setLabel(picked.length ? picked.join(", ") : "");
          });
        });
        return bMulti;
      }

      // Pickers whose choices come from the system: an admin "site" or "incident" field.
      case "site":
      case "incident": {
        var choices = (f.choices || []).map(function (c) { return { value: c.id, label: c.name }; });
        var nameOf = function (id) { var c = choices.filter(function (x) { return x.value === id; })[0]; return c ? c.label : ""; };
        var bPick = pickerButton(nameOf(v), function () {
          openPicker(f.label, choices, values[f.key], false, function (picked) { set(f.key, picked); bPick.setLabel(nameOf(picked)); });
        });
        return bPick;
      }

      case "photo":
      case "photo_gallery":
        return photoField(f, values, set);

      default:
        // A field type this build cannot capture. Say so rather than dropping it.
        return el("div", {
          class: "ain-offline",
          text: '"' + f.label + '" can only be filled on the web portal. Record it in a description field for now.'
        });
    }
  }

  function pickerButton(label, onOpen) {
    var text = el("span", { text: label || "Select…" });
    var btn = el("button", { class: "ain-picker", "data-empty": String(!label), type: "button", onclick: onOpen }, [text, el("span", { html: ICON.down })]);
    btn.setLabel = function (v) {
      text.textContent = v || "Select…";
      btn.dataset.empty = String(!v);
    };
    return btn;
  }

  function photoField(f, values, set) {
    var single = f.type === "photo";
    var max = single ? 1 : CONFIG.maxPhotos;
    var host = el("div", { class: "ain-photos" });

    var input = el("input", {
      type: "file", accept: "image/*", hidden: "",
      onchange: function (e) {
        var files = [].slice.call(e.target.files || []);
        var list = values[f.key] || [];
        var room = max - list.length;
        if (files.length > room) {
          toast("You can attach up to " + max + (max === 1 ? " photo." : " photos."), "err");
          files = files.slice(0, Math.max(0, room));
        }
        Promise.all(files.map(function (file) { return shrink(file, 1280, 0.75); }))
          .then(function (urls) { set(f.key, list.concat(urls)); paintPhotos(); })
          .catch(function (err) { toast(err.message, "err"); });
        e.target.value = "";
      }
    });
    if (!single) input.setAttribute("multiple", "");
    // A single photo opens the camera; a gallery field lets the officer pick from the device.
    if (single) input.setAttribute("capture", "environment");

    function paintPhotos() {
      var list = values[f.key] || [];
      host.textContent = "";
      if (list.length) {
        host.appendChild(el("div", { class: "ain-thumbs" }, list.map(function (src, i) {
          return el("div", { class: "ain-thumb" }, [
            el("img", { src: src, alt: f.label + " " + (i + 1) }),
            el("button", {
              class: "ain-thumb-x", type: "button", "aria-label": "Remove photo " + (i + 1), html: ICON.x,
              onclick: function (e) {
                e.stopPropagation();
                set(f.key, (values[f.key] || []).filter(function (_, j) { return j !== i; }));
                paintPhotos();
              }
            })
          ]);
        })));
      }
      if (list.length < max) {
        host.appendChild(el("button", {
          class: "ain-addphoto", type: "button",
          html: (single ? ICON.cam : ICON.img) + "<span>" + (single ? "TAKE PHOTO" : "ADD PHOTOS") + "</span>",
          onclick: function () { input.click(); }
        }));
      }
      host.appendChild(input);
    }

    paintPhotos();
    return host;
  }

  /* ── Picker sheet ──────────────────────────────────────────────────────── */

  function openPicker(title, options, current, multi, done) {
    var chosen = multi ? (current || []).slice() : current;

    var scrim = el("div", { class: "asc-scrim" });
    function close() {
      scrim.dataset.open = "false";
      setTimeout(function () { scrim.remove(); }, 260);
    }

    var list = el("div", { class: "ain-optlist" });

    function paint() {
      list.textContent = "";
      options.forEach(function (opt) {
        var on = multi ? chosen.indexOf(opt.value) > -1 : chosen === opt.value;
        list.appendChild(el("button", {
          class: "ain-opt", "data-on": String(on), type: "button",
          onclick: function () {
            if (multi) {
              var i = chosen.indexOf(opt.value);
              if (i > -1) chosen.splice(i, 1); else chosen.push(opt.value);
              paint();
            } else {
              done(opt.value);
              close();
            }
          }
        }, [
          el("span", {}, [
            el("div", { text: opt.label || opt.value }),
            opt.sub ? el("div", { class: "ain-opt-sub", text: opt.sub }) : null
          ]),
          on ? el("span", { html: ICON.check }) : null
        ]));
      });
    }
    paint();

    scrim.appendChild(el("div", { class: "asc-sheet" }, [
      el("div", { class: "asc-sheet-title", text: title }),
      list,
      el("div", { class: "asc-actions" }, [
        el("button", { class: "asc-btn", "data-kind": "ghost", text: "CANCEL", onclick: close }),
        multi ? el("button", { class: "asc-btn", "data-kind": "primary", text: "DONE", onclick: function () { done(chosen); close(); } }) : null
      ])
    ]));

    UI.overlay.appendChild(scrim);
    setTimeout(function () { scrim.dataset.open = "true"; }, 16);
  }

  /* ── Screen 3: confirmation, filed report, queued report ───────────────── */

  function doneFooter() {
    setFooter(el("button", {
      class: "ain-submit", text: "DONE",
      onclick: function () { UI.stack = []; listTab = "mine"; push(screenList); }
    }));
  }

  function screenDone(type, sub) {
    var ref = referenceOf(sub.id, sub.submittedAt);
    setHeader(type.name, ref);
    doneFooter();
    UI.body.textContent = "";
    var review = sub.statusLabel === "Manager review";
    UI.body.appendChild(el("div", { class: "ain-done" }, [
      el("div", { class: "ain-done-ico", "data-state": "synced", html: ICON.done }),
      el("div", { class: "ain-done-title", text: "Incident reported" }),
      el("div", {
        class: "ain-done-sub",
        text: "Your supervisors and the operations team have been alerted." + (review ? " A manager will review the report." : "")
      }),
      el("div", { class: "ain-done-ref", text: ref })
    ]));
    UI.body.appendChild(el("div", { class: "asc-section", text: "WHAT YOU SUBMITTED" }));
    UI.body.appendChild(submittedAnswers(sub));
  }

  function screenSaved(type, item) {
    setHeader(type.name, "Waiting to send");
    doneFooter();
    UI.body.textContent = "";
    UI.body.appendChild(el("div", { class: "ain-done" }, [
      el("div", { class: "ain-done-ico", "data-state": "pending", html: ICON.cloud }),
      el("div", { class: "ain-done-title", text: "Report saved" }),
      el("div", { class: "ain-done-sub", text: "No connection right now. This report is stored on your device and will send by itself once you reconnect." })
    ]));
    UI.body.appendChild(el("div", { class: "asc-section", text: "WHAT YOU FILLED IN" }));
    UI.body.appendChild(localAnswers(item));
  }

  function screenQueued(key) {
    var item = Store.queue().filter(function (q) { return q.idempotencyKey === key; })[0];
    if (!item) { goBack(); return; }
    setHeader(item.typeName, item.error ? "Not sent" : "Waiting to send");
    var sendBtn = el("button", {
      class: "ain-submit", text: "SEND NOW",
      onclick: function () {
        sendBtn.disabled = true;
        sendBtn.innerHTML = ICON.spin + " SENDING";
        send(item).then(function (res) {
          Store.dequeue(key);
          refreshHomeTile();
          replaceTop(function () { screenDone({ name: item.typeName }, res.submission); });
        }).catch(function (err) {
          sendBtn.disabled = false;
          sendBtn.textContent = "SEND NOW";
          if (!isOffline(err)) Store.update(key, { error: err.message });
          toast(isOffline(err) ? "Still no connection. It will send when you're back online." : err.message, "err");
        });
      }
    });
    setFooter(el("div", {}, [
      sendBtn,
      el("button", {
        class: "asc-btn", "data-kind": "ghost", text: "DISCARD REPORT",
        onclick: function () { Store.dequeue(key); refreshHomeTile(); goBack(); }
      })
    ]));
    UI.body.textContent = "";
    UI.body.appendChild(el("div", { class: "ain-offline", text: item.error ? "The server didn't accept this report: " + item.error : "Saved " + when(item.createdAt) + ". It sends by itself when you're back online." }));
    UI.body.appendChild(el("div", { class: "asc-section", text: "REPORT" }));
    UI.body.appendChild(localAnswers(item));
  }

  function screenReport(r) {
    setHeader(referenceOf(r.id, r.submittedAt), r.name);
    setFooter(null);
    loading("Loading the report…");
    Api.submission(r.id).then(function (sub) {
      UI.body.textContent = "";
      var chip = chipOf(sub.statusLabel);
      var rows = [
        ["Status", el("span", { class: "ain-sync", "data-state": chip.state, text: chip.text })],
        ["Severity", sub.severity ? el("span", { class: "ain-sev", "data-sev": cap(sub.severity), text: sub.severity.toUpperCase() }) : null],
        ["Site", sub.site ? sub.site.name : null],
        ["Filed", when(sub.submittedAt)]
      ];
      if (sub.rejectedReason) rows.push(["Reason", sub.rejectedReason]);
      UI.body.appendChild(el("div", { class: "aop-group" }, rows.filter(function (x) { return x[1]; }).map(function (x) {
        return el("div", { class: "ain-ans" }, [
          el("div", { class: "ain-ans-l", text: x[0] }),
          typeof x[1] === "string" ? el("div", { class: "ain-ans-v", text: x[1] }) : el("div", {}, [x[1]])
        ]);
      })));
      UI.body.appendChild(el("div", { class: "asc-section", text: "REPORT" }));
      UI.body.appendChild(submittedAnswers(sub));
    }).catch(function (e) {
      failed(e, function () { screenReport(r); });
    });
  }

  function answerText(type, v) {
    if (v == null || v === "") return "";
    if (type === "checkbox") return v ? "Yes" : "No";
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "object") return v.name || v.id || "";
    if (type === "datetime") return when(v);
    return String(v);
  }

  /* A filed report, as the server returns it. */
  function submittedAnswers(sub) {
    var group = el("div", { class: "aop-group" });
    if (!sub.items.length) group.appendChild(el("div", { class: "ain-ans" }, [el("div", { class: "ain-ans-v", "data-empty": "true", text: "No answers" })]));
    sub.items.forEach(function (item) {
      if (item.photos && item.photos.length) {
        var thumbs = el("div", { class: "ain-thumbs" });
        item.photos.forEach(function (ref, i) {
          var img = el("img", { alt: item.label + " " + (i + 1) });
          Api.photo(ref).then(function (blob) { if (blob) img.src = URL.createObjectURL(blob); }).catch(function () {});
          thumbs.appendChild(el("div", { class: "ain-thumb" }, [img]));
        });
        group.appendChild(el("div", { class: "ain-ans" }, [el("div", { class: "ain-ans-l", text: item.label }), thumbs]));
        return;
      }
      var text = answerText(item.type, item.value);
      group.appendChild(el("div", { class: "ain-ans" }, [
        el("div", { class: "ain-ans-l", text: item.label }),
        el("div", { class: "ain-ans-v", "data-empty": String(isBlank(text)), text: isBlank(text) ? "Not answered" : text })
      ]));
    });
    return group;
  }

  /* A report still on the device. */
  function localAnswers(item) {
    var group = el("div", { class: "aop-group" });
    item.fields.forEach(function (f) {
      var v = item.values[f.key];
      if (isPhotoType(f.type)) {
        group.appendChild(el("div", { class: "ain-ans" }, [
          el("div", { class: "ain-ans-l", text: f.label }),
          (v && v.length)
            ? el("div", { class: "ain-thumbs" }, v.map(function (src, i) { return el("div", { class: "ain-thumb" }, [el("img", { src: src, alt: f.label + " " + (i + 1) })]); }))
            : el("div", { class: "ain-ans-v", "data-empty": "true", text: "None attached" })
        ]));
        return;
      }
      var text = answerText(f.type, v);
      group.appendChild(el("div", { class: "ain-ans" }, [
        el("div", { class: "ain-ans-l", text: f.label }),
        el("div", { class: "ain-ans-v", "data-empty": String(isBlank(text)), text: isBlank(text) ? "Not answered" : text })
      ]));
    });
    return group;
  }

  /* ── Navigation ────────────────────────────────────────────────────────── */

  function push(screen) { UI.stack.push(screen); screen(); }
  function replaceTop(screen) { UI.stack.pop(); push(screen); }

  function goBack() {
    var sheet = UI.overlay.querySelector(".asc-scrim");
    if (sheet) { sheet.remove(); return; }
    UI.stack.pop();
    if (!UI.stack.length) {
      UI.overlay.dataset.open = "false";
      setFooter(null);
      return;
    }
    UI.stack[UI.stack.length - 1]();
  }

  function open() {
    build();
    syncRect();
    UI.stack = [];
    push(screenList);
    setTimeout(function () { UI.overlay.dataset.open = "true"; }, 16);
    flushQueue();
  }

  /* ── Home tile ─────────────────────────────────────────────────────────────
   * In the shipped bundle this tile navigates to the Chat screen. Catch the
   * click during the capture phase, before React's handler runs, and open the
   * incidents module instead. Its subtitle shows what needs the officer.
   * ------------------------------------------------------------------------ */

  var DEFAULT_SUB = "Active Logs";
  var homeTileText = null;

  function tileTitle() {
    var leaves = document.querySelectorAll("#root div");
    for (var i = 0; i < leaves.length; i++) {
      var n = leaves[i];
      if (n.childElementCount === 0 && n.textContent.trim() === "Incidents" && n.nextElementSibling) return n;
    }
    return null;
  }

  function isIncidentTile(node) {
    var title = tileTitle();
    if (!title) return false;
    var tile = title.parentElement;
    // The tile is the title's nearest ancestor that also holds the icon; any short text block holding the title counts.
    while (tile && tile.parentElement && tile.parentElement.textContent.trim().length < 40 && tile.parentElement.id !== "root") tile = tile.parentElement;
    return !!tile && tile.contains(node);
  }

  function paintHomeTile(hub) {
    if (hub) {
      var waiting = Store.queue().length;
      var review = hub.recent.filter(function (r) { return r.statusLabel === "Manager review"; }).length;
      homeTileText = waiting ? waiting + " waiting to send" : review ? review + " in review" : DEFAULT_SUB;
    }
    if (!homeTileText) return;
    var title = tileTitle();
    if (title && title.nextElementSibling.textContent !== homeTileText) title.nextElementSibling.textContent = homeTileText;
  }

  function refreshHomeTile() {
    if (!signedIn()) return;
    Api.hub().then(function (hub) { hubCache = hub; paintHomeTile(hub); }).catch(function () { /* keep the last text */ });
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest("#root") || !isIncidentTile(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    open();
  }, true);

  function start() {
    var root = document.getElementById("root");
    if (!root) { setTimeout(start, 300); return; }
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; paintHomeTile(); }, 80);
    }).observe(root, { childList: true, subtree: true, characterData: true });
    setTimeout(function () { refreshHomeTile(); flushQueue(); }, 2400);
    setInterval(refreshHomeTile, 5 * 60 * 1000);
  }

  window.AlexiosIncidents = {
    open: open,
    flush: flushQueue,
    queue: function () { return Store.queue(); },
    config: CONFIG
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
