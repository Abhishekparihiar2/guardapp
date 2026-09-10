/* ============================================================================
 * ALEXIOS Mobile — Incidents
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 * Requires alexios-ui.css + incidents.css.
 *
 * Home → Incidents opens:
 *   1. REPORT AN INCIDENT — incident types published by the admin portal
 *   2. MY REPORTS         — this officer's submissions, grouped by type
 *
 * Selecting a type renders the form the admin authored for it (Form Builder),
 * field-for-field and in order. Submitting queues the report; if the device is
 * offline the report is held locally and flushed when connectivity returns.
 *
 * Also fixes the Home tile, which in the shipped bundle navigates to Chat.
 *
 * Field types rendered (phase 1):
 *   short long number divider checkbox single multi
 *   date time datetime photo photo_gallery site
 * Anything else the admin publishes renders as an explicit "not supported yet"
 * block rather than silently vanishing from the form.
 *
 * Backend: window.AlexiosIncidents.configure({ useMock:false, apiBase:'…' })
 *   GET  /api/incident-categories?status=active -> [{id,code,name,description,
 *          severity,region,status,form:{fields:[{id,type,label,required,
 *          helpText,options}]}}]
 *   GET  /api/me/incident-reports               -> [report]
 *   POST /api/incident-reports {categoryId,values,createdAt} -> {id,reference}
 * ========================================================================== */
