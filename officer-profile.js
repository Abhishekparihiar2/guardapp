/* ============================================================================
 * ALEXIOS Mobile — Officer Profile → Personal Information
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 * Requires alexios-ui.css (glass primitives) + officer-profile.css.
 *
 * Replaces the bundle's "Officer Profile" hub screen. Settings → OFFICER
 * PROFILE now opens Personal Information directly. The hub's four stat grids
 * (Compliance Docs / Activity Sessions / Disciplinary Status / Incident
 * Write-Ups) and the Application Settings row are gone by design; the bundle's
 * own screen stays in place but is no longer reachable.
 *
 * The record is read-only — officers view, supervisors maintain.
 *
 * Backend: window.AlexiosOfficerProfile.configure({ useMock:false, apiBase:'…' })
 *          expects GET /api/me/profile -> the shape of MOCK_PROFILE below.
 * ========================================================================== */
(function () {
  "use strict";

  var CONFIG = {
    useMock: true,
    apiBase: "/api",
    authToken: null
  };

  /* ── Record ────────────────────────────────────────────────────────────── */

  var MOCK_PROFILE = {
    name: "Michael Lambros",
    initials: "ML",
    officerId: "OFF-1024",
    title: "Security Officer",
    dutyStatus: "ACTIVE DUTY",
    joined: "2026-02-15",
    contact: {
      workEmail: "m.lambros@alexios-security.com",
      mobile: "+1 (555) 202-0002",
      personalEmail: "mlambros@fastmail.com"
    },
    personal: {
      dateOfBirth: "1994-07-09",
      address: "418 Kestrel Lane, Apt 6B\nDowntown Core, 90014"
    },
    emergency: {
      name: "Elena Lambros",
      relationship: "Spouse",
      phone: "+1 (555) 202-0044"
    },
    record: {
      primarySite: "Ritz-Carlton Tower B",
      employmentType: "Full-time",
      supervisor: "D. Okafor"
    }
  };

  function fetchProfile() {
    if (CONFIG.useMock) {
      return new Promise(function (r) {
        setTimeout(function () { r(JSON.parse(JSON.stringify(MOCK_PROFILE))); }, 220);
      });
    }
    var headers = {};
    if (CONFIG.authToken) headers.Authorization = "Bearer " + CONFIG.authToken;
    return fetch(CONFIG.apiBase + "/me/profile", { headers: headers }).then(function (res) {
      if (!res.ok) throw new Error("Could not load your record (" + res.status + ")");
      return res.json();
    });
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

  function longDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  }

  var ICON = {
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    lock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    spin: '<svg class="asc-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.6"/></svg>'
  };

  /* ── Overlay shell ─────────────────────────────────────────────────────── */

  var UI = { overlay: null, header: null, body: null };

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
    UI.header = el("div", { class: "asc-hd" }, [
      el("button", { class: "asc-back", "aria-label": "Back to settings", html: ICON.back, onclick: close }),
      el("div", {}, [
        el("div", { class: "asc-hd-title", text: "Personal Information" }),
        el("div", { class: "asc-hd-sub", text: "Officer record" })
      ])
    ]);
    UI.body = el("div", { class: "asc-body" });
    UI.overlay = el("div", {
      class: "asc-overlay", id: "aop-overlay",
      role: "dialog", "aria-modal": "true", "aria-label": "Personal Information"
    }, [UI.header, UI.body]);
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
      if (e.key === "Escape" && UI.overlay.dataset.open === "true") close();
    });
  }

  /* ── Page content ──────────────────────────────────────────────────────── */

  function field(label, value, href) {
    var val;
    if (href && value) {
      val = el("a", { class: "aop-value", href: href, text: value });
    } else {
      val = el("div", {
        class: "aop-value",
        "data-empty": String(!value),
        text: value || "Not on record"
      });
    }
    return el("div", { class: "aop-field" }, [
      el("div", { class: "aop-label", text: label }),
      val
    ]);
  }

  function group(fields) {
    return el("div", { class: "aop-group" }, fields);
  }

  function telHref(n) { return n ? "tel:" + n.replace(/[^\d+]/g, "") : null; }

  function render(p) {
    UI.body.textContent = "";

    // Identity
    UI.body.appendChild(el("div", { class: "aop-id" }, [
      el("div", { class: "aop-avatar", text: p.initials || (p.name || "?").slice(0, 1) }),
      el("div", { class: "aop-name", text: p.name }),
      el("div", { class: "aop-role", text: p.officerId + " · " + p.title }),
      el("div", { class: "aop-duty" }, [
        el("span", { class: "aop-dot" }),
        el("span", { text: p.dutyStatus || "" })
      ]),
      el("div", { class: "aop-joined", text: "Joined " + longDate(p.joined) })
    ]));

    var c = p.contact || {}, pr = p.personal || {}, em = p.emergency || {}, rec = p.record || {};

    UI.body.appendChild(el("div", { class: "asc-section", text: "CONTACT" }));
    UI.body.appendChild(group([
      field("Work email", c.workEmail, c.workEmail ? "mailto:" + c.workEmail : null),
      field("Mobile", c.mobile, telHref(c.mobile)),
      field("Personal email", c.personalEmail, c.personalEmail ? "mailto:" + c.personalEmail : null)
    ]));

    UI.body.appendChild(el("div", { class: "asc-section", text: "PERSONAL" }));
    UI.body.appendChild(group([
      field("Date of birth", longDate(pr.dateOfBirth)),
      field("Home address", pr.address)
    ]));

    UI.body.appendChild(el("div", { class: "asc-section", text: "EMERGENCY CONTACT" }));
    UI.body.appendChild(group([
      field("Name", em.name),
      field("Relationship", em.relationship),
      field("Phone", em.phone, telHref(em.phone))
    ]));

    UI.body.appendChild(el("div", { class: "asc-section", text: "EMPLOYMENT RECORD" }));
    UI.body.appendChild(group([
      field("Officer ID", p.officerId),
      field("Job title", p.title),
      field("Primary site", rec.primarySite),
      field("Employment type", rec.employmentType),
      field("Reports to", rec.supervisor),
      field("Start date", longDate(p.joined))
    ]));

    UI.body.appendChild(el("div", { class: "aop-note" }, [
      el("span", { html: ICON.lock }),
      el("span", {
        text: "This record is maintained by your supervisor. To correct anything here, " +
              "contact your site manager or raise a ticket from the Help Desk."
      })
    ]));
  }

  function load() {
    UI.body.textContent = "";
    UI.body.appendChild(el("div", {
      class: "asc-empty", html: ICON.spin + "<div>Loading your record…</div>"
    }));
    fetchProfile().then(render).catch(function (e) {
      UI.body.textContent = "";
      UI.body.appendChild(el("div", { class: "asc-empty", text: e.message || "Could not load your record." }));
      UI.body.appendChild(el("button", {
        class: "asc-btn", "data-kind": "ghost", text: "RETRY", onclick: load
      }));
    });
  }

  function open() {
    build();
    syncRect();
    load();
    setTimeout(function () { UI.overlay.dataset.open = "true"; }, 16);
  }

  function close() {
    if (!UI.overlay) return;
    UI.overlay.dataset.open = "false";
  }

  /* ── Intercept the Settings entry ──────────────────────────────────────────
   * The bundle's OFFICER PROFILE button is React-owned, so instead of patching
   * it we catch the click during the capture phase — before React's delegated
   * handler runs — and open this page instead. One document-level listener,
   * so it survives every re-render without needing re-attachment.
   * ------------------------------------------------------------------------ */

  function isProfileEntry(node) {
    while (node && node !== document.body) {
      if (node.tagName === "BUTTON" && node.textContent.trim() === "OFFICER PROFILE") return true;
      node = node.parentElement;
    }
    return false;
  }

  document.addEventListener("click", function (e) {
    if (!isProfileEntry(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    open();
  }, true);

  window.AlexiosOfficerProfile = {
    configure: function (opts) { Object.assign(CONFIG, opts || {}); return CONFIG; },
    open: open,
    config: CONFIG
  };
})();
