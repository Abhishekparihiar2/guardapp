/* ============================================================================
 * ALEXIOS Mobile — Site Configuration (NFC + Barcode checkpoint provisioning)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 * Loaded from dist/index.html after the app script.
 *
 * Adds:  Settings → SITE CONFIGURATION → [site] → [checkpoint]
 *          · Configure NFC Token   (device NFC reader)
 *          · Configure Barcode     (device camera)
 *          · Unassign either binding
 *
 * Backend: set window.AlexiosSiteConfig.configure({ useMock:false, apiBase:'…' })
 *          Until then it runs against a localStorage-backed mock so the flow is
 *          fully demonstrable. See API section for the expected contract.
 * ========================================================================== */
(function () {
  "use strict";

  /* ── Config ────────────────────────────────────────────────────────────── */

  var CONFIG = {
    useMock: true,          // flip to false once the backend is live
    apiBase: "/api",
    authToken: null,        // Bearer token, if the backend needs one
    allowSimulatedScan: true // desktop/unsupported-hardware demo fallback
  };

  /* ── Small helpers ─────────────────────────────────────────────────────── */

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

  function fmtStamp(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  var ICON = {
    site: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-5h6v5"/></svg>',
    pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    nfc: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8.3a8 8 0 0 1 0 7.4M9.5 6a12 12 0 0 1 0 12M13 3.7a16 16 0 0 1 0 16.6"/><circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>',
    bar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5v14M8 5v14M12 5v14M16 5v14M20 5v14"/></svg>',
    chevron: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    spin: '<svg class="asc-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.6"/></svg>'
  };

  /* ── API layer ─────────────────────────────────────────────────────────────
   * Expected backend contract:
   *   GET    /api/me/sites                       -> [{id,name,address,checkpointCount}]
   *   GET    /api/sites/:siteId/checkpoints      -> [{id,code,name,type,nfcToken,
   *                                                  barcodeId,updatedAt,updatedBy}]
   *   PUT    /api/checkpoints/:id/nfc      {token}     -> 200 | 409 {conflictWith}
   *   DELETE /api/checkpoints/:id/nfc                  -> 200
   *   PUT    /api/checkpoints/:id/barcode  {barcodeId} -> 200 | 409 {conflictWith}
   *   DELETE /api/checkpoints/:id/barcode              -> 200
   * ------------------------------------------------------------------------ */

  function ConflictError(msg, conflictWith) {
    var e = new Error(msg);
    e.name = "ConflictError";
    e.conflictWith = conflictWith;
    return e;
  }

  var Api = {
    listSites: function () {
      return CONFIG.useMock ? Mock.listSites() : req("GET", "/me/sites");
    },
    listCheckpoints: function (siteId) {
      return CONFIG.useMock ? Mock.listCheckpoints(siteId)
        : req("GET", "/sites/" + encodeURIComponent(siteId) + "/checkpoints");
    },
    assign: function (checkpointId, kind, value) {
      var path = "/checkpoints/" + encodeURIComponent(checkpointId) + "/" + kind;
      var body = kind === "nfc" ? { token: value } : { barcodeId: value };
      return CONFIG.useMock ? Mock.assign(checkpointId, kind, value) : req("PUT", path, body);
    },
    unassign: function (checkpointId, kind) {
      var path = "/checkpoints/" + encodeURIComponent(checkpointId) + "/" + kind;
      return CONFIG.useMock ? Mock.unassign(checkpointId, kind) : req("DELETE", path);
    }
  };

  function req(method, path, body) {
    var headers = { "Content-Type": "application/json" };
    if (CONFIG.authToken) headers.Authorization = "Bearer " + CONFIG.authToken;
    return fetch(CONFIG.apiBase + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      if (res.status === 409) {
        return res.json().catch(function () { return {}; }).then(function (d) {
          throw ConflictError("Already assigned", d.conflictWith);
        });
      }
      if (!res.ok) throw new Error("Request failed (" + res.status + ")");
      return res.status === 204 ? null : res.json();
    });
  }

  /* ── Mock store (localStorage) ─────────────────────────────────────────── */

  var Mock = (function () {
    var KEY = "alexios.siteConfig.v1";
    var SEED = {
      sites: [
        { id: "SITE-01", name: "Ritz-Carlton Tower B", address: "Floors 4–22, Downtown Core" },
        { id: "SITE-02", name: "Meridian Financial Plaza", address: "1400 Harbour Street" },
        { id: "SITE-03", name: "Harbor Point Logistics", address: "Pier 9, East Terminal" }
      ],
      checkpoints: [
        { id: "CP-001", siteId: "SITE-01", code: "CP-001", name: "Main Entrance Gate",     type: "NFC",     nfcToken: "04:A2:2B:7C:19:80", barcodeId: null, updatedAt: "2026-08-28T09:12:00Z", updatedBy: "OFF-1024" },
        { id: "CP-002", siteId: "SITE-01", code: "CP-002", name: "North Perimeter Fence",  type: "NFC",     nfcToken: null, barcodeId: null, updatedAt: null, updatedBy: null },
        { id: "CP-003", siteId: "SITE-01", code: "CP-003", name: "Loading Dock Door",      type: "Barcode", nfcToken: null, barcodeId: "8901234567890", updatedAt: "2026-09-01T14:40:00Z", updatedBy: "OFF-1024" },
        { id: "CP-004", siteId: "SITE-01", code: "CP-004", name: "Server Room B",          type: "Barcode", nfcToken: null, barcodeId: null, updatedAt: null, updatedBy: null },
        { id: "CP-005", siteId: "SITE-01", code: "CP-005", name: "Roof Access Stairwell",  type: "NFC",     nfcToken: null, barcodeId: null, updatedAt: null, updatedBy: null },
        { id: "CP-101", siteId: "SITE-02", code: "CP-101", name: "Lobby Turnstile North",  type: "NFC",     nfcToken: null, barcodeId: null, updatedAt: null, updatedBy: null },
        { id: "CP-102", siteId: "SITE-02", code: "CP-102", name: "Parking Level P3",       type: "Barcode", nfcToken: null, barcodeId: null, updatedAt: null, updatedBy: null },
        { id: "CP-103", siteId: "SITE-02", code: "CP-103", name: "Executive Floor 31",     type: "NFC",     nfcToken: null, barcodeId: null, updatedAt: null, updatedBy: null },
        { id: "CP-201", siteId: "SITE-03", code: "CP-201", name: "Gate House A",           type: "NFC",     nfcToken: null, barcodeId: null, updatedAt: null, updatedBy: null },
        { id: "CP-202", siteId: "SITE-03", code: "CP-202", name: "Cold Storage Entry",     type: "Barcode", nfcToken: null, barcodeId: null, updatedAt: null, updatedBy: null }
      ]
    };

    function load() {
      try {
        var raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) { /* private mode / blocked storage — fall through to seed */ }
      return JSON.parse(JSON.stringify(SEED));
    }
    function save(db) {
      try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* non-fatal */ }
    }
    function latency(v) {
      return new Promise(function (r) { setTimeout(function () { r(v); }, 260); });
    }

    return {
      listSites: function () {
        var db = load();
        return latency(db.sites.map(function (s) {
          return Object.assign({}, s, {
            checkpointCount: db.checkpoints.filter(function (c) { return c.siteId === s.id; }).length
          });
        }));
      },
      listCheckpoints: function (siteId) {
        var db = load();
        return latency(db.checkpoints.filter(function (c) { return c.siteId === siteId; }));
      },
      assign: function (cpId, kind, value) {
        var db = load();
        var field = kind === "nfc" ? "nfcToken" : "barcodeId";
        var clash = db.checkpoints.filter(function (c) {
          return c[field] === value && c.id !== cpId;
        })[0];
        if (clash) {
          return latency().then(function () {
            throw ConflictError("Already assigned", { id: clash.id, name: clash.name });
          });
        }
        var cp = db.checkpoints.filter(function (c) { return c.id === cpId; })[0];
        if (!cp) return latency().then(function () { throw new Error("Checkpoint not found"); });
        cp[field] = value;
        cp.updatedAt = new Date().toISOString();
        cp.updatedBy = "OFF-1024";
        save(db);
        return latency(cp);
      },
      unassign: function (cpId, kind) {
        var db = load();
        var cp = db.checkpoints.filter(function (c) { return c.id === cpId; })[0];
        if (!cp) return latency().then(function () { throw new Error("Checkpoint not found"); });
        cp[kind === "nfc" ? "nfcToken" : "barcodeId"] = null;
        cp.updatedAt = new Date().toISOString();
        cp.updatedBy = "OFF-1024";
        save(db);
        return latency(cp);
      },
      reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
    };
  })();

  /* ── Scanners ──────────────────────────────────────────────────────────────
   * Web NFC (NDEFReader) is Chrome-on-Android only — no iOS support.
   * BarcodeDetector is Chrome/Edge; iOS Safari falls back to simulated scan
   * until the app is wrapped in Capacitor (see the plan notes).
   * ------------------------------------------------------------------------ */

  var Scanner = {
    nfcAvailable: function () { return typeof window.NDEFReader === "function"; },
    barcodeAvailable: function () {
      return typeof window.BarcodeDetector === "function" &&
        !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    scanNfc: function (signal) {
      return new Promise(function (resolve, reject) {
        var reader;
        try { reader = new window.NDEFReader(); }
        catch (e) { return reject(new Error("NFC reader unavailable")); }

        reader.addEventListener("reading", function (ev) {
          var token = (ev.serialNumber || "").toUpperCase();
          if (!token && ev.message) {
            // No serial exposed — fall back to the first text record.
            for (var i = 0; i < ev.message.records.length; i++) {
              var rec = ev.message.records[i];
              if (rec.recordType === "text") {
                token = new TextDecoder(rec.encoding || "utf-8").decode(rec.data);
                break;
              }
            }
          }
          if (token) resolve({ token: token });
          else reject(new Error("Tag carried no readable identifier"));
        });
        reader.addEventListener("readingerror", function () {
          reject(new Error("Could not read that tag — try again"));
        });

        reader.scan({ signal: signal }).catch(function (err) {
          reject(err.name === "NotAllowedError"
            ? new Error("NFC permission denied")
            : new Error("Could not start NFC — check it is switched on"));
        });
        signal.addEventListener("abort", function () { reject(new DOMException("Aborted", "AbortError")); });
      });
    },

    scanBarcode: function (signal, videoEl) {
      return new Promise(function (resolve, reject) {
        var stream, raf;
        var detector = new window.BarcodeDetector({
          formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "data_matrix"]
        });

        function stop() {
          if (raf) clearTimeout(raf);
          if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
        }
        signal.addEventListener("abort", function () {
          stop();
          reject(new DOMException("Aborted", "AbortError"));
        });

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
          .then(function (s) {
            if (signal.aborted) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
            stream = s;
            videoEl.srcObject = s;
            videoEl.setAttribute("playsinline", "");
            return videoEl.play();
          })
          .then(function tick() {
            if (signal.aborted) return;
            raf = setTimeout(function () {
              detector.detect(videoEl).then(function (codes) {
                if (signal.aborted) return;
                if (codes && codes.length) {
                  stop();
                  resolve({ value: codes[0].rawValue, format: codes[0].format });
                } else tick();
              }).catch(function () { tick(); });
            }, 90);
          })
          .catch(function (err) {
            stop();
            reject(err && err.name === "NotAllowedError"
              ? new Error("Camera permission denied")
              : new Error("Could not start the camera"));
          });
      });
    },

    simulate: function (kind) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          if (kind === "nfc") {
            var hex = [];
            for (var i = 0; i < 6; i++) {
              hex.push(("0" + Math.floor(Math.random() * 256).toString(16)).slice(-2).toUpperCase());
            }
            resolve({ token: hex.join(":") });
          } else {
            var digits = "";
            for (var j = 0; j < 13; j++) digits += Math.floor(Math.random() * 10);
            resolve({ value: digits, format: "ean_13" });
          }
        }, 1400);
      });
    }
  };

  /* ── UI ────────────────────────────────────────────────────────────────── */

  var UI = {
    overlay: null, header: null, body: null, toast: null, toastTimer: null,
    stack: [], scanAbort: null
  };

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

  function buildOverlay() {
    if (UI.overlay) return;
    UI.header = el("div", { class: "asc-hd" });
    UI.body = el("div", { class: "asc-body" });
    UI.toast = el("div", { class: "asc-toast", role: "status", "aria-live": "polite" });
    UI.overlay = el("div", {
      class: "asc-overlay", id: "asc-overlay",
      role: "dialog", "aria-modal": "true", "aria-label": "Site Configuration"
    }, [UI.header, UI.body, UI.toast]);
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

  function toast(msg, tone) {
    UI.toast.textContent = msg;
    UI.toast.dataset.tone = tone || "ok";
    UI.toast.dataset.open = "true";
    clearTimeout(UI.toastTimer);
    UI.toastTimer = setTimeout(function () { UI.toast.dataset.open = "false"; }, 3200);
  }

  function loading(label) {
    UI.body.textContent = "";
    UI.body.appendChild(el("div", { class: "asc-empty", html: ICON.spin + "<div>" + label + "</div>" }));
  }

  function failed(err, retry) {
    UI.body.textContent = "";
    UI.body.appendChild(el("div", { class: "asc-empty", text: err.message || "Something went wrong." }));
    UI.body.appendChild(el("button", { class: "asc-btn", "data-kind": "ghost", text: "RETRY", onclick: retry }));
  }

  function chevronRow(opts) {
    return el("button", { class: "asc-row", onclick: opts.onclick }, [
      el("div", { class: "asc-row-main" }, [
        el("div", { class: "asc-ico", html: opts.icon }),
        el("div", { class: "asc-row-txt" }, [
          el("div", { class: "asc-row-title", text: opts.title }),
          opts.meta ? el("div", { class: "asc-row-meta", text: opts.meta }) : null,
          opts.chips || null
        ])
      ]),
      el("div", { class: "asc-chev", html: ICON.chevron })
    ]);
  }

  /* ── Screen 1: sites assigned to this officer ──────────────────────────── */

  function screenSites() {
    setHeader("Site Configuration", "Sites assigned to you");
    loading("Loading your sites…");
    Api.listSites().then(function (sites) {
      UI.body.textContent = "";
      if (!sites.length) {
        UI.body.appendChild(el("div", {
          class: "asc-empty",
          text: "You are not assigned to any sites yet. Your supervisor assigns sites from the admin portal."
        }));
        return;
      }
      UI.body.appendChild(el("div", { class: "asc-section", text: "ASSIGNED SITES" }));
      sites.forEach(function (s) {
        UI.body.appendChild(chevronRow({
          icon: ICON.site,
          title: s.name,
          meta: s.address + "  ·  " + s.checkpointCount + " checkpoints",
          onclick: function () { push(function () { screenCheckpoints(s); }); }
        }));
      });
    }).catch(function (e) { failed(e, screenSites); });
  }

  /* ── Screen 2: checkpoints at a site ───────────────────────────────────── */

  function screenCheckpoints(site) {
    setHeader(site.name, "Checkpoints · tap to configure");
    loading("Loading checkpoints…");
    Api.listCheckpoints(site.id).then(function (cps) {
      UI.body.textContent = "";
      if (!cps.length) {
        UI.body.appendChild(el("div", {
          class: "asc-empty",
          text: "No checkpoints have been created for this site yet."
        }));
        return;
      }
      var done = cps.filter(function (c) { return c.nfcToken || c.barcodeId; }).length;
      UI.body.appendChild(el("div", {
        class: "asc-section", text: "CHECKPOINTS · " + done + " OF " + cps.length + " CONFIGURED"
      }));
      cps.forEach(function (cp) {
        var chips = el("div", { class: "asc-chips" }, [
          el("span", {
            class: "asc-chip", "data-on": String(!!cp.nfcToken),
            html: (cp.nfcToken ? ICON.check : "") + "NFC"
          }),
          el("span", {
            class: "asc-chip", "data-on": String(!!cp.barcodeId),
            html: (cp.barcodeId ? ICON.check : "") + "BARCODE"
          })
        ]);
        UI.body.appendChild(chevronRow({
          icon: ICON.pin,
          title: cp.name,
          meta: cp.code + "  ·  patrol scan: " + cp.type,
          chips: chips,
          onclick: function () { push(function () { screenCheckpoint(site, cp); }); }
        }));
      });
    }).catch(function (e) { failed(e, function () { screenCheckpoints(site); }); });
  }

  /* ── Screen 3: one checkpoint — assign / unassign ──────────────────────── */

  function screenCheckpoint(site, cp) {
    function render() {
      setHeader(cp.name, cp.code + " · " + site.name);
      UI.body.textContent = "";
      UI.body.appendChild(bindingCard("nfc", cp));
      UI.body.appendChild(bindingCard("barcode", cp));
      if (cp.updatedAt) {
        UI.body.appendChild(el("div", {
          class: "asc-stamp",
          text: "Last changed " + fmtStamp(cp.updatedAt) + (cp.updatedBy ? " by " + cp.updatedBy : "")
        }));
      }
    }

    function bindingCard(kind, cpNow) {
      var isNfc = kind === "nfc";
      var value = isNfc ? cpNow.nfcToken : cpNow.barcodeId;
      var label = isNfc ? "NFC TOKEN" : "BARCODE ID";

      var actions = el("div", { class: "asc-actions" }, [
        el("button", {
          class: "asc-btn", "data-kind": "primary",
          text: value ? "RESCAN" : "CONFIGURE",
          onclick: function () { openScan(kind, cpNow, applyResult); }
        }),
        value ? el("button", {
          class: "asc-btn", "data-kind": "danger", text: "UNASSIGN",
          onclick: function () { confirmUnassign(kind, cpNow, applyResult); }
        }) : null
      ]);

      return el("div", { class: "asc-card" }, [
        el("div", { class: "asc-card-hd" }, [
          el("div", { class: "asc-card-title", html: (isNfc ? ICON.nfc : ICON.bar) + "<span>" + label + "</span>" }),
          el("span", {
            class: "asc-chip", "data-on": String(!!value),
            html: value ? ICON.check + "ASSIGNED" : "NOT SET"
          })
        ]),
        el("div", {
          class: "asc-val", "data-empty": String(!value),
          text: value || (isNfc ? "No tag assigned to this checkpoint" : "No barcode assigned to this checkpoint")
        }),
        actions
      ]);
    }

    function applyResult(updated) {
      cp = Object.assign(cp, updated);
      render();
    }

    render();
  }

  /* ── Unassign confirmation ─────────────────────────────────────────────── */

  function confirmUnassign(kind, cp, done) {
    var label = kind === "nfc" ? "NFC token" : "barcode";
    var scrim = el("div", { class: "asc-scrim" });
    var status = el("div", { class: "asc-status", text: "" });

    function close() { scrim.dataset.open = "false"; setTimeout(function () { scrim.remove(); }, 260); }

    var confirmBtn = el("button", {
      class: "asc-btn", "data-kind": "danger", text: "UNASSIGN",
      onclick: function () {
        confirmBtn.disabled = true;
        status.dataset.tone = "";
        status.innerHTML = ICON.spin + "<span>Removing…</span>";
        Api.unassign(cp.id, kind).then(function (updated) {
          close();
          done(updated || (kind === "nfc" ? { nfcToken: null } : { barcodeId: null }));
          toast(label.charAt(0).toUpperCase() + label.slice(1) + " unassigned from " + cp.name + ".", "ok");
        }).catch(function (e) {
          confirmBtn.disabled = false;
          status.dataset.tone = "err";
          status.textContent = e.message || "Could not unassign.";
        });
      }
    });

    scrim.appendChild(el("div", { class: "asc-sheet" }, [
      el("div", { class: "asc-sheet-title", text: "Unassign " + label + "?" }),
      el("div", {
        class: "asc-sheet-sub",
        text: "Officers will no longer be able to scan " + cp.name + " with this " + label +
              ". The checkpoint stays on the patrol route."
      }),
      status,
      el("div", { class: "asc-actions" }, [
        el("button", { class: "asc-btn", "data-kind": "ghost", text: "CANCEL", onclick: close }),
        confirmBtn
      ])
    ]));

    UI.overlay.appendChild(scrim);
    setTimeout(function () { scrim.dataset.open = "true"; }, 16);
  }

  /* ── Scan sheet ────────────────────────────────────────────────────────── */

  function openScan(kind, cp, done) {
    var isNfc = kind === "nfc";
    var supported = isNfc ? Scanner.nfcAvailable() : Scanner.barcodeAvailable();
    var simulated = !supported && CONFIG.allowSimulatedScan;

    var abort = new AbortController();
    UI.scanAbort = abort;

    var scrim = el("div", { class: "asc-scrim" });
    var video = el("video", { class: "asc-cam", muted: "", playsinline: "" });
    var target = el("div", { class: "asc-target" });
    var status = el("div", { class: "asc-status" });
    var footer = el("div", { class: "asc-actions" });

    function close() {
      abort.abort();
      UI.scanAbort = null;
      scrim.dataset.open = "false";
      setTimeout(function () { scrim.remove(); }, 260);
    }

    var sheet = el("div", { class: "asc-sheet" }, [
      el("div", {
        class: "asc-sheet-title",
        text: (isNfc ? "Scan NFC tag" : "Scan barcode") + " · " + cp.code
      }),
      el("div", {
        class: "asc-sheet-sub",
        text: isNfc
          ? "Hold the back of your device against the tag mounted at " + cp.name + "."
          : "Point the camera at the barcode label at " + cp.name + "."
      }),
      target, status, footer
    ]);
    scrim.appendChild(sheet);
    UI.overlay.appendChild(scrim);
    setTimeout(function () { scrim.dataset.open = "true"; }, 16);

    if (!supported) {
      sheet.insertBefore(el("div", {
        class: "asc-note",
        text: isNfc
          ? "This device has no Web NFC support (Chrome on Android only — iOS needs the native build). Showing a simulated scan so the flow can be reviewed."
          : "No camera barcode support on this device. Showing a simulated scan so the flow can be reviewed."
      }), target);
    }

    // Save the scanned value, handling the already-assigned-elsewhere case.
    function commit(value) {
      status.dataset.tone = "";
      status.innerHTML = ICON.spin + "<span>Saving to server…</span>";
      Api.assign(cp.id, kind, value).then(function (updated) {
        close();
        done(updated || (isNfc ? { nfcToken: value } : { barcodeId: value }));
        toast((isNfc ? "NFC token" : "Barcode") + " saved to " + cp.name + ".", "ok");
      }).catch(function (e) {
        status.dataset.tone = "err";
        if (e.name === "ConflictError" && e.conflictWith) {
          status.textContent = "Already assigned to " + e.conflictWith.name + " (" + e.conflictWith.id + ")";
        } else {
          status.textContent = e.message || "Could not save.";
        }
        footer.textContent = "";
        footer.appendChild(el("button", { class: "asc-btn", "data-kind": "ghost", text: "CLOSE", onclick: close }));
        footer.appendChild(el("button", { class: "asc-btn", "data-kind": "primary", text: "SCAN AGAIN", onclick: start }));
      });
    }

    function start() {
      target.textContent = "";
      footer.textContent = "";
      footer.appendChild(el("button", { class: "asc-btn", "data-kind": "ghost", text: "CANCEL", onclick: close }));
      status.dataset.tone = "";
      status.innerHTML = ICON.spin + "<span>" +
        (isNfc ? "Waiting for tag…" : "Looking for a barcode…") + "</span>";

      var scan;
      if (simulated) {
        target.className = "asc-target asc-pulse";
        target.innerHTML = isNfc ? ICON.nfc : ICON.bar;
        scan = Scanner.simulate(kind);
      } else if (isNfc) {
        target.className = "asc-target asc-pulse";
        target.innerHTML = ICON.nfc;
        scan = Scanner.scanNfc(abort.signal);
      } else {
        target.className = "asc-target";
        target.appendChild(video);
        scan = Scanner.scanBarcode(abort.signal, video);
      }

      scan.then(function (res) {
        var value = isNfc ? res.token : res.value;
        status.dataset.tone = "ok";
        status.innerHTML = ICON.check + "<span>Read " + value + "</span>";
        commit(value);
      }).catch(function (e) {
        if (e && e.name === "AbortError") return;
        status.dataset.tone = "err";
        status.textContent = e.message || "Scan failed.";
        footer.textContent = "";
        footer.appendChild(el("button", { class: "asc-btn", "data-kind": "ghost", text: "CLOSE", onclick: close }));
        footer.appendChild(el("button", { class: "asc-btn", "data-kind": "primary", text: "TRY AGAIN", onclick: start }));
      });
    }

    start();
  }

  /* ── Navigation stack ──────────────────────────────────────────────────── */

  function push(screen) { UI.stack.push(screen); screen(); }

  function goBack() {
    if (UI.scanAbort) { UI.scanAbort.abort(); UI.scanAbort = null; }
    var sheet = UI.overlay.querySelector(".asc-scrim");
    if (sheet) { sheet.remove(); return; }
    UI.stack.pop();
    if (!UI.stack.length) { closeOverlay(); return; }
    UI.stack[UI.stack.length - 1]();
  }

  function openOverlay() {
    buildOverlay();
    syncRect();
    UI.stack = [];
    push(screenSites);
    setTimeout(function () { UI.overlay.dataset.open = "true"; }, 16);
  }

  function closeOverlay() {
    UI.overlay.dataset.open = "false";
    UI.body.textContent = "";
  }

  /* ── Settings injection ────────────────────────────────────────────────────
   * The Settings list is React-rendered, so anything we insert can be wiped on
   * the next render. A MutationObserver re-inserts it whenever that happens.
   * ------------------------------------------------------------------------ */

  var ROW_STYLE = "width:100%;padding:16px 20px;display:flex;align-items:center;" +
    "justify-content:space-between;background:rgba(255,255,255,0.03);" +
    "border:1px solid rgba(255,255,255,0.05);border-radius:14px;color:white;" +
    "cursor:pointer;backdrop-filter:blur(20px);margin-bottom:8px;";
  var HDR_STYLE = "color:rgba(180,200,255,0.6);font-size:11px;font-weight:700;" +
    "letter-spacing:1.5px;margin-top:16px;margin-bottom:8px;" +
    'font-family:"DM Mono",monospace;padding-left:4px;';

  function findSectionHeader(text) {
    var nodes = document.querySelectorAll("#root div[style]");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].children.length === 0 &&
          nodes[i].textContent.trim() === text &&
          (nodes[i].getAttribute("style") || "").indexOf("letter-spacing") > -1) {
        return nodes[i];
      }
    }
    return null;
  }

  var injecting = false;

  function injectEntry() {
    if (injecting) return;
    var anchor = findSectionHeader("ACCOUNT");
    if (!anchor || !anchor.parentElement) return;
    var list = anchor.parentElement;
    if (list.querySelector("#asc-entry")) return;

    injecting = true;

    var header = el("div", { id: "asc-entry", style: HDR_STYLE, text: "SITE CONFIGURATION" });
    var row = el("button", {
      style: ROW_STYLE,
      onclick: function (e) { e.preventDefault(); e.stopPropagation(); openOverlay(); }
    }, [
      el("div", { style: "display:flex;align-items:center;gap:12px;" }, [
        el("div", {
          style: "width:36px;height:36px;border-radius:10px;background:rgba(180,200,255,0.08);" +
                 "display:flex;align-items:center;justify-content:center;color:rgba(180,200,255,0.8);",
          html: ICON.site
        }),
        el("div", {
          style: "font-size:14px;font-weight:600;letter-spacing:0.3px;color:rgba(255,255,255,0.9);",
          text: "SITES & CHECKPOINTS"
        })
      ]),
      el("div", { style: "color:rgba(255,255,255,0.3);display:flex;", html: ICON.chevron })
    ]);

    list.insertBefore(header, anchor);
    list.insertBefore(row, anchor);

    setTimeout(function () { injecting = false; }, 0);
  }

  function startObserver() {
    var root = document.getElementById("root");
    if (!root) { setTimeout(startObserver, 300); return; }
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; injectEntry(); }, 60);
    }).observe(root, { childList: true, subtree: true });
    injectEntry();
  }

  /* ── Public handle ─────────────────────────────────────────────────────── */

  window.AlexiosSiteConfig = {
    configure: function (opts) { Object.assign(CONFIG, opts || {}); return CONFIG; },
    open: openOverlay,
    resetMockData: Mock.reset,
    config: CONFIG
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else {
    startObserver();
  }
})();