(function () {
  "use strict";

  var CONFIG = { useMock: true, apiBase: "/api", authToken: null, maxPhotos: 6 };

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

  /* ── Catalog (what the admin portal publishes) ─────────────────────────── */

  var MOCK_CATEGORIES = [
    {
      id: "IC-01", code: "INC-FIRE", name: "Fire or Smoke Outbreak",
      description: "Any visible flame, smoke, or activated fire alarm on site.",
      severity: "Critical", region: "All", status: "active",
      form: { fields: [
        { id: "f1", type: "datetime", label: "Incident Date & Time", required: true },
        { id: "f2", type: "site", label: "Site", required: true },
        { id: "f3", type: "single", label: "Fire alarm activated?", required: true,
          options: ["Yes — alarm sounding", "Yes — silenced", "No"] },
        { id: "f4", type: "long", label: "Description", required: true,
          helpText: "What you saw, where, and what you did. Facts only." },
        { id: "f5", type: "multi", label: "Services notified", required: false,
          options: ["Fire brigade", "Site supervisor", "Building management", "Police"] },
        { id: "f6", type: "checkbox", label: "Area evacuated", required: false },
        { id: "f7", type: "photo", label: "Photos", required: false }
      ] }
    },
    {
      id: "IC-02", code: "INC-MED", name: "Medical Emergency",
      description: "Injury or illness requiring first aid or ambulance response.",
      severity: "Critical", region: "All", status: "active",
      form: { fields: [
        { id: "f1", type: "datetime", label: "Incident Date & Time", required: true },
        { id: "f2", type: "site", label: "Site", required: true },
        { id: "f3", type: "single", label: "Person affected", required: true,
          options: ["Member of public", "Client staff", "Contractor", "Security officer"] },
        { id: "f4", type: "long", label: "Description", required: true },
        { id: "f5", type: "checkbox", label: "Ambulance called", required: false },
        { id: "f6", type: "short", label: "Responding unit / reference", required: false,
          helpText: "Ambulance call sign or dispatch reference, if given." },
        { id: "f7", type: "photo", label: "Photos", required: false }
      ] }
    },
    {
      id: "IC-03", code: "INC-TRESP", name: "Trespassing / Unauthorised Access",
      description: "Entry to a restricted area by a person without authorisation.",
      severity: "High", region: "All", status: "active",
      form: { fields: [
        { id: "f1", type: "datetime", label: "Incident Date & Time", required: true },
        { id: "f2", type: "site", label: "Site", required: true },
        { id: "f3", type: "short", label: "Access point", required: true,
          helpText: "Door, gate or checkpoint where entry occurred." },
        { id: "f4", type: "number", label: "Number of individuals", required: false },
        { id: "f5", type: "long", label: "Description", required: true },
        { id: "f6", type: "single", label: "Outcome", required: true,
          options: ["Escorted off site", "Left voluntarily", "Police attended", "Still on site"] },
        { id: "f7", type: "photo", label: "Photos", required: false }
      ] }
    },
    {
      id: "IC-04", code: "INC-THEFT", name: "Theft or Property Loss",
      description: "Suspected or confirmed removal of property from the site.",
      severity: "High", region: "All", status: "active",
      form: { fields: [
        { id: "f1", type: "datetime", label: "Incident Date & Time", required: true },
        { id: "f2", type: "site", label: "Site", required: true },
        { id: "d1", type: "divider", label: "Property" },
        { id: "f3", type: "long", label: "Items involved", required: true },
        { id: "f4", type: "number", label: "Estimated value", required: false,
          helpText: "Local currency. Leave blank if unknown." },
        { id: "d2", type: "divider", label: "Circumstances" },
        { id: "f5", type: "long", label: "Description", required: true },
        { id: "f6", type: "checkbox", label: "CCTV footage available", required: false },
        { id: "f7", type: "photo", label: "Photos", required: false }
      ] }
    },
    {
      id: "IC-05", code: "INC-DAMAGE", name: "Property Damage",
      description: "Damage to building fabric, fittings, vehicles or equipment.",
      severity: "Medium", region: "All", status: "active",
      form: { fields: [
        { id: "f1", type: "datetime", label: "Incident Date & Time", required: true },
        { id: "f2", type: "site", label: "Site", required: true },
        { id: "f3", type: "single", label: "Damage type", required: true,
          options: ["Vandalism", "Accidental", "Weather", "Wear / failure", "Unknown"] },
        { id: "f4", type: "long", label: "Description", required: true },
        { id: "f5", type: "checkbox", label: "Area made safe", required: false },
        { id: "f6", type: "photo_gallery", label: "Photos", required: false,
          helpText: "Attach existing photos from your device." }
      ] }
    },
    {
      id: "IC-06", code: "INC-SUSP", name: "Suspicious Activity",
      description: "Behaviour warranting a log entry but no immediate response.",
      severity: "Low", region: "All", status: "active",
      form: { fields: [
        { id: "f1", type: "datetime", label: "Incident Date & Time", required: true },
        { id: "f2", type: "site", label: "Site", required: true },
        { id: "f3", type: "long", label: "Description", required: true,
          helpText: "Describe behaviour, not appearance." },
        { id: "f4", type: "time", label: "First observed", required: false },
        { id: "f5", type: "photo", label: "Photos", required: false }
      ] }
    }
  ];

  /* ── Seed reports (demo only) ────────────────────────────────
   * Sample submissions so MY REPORTS shows what filed reports look like rather
   * than an empty state. Written to the store once, on first run, and only
   * while the store is empty — a real report the officer files is never
   * touched. Clear them with AlexiosIncidents.clearDemoReports().
   * ---------------------------------------------------------------------- */

  var HOUR = 3600 * 1000;

  function agoIso(hours) {
    return new Date(Date.now() - hours * HOUR).toISOString();
  }

  function seedReports() {
    return [
      {
        id: "demo-1", reference: "IR-260908-0042", categoryId: "IC-06",
        createdAt: agoIso(2), status: "synced", demo: true,
        values: {
          f1: agoIso(2.4), f2: "Ritz-Carlton Tower B",
          f3: "Unfamiliar male in dark hooded jacket photographing the staff " +
              "entrance and camera positions from the far side of the street. " +
              "Left westbound when approached. No vehicle observed.",
          f4: "22:40", f5: []
        }
      },
      {
        id: "demo-2", reference: "IR-260907-0038", categoryId: "IC-03",
        createdAt: agoIso(27), status: "synced", demo: true,
        values: {
          f1: agoIso(27.5), f2: "Harbor Point Logistics",
          f3: "Loading Dock Door", f4: 2,
          f5: "Two individuals entered through a dock door propped open by a " +
              "delivery crew. Both stated they were looking for the courier " +
              "office. Escorted to the gate house and off site without incident.",
          f6: "Escorted off site", f7: []
        }
      },
      {
        id: "demo-3", reference: "IR-260905-0031", categoryId: "IC-04",
        createdAt: agoIso(74), status: "synced", demo: true,
        values: {
          f1: agoIso(74.5), f2: "Meridian Financial Plaza",
          f3: "Dell laptop and docking station from hot desk 14, floor 12",
          f4: 1250,
          f5: "Equipment reported missing at shift handover. Floor was accessed " +
              "twice overnight on cleaning credentials. Tenant IT notified and " +
              "the asset tag has been flagged.",
          f6: true, f7: []
        }
      },
      {
        id: "demo-4", reference: "IR-260908-0044", categoryId: "IC-05",
        createdAt: agoIso(0.5), status: "pending", demo: true,
        values: {
          f1: agoIso(0.7), f2: "North Perimeter Fence",
          f3: "Vandalism",
          f4: "Approximately four metres of mesh cut low to the ground behind " +
              "the generator compound. No entry beyond the fence line. Temporary " +
              "barrier in place pending a maintenance callout.",
          f5: true, f6: []
        }
      },
      {
        id: "demo-5", reference: "IR-260903-0022", categoryId: "IC-02",
        createdAt: agoIso(122), status: "synced", demo: true,
        values: {
          f1: agoIso(122.3), f2: "Ritz-Carlton Tower B",
          f3: "Member of public", 
          f4: "Visitor collapsed in the north lobby shortly after entering. " +
              "Conscious and breathing throughout. First aid administered until " +
              "paramedics arrived and took over care.",
          f5: true, f6: "AMB-4471", f7: []
        }
      }
    ];
  }

  /* ── Local store ───────────────────────────────────────────────────────── */

  var Store = (function () {
    var K_REPORTS = "alexios.incidents.reports.v1";
    var K_DRAFT = "alexios.incidents.draft.";
    var K_SEQ = "alexios.incidents.seq.v1";
    var memory = null; // fallback when localStorage is blocked or full

    function read() {
      if (memory) return memory;
      try {
        var raw = localStorage.getItem(K_REPORTS);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    }
    function write(list) {
      try { localStorage.setItem(K_REPORTS, JSON.stringify(list)); memory = null; }
      catch (e) { memory = list; }   // quota hit — hold in memory for this session
    }
    function nextRef() {
      var n = 1;
      try { n = parseInt(localStorage.getItem(K_SEQ) || "1", 10) || 1; } catch (e) {}
      try { localStorage.setItem(K_SEQ, String(n + 1)); } catch (e) {}
      var d = new Date();
      var stamp = String(d.getFullYear()).slice(2) +
        ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
      return "IR-" + stamp + "-" + ("000" + n).slice(-4);
    }
    /* Demo rows, written once. An officer's own reports are never overwritten:
       we only seed when the store is empty and has not been seeded before. */
    function seedOnce() {
      var K_SEEDED = "alexios.incidents.seeded.v1";
      try {
        if (localStorage.getItem(K_SEEDED)) return;
        if (read().length) { localStorage.setItem(K_SEEDED, "1"); return; }
        write(seedReports());
        localStorage.setItem(K_SEEDED, "1");
      } catch (e) { if (!read().length) write(seedReports()); }
    }

    return {
      all: read,
      seedOnce: seedOnce,
      clearDemo: function () {
        write(read().filter(function (r) { return !r.demo; }));
      },
      byCategory: function (id) {
        return read().filter(function (r) { return r.categoryId === id; });
      },
      add: function (report) { var l = read(); l.unshift(report); write(l); return report; },
      update: function (id, patch) {
        var l = read();
        for (var i = 0; i < l.length; i++) {
          if (l[i].id === id) { Object.assign(l[i], patch); break; }
        }
        write(l);
      },
      nextRef: nextRef,
      saveDraft: function (catId, values) {
        try { localStorage.setItem(K_DRAFT + catId, JSON.stringify(values)); } catch (e) {}
      },
      loadDraft: function (catId) {
        try {
          var raw = localStorage.getItem(K_DRAFT + catId);
          return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
      },
      clearDraft: function (catId) {
        try { localStorage.removeItem(K_DRAFT + catId); } catch (e) {}
      }
    };
  })();

  /* ── API ───────────────────────────────────────────────────────────────── */

  function req(method, path, body) {
    var headers = { "Content-Type": "application/json" };
    if (CONFIG.authToken) headers.Authorization = "Bearer " + CONFIG.authToken;
    return fetch(CONFIG.apiBase + path, {
      method: method, headers: headers, body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error("Request failed (" + res.status + ")");
      return res.status === 204 ? null : res.json();
    });
  }

  var Api = {
    categories: function () {
      if (!CONFIG.useMock) return req("GET", "/incident-categories?status=active");
      return new Promise(function (r) {
        setTimeout(function () { r(JSON.parse(JSON.stringify(MOCK_CATEGORIES))); }, 200);
      });
    },
    submit: function (report) {
      if (!CONFIG.useMock) return req("POST", "/incident-reports", report);
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (!navigator.onLine) reject(new Error("offline"));
          else resolve({ id: report.id, reference: report.reference });
        }, 500);
      });
    }
  };

  /* Sites come from the Site Configuration store when it is present, so the
     two features stay consistent instead of keeping rival site lists. */
  function siteOptions() {
    try {
      var raw = localStorage.getItem("alexios.siteConfig.v1");
      if (raw) {
        var db = JSON.parse(raw);
        if (db && db.sites && db.sites.length) {
          return db.sites.map(function (s) { return { value: s.name, sub: s.address }; });
        }
      }
    } catch (e) {}
    return [
      { value: "Ritz-Carlton Tower B", sub: "Floors 4–22, Downtown Core" },
      { value: "Meridian Financial Plaza", sub: "1400 Harbour Street" },
      { value: "Harbor Point Logistics", sub: "Pier 9, East Terminal" }
    ];
  }

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

  function localDateTimeValue() {
    var d = new Date();
    var pad = function (v) { return ("0" + v).slice(-2); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function isBlank(v) {
    if (v == null) return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "boolean") return v === false;
    return String(v).trim() === "";
  }

  /* Photos are downscaled before they are held locally — full-resolution
     evidence goes to the backend on sync, not into localStorage. */
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

  /* ── Screen 1: incident types + my reports ─────────────────────────────── */

  /* Which zone the list screen is showing. Module-level so the choice
     survives opening a report and coming back. */
  var listTab = "report";

  function screenList() {
    setHeader("Incidents", "Report and review");
    setFooter(null);
    UI.body.textContent = "";
    UI.body.appendChild(el("div", { class: "asc-empty", html: ICON.spin + "<div>Loading incident types…</div>" }));

    Api.categories().then(function (cats) {
      renderList(cats.filter(function (c) { return c.status !== "archived"; }));
    }).catch(function (e) {
      UI.body.textContent = "";
      UI.body.appendChild(el("div", { class: "asc-empty", text: e.message || "Could not load incident types." }));
      UI.body.appendChild(el("button", { class: "asc-btn", "data-kind": "ghost", text: "RETRY", onclick: screenList }));
    });
  }

  /* Tab strip plus whichever zone is selected. Re-rendered in place on a tab
     change, so switching tabs never pushes a screen onto the stack. */
  function renderList(active) {
    UI.body.textContent = "";

    if (!navigator.onLine) {
      UI.body.appendChild(el("div", { class: "ain-offline" }, [
        el("span", { html: ICON.off }),
        el("span", { text: "You're offline. You can still file reports — they'll send when you reconnect." })
      ]));
    }

    var mine = Store.all();
    var tabs = el("div", { class: "ain-tabs" });
    [
      { key: "report", label: "Report an Incident" },
      { key: "mine", label: "My Reports" + (mine.length ? " · " + mine.length : "") }
    ].forEach(function (t) {
      tabs.appendChild(el("button", {
        class: "ain-tab", "data-on": String(listTab === t.key), text: t.label,
        onclick: function () {
          if (listTab === t.key) return;
          listTab = t.key;
          renderList(active);
        }
      }));
    });
    UI.body.appendChild(tabs);

    if (listTab === "report") zoneTypes(active);
    else zoneReports(active, mine);
  }

  function zoneTypes(active) {
    if (!active.length) {
      UI.body.appendChild(el("div", {
        class: "asc-empty",
        text: "No incident types have been published for your region yet."
      }));
      return;
    }
    active.forEach(function (cat) {
      UI.body.appendChild(el("button", {
        class: "ain-type", "data-sev": cat.severity,
        onclick: function () { push(function () { screenForm(cat); }); }
      }, [
        el("div", { class: "ain-type-body" }, [
          el("div", { class: "ain-type-top" }, [
            el("div", { class: "ain-type-name", text: cat.name }),
            el("span", { class: "ain-sev", "data-sev": cat.severity, text: cat.severity.toUpperCase() })
          ]),
          el("div", { class: "ain-type-code", text: cat.code }),
          cat.description ? el("div", { class: "ain-type-desc", text: cat.description }) : null
        ]),
        el("div", { class: "asc-chev", html: ICON.chev })
      ]));
    });
  }

  /* ── Date filter ───────────────────────────────────────────────────────
   * Narrows MY REPORTS to a filed-date range. "all" is the resting state, so
   * the list looks untouched until the officer asks for a range.
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

  /* Resolves the filter to [from, to] timestamps, or null for no bound. */
  function filterRange(f) {
    var now = new Date();
    if (f.preset === "today") return [startOfDay(now), endOfDay(now)];
    if (f.preset === "7" || f.preset === "30") {
      var days = parseInt(f.preset, 10);
      var from = startOfDay(new Date(now.getTime() - (days - 1) * 24 * HOUR));
      return [from, endOfDay(now)];
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

  function applyFilter(list, f) {
    if (!filterActive(f)) return list;
    var r = filterRange(f), from = r[0], to = r[1];
    return list.filter(function (rep) {
      var t = new Date(rep.createdAt);
      if (isNaN(t)) return false;
      if (from && t < from) return false;
      if (to && t > to) return false;
      return true;
    });
  }

  function filterLabel(f) {
    if (!filterActive(f)) return "All dates";
    if (f.preset === "custom") {
      /* yyyy-mm-dd (input value) -> mm/dd/yyyy */
      var d = function (v) {
        if (!v) return "";
        var p = v.split("-");
        return p[1] + "/" + p[2] + "/" + p[0];
      };
      if (f.from && f.to) return d(f.from) + " – " + d(f.to);
      return f.from ? "From " + d(f.from) : "Until " + d(f.to);
    }
    for (var i = 0; i < PRESETS.length; i++) {
      if (PRESETS[i].value === f.preset) return PRESETS[i].label;
    }
    return "All dates";
  }

  function zoneReports(active, mine) {
    if (!mine.length) {
      UI.body.appendChild(el("div", {
        class: "asc-empty",
        text: "You haven't filed any incident reports. Pick a type on the Report an Incident tab to start one."
      }));
      return;
    }

    var shown = applyFilter(mine, reportFilter);
    var on = filterActive(reportFilter);

    UI.body.appendChild(el("div", { class: "ain-toolbar" }, [
      el("div", { class: "ain-toolbar-sum" }, [
        el("span", {
          text: on ? shown.length + " of " + mine.length + " reports"
                   : mine.length + " reports"
        }),
        el("span", { class: "ain-toolbar-range", text: filterLabel(reportFilter) })
      ]),
      el("button", {
        class: "ain-filter", "data-on": String(on), type: "button",
        "aria-label": "Filter reports by date",
        html: ICON.filter + "<span>Filter</span>",
        onclick: function () { openDateFilter(active); }
      })
    ]));

    if (!shown.length) {
      UI.body.appendChild(el("div", {
        class: "asc-empty",
        text: "No reports filed in this date range."
      }));
      UI.body.appendChild(el("button", {
        class: "asc-btn", "data-kind": "ghost", text: "CLEAR FILTER",
        onclick: function () {
          reportFilter = { preset: "all", from: "", to: "" };
          renderList(active);
        }
      }));
      return;
    }

    active.forEach(function (cat) {
      var rows = shown.filter(function (r) { return r.categoryId === cat.id; });
      if (!rows.length) return;
      UI.body.appendChild(el("div", { class: "ain-divider" }, [
        el("span", { text: cat.name + " · " + rows.length })
      ]));
      rows.forEach(function (rep) {
        UI.body.appendChild(reportRow(rep, cat));
      });
    });
  }

  function openDateFilter(active) {
    var draft = {
      preset: reportFilter.preset,
      from: reportFilter.from,
      to: reportFilter.to
    };

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
        custom.appendChild(el("label", { class: "ain-datefield" }, [
          el("span", { class: "ain-label", text: pair[1] }),
          input
        ]));
      });
    }

    function paint() {
      list.textContent = "";
      PRESETS.forEach(function (p) {
        var sel = draft.preset === p.value;
        list.appendChild(el("button", {
          class: "ain-opt", "data-on": String(sel), type: "button",
          onclick: function () { draft.preset = p.value; paint(); paintCustom(); }
        }, [
          el("span", {}, [el("div", { text: p.label })]),
          sel ? el("span", { html: ICON.check }) : null
        ]));
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
          onclick: function () {
            reportFilter = { preset: "all", from: "", to: "" };
            close();
            renderList(active);
          }
        }),
        el("button", {
          class: "asc-btn", "data-kind": "primary", text: "APPLY",
          onclick: function () {
            reportFilter = draft;
            close();
            renderList(active);
          }
        })
      ])
    ]));

    UI.overlay.appendChild(scrim);
    setTimeout(function () { scrim.dataset.open = "true"; }, 16);
  }

  function summaryOf(rep, cat) {
    var fields = (cat && cat.form && cat.form.fields) || [];
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].type === "long" && !isBlank(rep.values[fields[i].id])) {
        return String(rep.values[fields[i].id]);
      }
    }
    return cat ? cat.name : "Incident report";
  }

  function reportRow(rep, cat) {
    return el("button", {
      class: "ain-rep",
      onclick: function () { push(function () { screenReport(rep, cat); }); }
    }, [
      el("div", { class: "ain-rep-body" }, [
        el("div", { class: "ain-rep-ref", text: rep.reference }),
        el("div", { class: "ain-rep-sum", text: summaryOf(rep, cat) }),
        el("div", { class: "ain-rep-when", text: when(rep.createdAt) })
      ]),
      el("span", {
        class: "ain-sync", "data-state": rep.status,
        text: rep.status === "pending" ? "PENDING" : "SYNCED"
      })
    ]);
  }

  /* ── Screen 2: the admin-authored form ─────────────────────────────────── */

  function screenForm(cat) {
    setHeader(cat.name, cat.code + " · " + cat.severity);

    var values = Store.loadDraft(cat.id) || {};
    var errors = {};
    var restored = Object.keys(values).length > 0;

    // Pre-fill the moment of the incident with now, which is right far more
    // often than an empty field the officer has to fill by hand.
    (cat.form.fields || []).forEach(function (f) {
      if (f.type === "datetime" && isBlank(values[f.id])) values[f.id] = localDateTimeValue();
    });

    function persist() { Store.saveDraft(cat.id, values); }

    /* Values change WITHOUT a repaint: each control updates itself in place.
       A full repaint here would steal focus mid-keystroke in text fields. */
    function set(id, v) {
      values[id] = v;
      persist();
      if (!errors[id]) return;
      delete errors[id];
      var wrap = form.querySelector('[data-field="' + id + '"]');
      if (!wrap) return;
      wrap.dataset.error = "false";
      var msg = wrap.querySelector(".ain-err");
      if (msg) msg.remove();
    }

    var form = el("div", { class: "ain-form" });

    function paint() {
      form.textContent = "";
      (cat.form.fields || []).forEach(function (f) {
        form.appendChild(renderField(f, values, errors, set));
      });
      UI.body.textContent = "";
      if (!navigator.onLine) {
        UI.body.appendChild(el("div", { class: "ain-offline" }, [
          el("span", { html: ICON.off }),
          el("span", { text: "Offline — this report will be held on your device and sent automatically." })
        ]));
      }
      UI.body.appendChild(form);
    }

    var submitBtn = el("button", {
      class: "ain-submit", html: "SUBMIT INCIDENT", onclick: doSubmit
    });
    setFooter(el("div", {}, [
      submitBtn,
      el("div", {
        class: "ain-draft",
        text: restored ? "Draft restored — saved as you type" : "Saved as you type"
      })
    ]));

    function doSubmit() {
      errors = {};
      var firstBad = null;
      (cat.form.fields || []).forEach(function (f) {
        if (f.type === "divider") return;
        if (f.required && isBlank(values[f.id])) {
          errors[f.id] = f.type === "checkbox" ? "This must be confirmed." : "This field is required.";
          if (!firstBad) firstBad = f.id;
        }
      });
      if (firstBad) {
        paint();
        var node = form.querySelector('[data-field="' + firstBad + '"]');
        if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
        toast("Check the highlighted fields.", "err");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = ICON.spin + " SUBMITTING";

      var report = {
        id: "R" + Date.now(),
        reference: Store.nextRef(),
        categoryId: cat.id,
        categoryName: cat.name,
        severity: cat.severity,
        values: JSON.parse(JSON.stringify(values)),
        createdAt: new Date().toISOString(),
        status: "pending"
      };
      Store.add(report);
      Store.clearDraft(cat.id);

      Api.submit(report).then(function () {
        Store.update(report.id, { status: "synced" });
        report.status = "synced";
      }).catch(function () {
        // Offline or server unreachable — it stays queued, which is the point.
      }).then(function () {
        replaceTop(function () { screenDone(report, cat); });
      });
    }

    paint();
  }

  /* ── Field renderers ───────────────────────────────────────────────────── */

  function renderField(f, values, errors, set) {
    if (f.type === "divider") {
      return el("div", { class: "ain-divider", "data-field": f.id }, [
        el("span", { text: f.label || "" })
      ]);
    }

    var control = buildControl(f, values, set);
    var wrap = el("div", {
      class: "ain-field", "data-field": f.id, "data-error": String(!!errors[f.id])
    }, [
      el("div", { class: "ain-label" }, [
        el("span", { text: f.label }),
        f.required ? el("span", { class: "ain-req", text: "*" }) : null
      ]),
      f.helpText ? el("div", { class: "ain-help", text: f.helpText }) : null,
      control,
      errors[f.id] ? el("div", { class: "ain-err" }, [
        el("span", { html: ICON.alert }), el("span", { text: errors[f.id] })
      ]) : null
    ]);
    return wrap;
  }

  function buildControl(f, values, set) {
    var v = values[f.id];

    switch (f.type) {
      case "short":
        return el("input", {
          class: "ain-input", type: "text", value: v || "",
          placeholder: f.placeholder || "",
          oninput: function (e) { set(f.id, e.target.value); }
        });

      case "number":
        return el("input", {
          class: "ain-input", type: "number", inputmode: "decimal", value: v || "",
          oninput: function (e) { set(f.id, e.target.value); }
        });

      case "long":
        var ta = el("textarea", {
          class: "ain-textarea", placeholder: f.placeholder || "",
          oninput: function (e) { set(f.id, e.target.value); }
        });
        ta.value = v || "";   // textarea takes its value as content, not an attribute
        return ta;

      case "date":
      case "time":
      case "datetime":
        return el("input", {
          class: "ain-input",
          type: f.type === "datetime" ? "datetime-local" : f.type,
          value: v || "",
          oninput: function (e) { set(f.id, e.target.value); }
        });

      case "checkbox": {
        var cb = el("div", {
          class: "ain-check", "data-on": String(!!v), role: "checkbox",
          tabindex: "0", "aria-checked": String(!!v)
        }, [
          el("span", { class: "ain-box", html: ICON.check }),
          el("span", { text: f.label })
        ]);
        var toggle = function () {
          var nv = !values[f.id];
          set(f.id, nv);
          cb.dataset.on = String(nv);
          cb.setAttribute("aria-checked", String(nv));
        };
        cb.addEventListener("click", toggle);
        cb.addEventListener("keydown", function (e) {
          if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); }
        });
        return cb;
      }

      case "single": {
        var bSingle = pickerButton(f, v || "", function () {
          openPicker(f.label, (f.options || []).map(function (o) { return { value: o }; }),
            values[f.id], false, function (picked) {
              set(f.id, picked); bSingle.setLabel(picked);
            });
        });
        return bSingle;
      }

      case "multi": {
        var cur = v || [];
        var bMulti = pickerButton(f, cur.length ? cur.join(", ") : "", function () {
          openPicker(f.label, (f.options || []).map(function (o) { return { value: o }; }),
            values[f.id] || [], true, function (picked) {
              set(f.id, picked); bMulti.setLabel(picked.length ? picked.join(", ") : "");
            });
        });
        return bMulti;
      }

      case "site": {
        var bSite = pickerButton(f, v || "", function () {
          openPicker(f.label, siteOptions(), values[f.id], false, function (picked) {
            set(f.id, picked); bSite.setLabel(picked);
          });
        });
        return bSite;
      }

      case "photo":
      case "photo_gallery":
        return photoField(f, values, set);

      default:
        // An admin published a field type this build does not render yet.
        // Say so plainly rather than dropping it from the form silently.
        return el("div", {
          class: "ain-offline",
          text: '"' + f.label + '" uses the ' + f.type +
                " field type, which this app version cannot capture yet. " +
                "Record it in a description field for now."
        });
    }
  }

  function pickerButton(f, label, onOpen) {
    var text = el("span", { text: label || "Select…" });
    var btn = el("button", {
      class: "ain-picker", "data-empty": String(!label), type: "button", onclick: onOpen
    }, [text, el("span", { html: ICON.down })]);
    btn.setLabel = function (v) {
      text.textContent = v || "Select…";
      btn.dataset.empty = String(!v);
    };
    return btn;
  }

  function photoField(f, values, set) {
    var fromGallery = f.type === "photo_gallery";
    var host = el("div", { class: "ain-photos" });

    var input = el("input", {
      type: "file", accept: "image/*", multiple: "", hidden: "",
      onchange: function (e) {
        var files = [].slice.call(e.target.files || []);
        var list = values[f.id] || [];
        var room = CONFIG.maxPhotos - list.length;
        if (files.length > room) {
          toast("You can attach up to " + CONFIG.maxPhotos + " photos.", "err");
          files = files.slice(0, Math.max(0, room));
        }
        Promise.all(files.map(function (file) { return shrink(file, 900, 0.7); }))
          .then(function (urls) { set(f.id, list.concat(urls)); paintPhotos(); })
          .catch(function (err) { toast(err.message, "err"); });
        e.target.value = "";
      }
    });
    // Camera capture for "photo"; the gallery variant opens the picker instead.
    if (!fromGallery) input.setAttribute("capture", "environment");

    function paintPhotos() {
      var list = values[f.id] || [];
      host.textContent = "";
      if (list.length) {
        host.appendChild(el("div", { class: "ain-thumbs" }, list.map(function (src, i) {
          return el("div", { class: "ain-thumb" }, [
            el("img", { src: src, alt: f.label + " " + (i + 1) }),
            el("button", {
              class: "ain-thumb-x", type: "button",
              "aria-label": "Remove photo " + (i + 1), html: ICON.x,
              onclick: function (e) {
                e.stopPropagation();
                set(f.id, (values[f.id] || []).filter(function (_, j) { return j !== i; }));
                paintPhotos();
              }
            })
          ]);
        })));
      }
      host.appendChild(el("button", {
        class: "ain-addphoto", type: "button",
        html: (fromGallery ? ICON.img : ICON.cam) +
              "<span>" + (fromGallery ? "CHOOSE PHOTOS" : "TAKE PHOTO") + "</span>",
        onclick: function () { input.click(); }
      }));
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
            el("div", { text: opt.value }),
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
        multi ? el("button", {
          class: "asc-btn", "data-kind": "primary", text: "DONE",
          onclick: function () { done(chosen); close(); }
        }) : null
      ])
    ]));

    UI.overlay.appendChild(scrim);
    setTimeout(function () { scrim.dataset.open = "true"; }, 16);
  }

  /* ── Screen 3: confirmation / read-only report ─────────────────────────── */

  function screenDone(rep, cat) {
    setHeader(cat.name, rep.reference);
    setFooter(el("button", {
      class: "ain-submit", text: "DONE",
      onclick: function () { UI.stack = []; push(screenList); }
    }));

    UI.body.textContent = "";
    var pending = rep.status === "pending";
    UI.body.appendChild(el("div", { class: "ain-done" }, [
      el("div", { class: "ain-done-ico", "data-state": rep.status, html: pending ? ICON.cloud : ICON.done }),
      el("div", { class: "ain-done-title", text: pending ? "Report saved" : "Report submitted" }),
      el("div", {
        class: "ain-done-sub",
        text: pending
          ? "You're offline. This report is stored on your device and will send by itself once you reconnect."
          : "Your report has been sent to the operations team."
      }),
      el("div", { class: "ain-done-ref", text: rep.reference })
    ]));

    UI.body.appendChild(el("div", { class: "asc-section", text: "WHAT YOU SUBMITTED" }));
    UI.body.appendChild(answers(rep, cat));
  }

  function screenReport(rep, cat) {
    setHeader(rep.reference, cat ? cat.name : "Incident report");
    setFooter(null);
    UI.body.textContent = "";

    UI.body.appendChild(el("div", { class: "aop-group" }, [
      el("div", { class: "ain-ans" }, [
        el("div", { class: "ain-ans-l", text: "Status" }),
        el("div", {}, [
          el("span", {
            class: "ain-sync", "data-state": rep.status,
            text: rep.status === "pending" ? "PENDING SYNC" : "SYNCED"
          })
        ])
      ]),
      el("div", { class: "ain-ans" }, [
        el("div", { class: "ain-ans-l", text: "Filed" }),
        el("div", { class: "ain-ans-v", text: when(rep.createdAt) })
      ])
    ]));

    UI.body.appendChild(el("div", { class: "asc-section", text: "REPORT" }));
    UI.body.appendChild(answers(rep, cat));
  }

  function answers(rep, cat) {
    var fields = (cat && cat.form && cat.form.fields) || [];
    var group = el("div", { class: "aop-group" });

    fields.forEach(function (f) {
      if (f.type === "divider") return;
      var v = rep.values[f.id];

      if (f.type === "photo" || f.type === "photo_gallery") {
        group.appendChild(el("div", { class: "ain-ans" }, [
          el("div", { class: "ain-ans-l", text: f.label }),
          (v && v.length)
            ? el("div", { class: "ain-thumbs" }, v.map(function (src, i) {
                return el("div", { class: "ain-thumb" }, [
                  el("img", { src: src, alt: f.label + " " + (i + 1) })
                ]);
              }))
            : el("div", { class: "ain-ans-v", "data-empty": "true", text: "None attached" })
        ]));
        return;
      }

      var text;
      if (f.type === "checkbox") text = v ? "Yes" : "No";
      else if (Array.isArray(v)) text = v.join(", ");
      else if (f.type === "datetime" && v) text = when(v);
      else text = v == null ? "" : String(v);

      group.appendChild(el("div", { class: "ain-ans" }, [
        el("div", { class: "ain-ans-l", text: f.label }),
        el("div", {
          class: "ain-ans-v", "data-empty": String(isBlank(text)),
          text: isBlank(text) ? "Not answered" : text
        })
      ]));
    });

    return group;
  }

  /* ── Offline queue ─────────────────────────────────────────────────────── */

  function flushQueue() {
    var pending = Store.all().filter(function (r) {
      return r.status === "pending" && !r.demo;   // demo rows keep their state
    });
    if (!pending.length || !navigator.onLine) return;

    var sent = 0;
    Promise.all(pending.map(function (rep) {
      return Api.submit(rep).then(function () {
        Store.update(rep.id, { status: "synced" });
        sent++;
      }).catch(function () { /* still unreachable — leave queued */ });
    })).then(function () {
      if (!sent) return;
      if (UI.overlay && UI.overlay.dataset.open === "true") {
        toast(sent + (sent === 1 ? " report" : " reports") + " sent.", "ok");
        if (UI.stack.length === 1) UI.stack[0]();
      }
    });
  }

  window.addEventListener("online", flushQueue);

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
    Store.seedOnce();
    build();
    syncRect();
    UI.stack = [];
    push(screenList);
    setTimeout(function () { UI.overlay.dataset.open = "true"; }, 16);
    flushQueue();
  }

  /* ── Home tile intercept ───────────────────────────────────────────────────
   * In the shipped bundle this tile navigates to the Chat screen. Catch the
   * click during the capture phase, before React's handler runs, and open the
   * incidents module instead.
   * ------------------------------------------------------------------------ */

  function isIncidentTile(node) {
    while (node && node !== document.body) {
      if (node.nodeType === 1 && node.textContent.replace(/\s+/g, "") === "IncidentsActiveLogs") return true;
      node = node.parentElement;
    }
    return false;
  }

  document.addEventListener("click", function (e) {
    if (!isIncidentTile(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    open();
  }, true);

  window.AlexiosIncidents = {
    configure: function (o) { Object.assign(CONFIG, o || {}); return CONFIG; },
    open: open,
    flush: flushQueue,
    clearDemoReports: function () { Store.clearDemo(); },
    reset: function () {
      try {
        Object.keys(localStorage)
          .filter(function (k) { return k.indexOf("alexios.incidents.") === 0; })
          .forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
    },
    config: CONFIG
  };
})();
