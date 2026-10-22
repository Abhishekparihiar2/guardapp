/* ============================================================================
 * ALEXIOS Mobile — Certifications (real data)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * The bundle's Certifications screen is a mock-up (fixed counts, three sample
 * certificates). This keeps its header and back button and replaces the rest
 * with the guard's own certificates and licences — the same statuses the admin
 * Skills screen shows — plus anything their posts require that they don't hold:
 *
 *   GET  /mobile/certifications?status=&search=   counts, my certs, missing required
 *   POST /mobile/certifications/:id/document      upload proof (photo or PDF)
 *   GET  /mobile/certifications/:id/document      view what I uploaded
 *
 * The Home "Certifications" tile shows the count and anything needing action.
 * ========================================================================== */
(function () {
  "use strict";

  var FILTERS = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "expiring", label: "Expiring soon" },
    { key: "expired", label: "Expired" },
    { key: "action", label: "Needs action" }
  ];

  var state = { filter: "all", search: "", loading: false, data: null, error: null, loadedAt: 0 };
  var panel = null;
  var requestSeq = 0;
  var searchTimer = null;

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
  function fmtDate(ymd) {
    if (!ymd) return "—";
    var p = String(ymd).split("-");
    return MONTHS[Number(p[1]) - 1] + " " + Number(p[2]) + ", " + p[0];
  }

  function badgeText(c) {
    if (c.status === "expiring_soon") return c.daysLeft === 0 ? "Expires today" : "Expires in " + c.daysLeft + (c.daysLeft === 1 ? " day" : " days");
    return c.statusLabel;
  }

  var ICON = {
    ok: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
    warn: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    filter: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>',
    small: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>'
  };

  /* ── Rendering ─────────────────────────────────────────────────────────── */

  function buildPanel() {
    var wrap = document.createElement("div");
    wrap.className = "acert-panel";
    wrap.dataset.acertPanel = "true";
    wrap.addEventListener("click", onClick);
    wrap.addEventListener("input", function (e) {
      if (!e.target.matches("[data-search]")) return;
      state.search = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { load(); }, 300);
    });
    return wrap;
  }

  function card(c) {
    var warn = c.status === "expiring_soon" || c.status === "expired" || c.status === "missing_document";
    return '<button type="button" class="acert-card" data-cert="' + esc(c.id) + '" data-status="' + c.status + '">' +
      '<div class="acert-card-main">' +
        "<b>" + esc(c.name) + "</b>" +
        "<span>" + esc(c.category + " • " + c.scope) + "</span>" +
        (c.expiresAt && c.status !== "missing_document" ? '<span class="acert-exp">' + (c.status === "expired" ? "Expired " : "Expires ") + esc(fmtDate(c.expiresAt)) + "</span>" : "") +
      "</div>" +
      '<span class="acert-badge">' + (warn ? ICON.small : "") + "<span>" + esc(badgeText(c)) + "</span></span>" +
    "</button>";
  }

  function missingCard(m) {
    return '<button type="button" class="acert-card acert-missing" data-missing="' + esc(m.skillId) + '" data-level="' + m.level + '">' +
      '<div class="acert-card-main"><b>' + esc(m.name) + "</b><span>" + esc(m.category + " • " + m.scope) + "</span>" +
        '<span class="acert-exp">' + (m.level === "required" ? "Required" : "Recommended") + " for " + esc(m.requiredFor.join(", ")) + "</span></div>" +
      '<span class="acert-badge">' + (m.level === "required" ? ICON.small : "") + "<span>" + (m.level === "required" ? "Not on file" : "Recommended") + "</span></span>" +
    "</button>";
  }

  function render() {
    if (!panel) return;
    var d = state.data;
    var s = d ? d.summary : null;
    var focused = document.activeElement && document.activeElement.matches && document.activeElement.matches("[data-search]");
    var caret = focused ? document.activeElement.selectionStart : null;

    var stats =
      '<div class="acert-stats">' +
        '<button type="button" class="acert-stat" data-tone="ok" data-filter="active" aria-pressed="' + (state.filter === "active") + '"><span class="acert-ico">' + ICON.ok + "</span><div><span>ACTIVE CERTS</span><b>" + (s ? s.active : "–") + "</b></div></button>" +
        '<button type="button" class="acert-stat" data-tone="warn" data-filter="expiring" aria-pressed="' + (state.filter === "expiring") + '"><span class="acert-ico">' + ICON.warn + "</span><div><span>EXPIRING SOON</span><b>" + (s ? s.expiringSoon : "–") + "</b></div></button>" +
      "</div>";

    var tools =
      '<div class="acert-tools">' +
        '<label class="acert-search">' + ICON.search + '<input type="search" data-search placeholder="Search certifications..." value="' + esc(state.search) + '" aria-label="Search certifications"></label>' +
        '<button type="button" class="acert-filter" data-open-filter="1" aria-label="Filter" data-on="' + (state.filter !== "all") + '">' + ICON.filter + "</button>" +
      "</div>" +
      (state.filter !== "all" ? '<div class="acert-chiprow"><button type="button" class="acert-chip" data-filter="all">' + esc(FILTERS.filter(function (f) { return f.key === state.filter; })[0].label) + " ✕</button></div>" : "");

    var body;
    if (!d) {
      body = state.error
        ? '<div class="acert-empty"><b>Couldn\'t load your certifications</b><span>' + esc(state.error) + '</span><button type="button" class="acert-btn" data-retry="1">Try again</button></div>'
        : '<div class="acert-empty"><span class="acert-spinner" aria-hidden="true"></span><span>Loading your certifications…</span></div>';
    } else {
      var parts = [];
      if (s.expired || s.missingRequired) {
        var bits = [];
        if (s.expired) bits.push(s.expired + " expired");
        if (s.missingRequired) bits.push(s.missingRequired + " required for your post not on file");
        parts.push('<div class="acert-alert">' + ICON.small + "<span>" + esc(bits.join(" · ")) + ". Tap one to see what to do.</span></div>");
      }
      if (d.missing.length) {
        parts.push('<div class="acert-label">REQUIRED FOR YOUR POSTS</div>' + d.missing.map(missingCard).join(""));
      }
      if (d.items.length) {
        if (d.missing.length) parts.push('<div class="acert-label">ON FILE</div>');
        parts.push(d.items.map(card).join(""));
      }
      if (!parts.length || (!d.items.length && !d.missing.length)) {
        parts.push('<div class="acert-empty"><b>' + (state.search || state.filter !== "all" ? "Nothing matches" : "No certifications on file") + "</b><span>" +
          (state.search || state.filter !== "all" ? "Try another search or filter." : "When your manager adds a certification or licence for you, it shows here.") + "</span></div>");
      }
      body = '<div class="acert-list">' + parts.join("") + "</div>";
    }

    panel.innerHTML = stats + tools + body + (state.loading && d ? '<div class="acert-refreshing" aria-hidden="true"></div>' : "");
    if (focused) {
      var input = panel.querySelector("[data-search]");
      input.focus();
      if (caret != null) input.setSelectionRange(caret, caret);
    }
  }

  /* ── Sheets ────────────────────────────────────────────────────────────── */

  function sheet(html, onInside) {
    closeSheet();
    var wrap = document.createElement("div");
    wrap.className = "acert-sheet-backdrop";
    wrap.innerHTML = '<div class="acert-sheet" role="dialog" aria-modal="true"><div class="acert-grip"></div>' + html + "</div>";
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap || e.target.closest("[data-close]")) { closeSheet(); return; }
      if (onInside) onInside(e, wrap);
    });
    document.body.appendChild(wrap);
    return wrap;
  }

  function closeSheet() {
    var old = document.querySelector(".acert-sheet-backdrop");
    if (old) old.remove();
  }

  function kv(label, value) {
    return value == null || value === "" ? "" : '<div class="acert-kv"><span>' + esc(label) + "</span><b>" + esc(value) + "</b></div>";
  }

  function openCert(c) {
    var uploadLabel = c.status === "expired" || c.status === "expiring_soon" ? "Upload renewed certificate"
      : c.status === "missing_document" ? "Upload document" : c.hasDocument ? "Replace document" : "Add a copy";
    var html =
      '<div class="acert-sheet-head"><div><div class="acert-sheet-title">' + esc(c.name) + '</div><div class="acert-sheet-sub">' + esc(c.type + " · " + c.category) + "</div></div>" +
        '<span class="acert-badge" data-status="' + c.status + '"><span>' + esc(badgeText(c)) + "</span></span></div>" +
      (c.status === "in_progress" ? '<div class="acert-note">Your manager is checking the document you sent. You\'ll be notified when it\'s done.</div>' : "") +
      (c.status === "missing_document" ? '<div class="acert-note" data-tone="bad">Your manager needs a copy of this certificate. Upload a photo or PDF.</div>' : "") +
      (c.status === "expired" ? '<div class="acert-note" data-tone="bad">This expired on ' + esc(fmtDate(c.expiresAt)) + ". Renew it and upload the new certificate.</div>" : "") +
      '<div class="acert-rows">' +
        kv("Scope", c.scope) +
        kv("Licence / ID number", c.licenseNumber) +
        kv("Issued", c.issuedAt ? fmtDate(c.issuedAt) : null) +
        kv("Expires", c.expiresAt ? fmtDate(c.expiresAt) + " · " + c.timeRemaining : "No expiry") +
        kv("Required for", c.requiredFor.length ? c.requiredFor.join(", ") : null) +
        kv("Document", c.hasDocument ? (c.verified ? "On file · verified" : "On file") : c.requiresDocument ? "Needed" : "None") +
      "</div>" +
      (c.description ? '<p class="acert-desc">' + esc(c.description) + "</p>" : "") +
      (c.notes ? '<div class="acert-note">Note from your manager: ' + esc(c.notes) + "</div>" : "") +
      (c.referenceUrl ? '<a class="acert-link" href="' + esc(c.referenceUrl) + '" target="_blank" rel="noopener noreferrer">More about this certification ↗</a>' : "") +
      '<div class="acert-actions">' +
        (c.hasDocument ? '<button type="button" class="acert-btn" data-view="' + esc(c.id) + '">View document</button>' : "") +
        (c.canUpload ? '<button type="button" class="acert-btn" data-primary="1" data-upload="' + esc(c.id) + '">' + esc(uploadLabel) + "</button>" : "") +
      "</div>" +
      '<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden data-file>' +
      '<button type="button" class="acert-btn acert-close" data-close="1">Close</button>';
    sheet(html, function (e, wrap) {
      var up = e.target.closest("[data-upload]");
      if (up) { wrap.querySelector("[data-file]").click(); return; }
      var view = e.target.closest("[data-view]");
      if (view) viewDocument(c, view);
    });
    var input = document.querySelector(".acert-sheet [data-file]");
    input.addEventListener("change", function () {
      if (input.files && input.files[0]) uploadDocument(c, input.files[0]);
    });
  }

  function openMissing(m) {
    sheet(
      '<div class="acert-sheet-title">' + esc(m.name) + '</div><div class="acert-sheet-sub">' + esc(m.type + " · " + m.category + " · " + m.scope) + "</div>" +
      '<div class="acert-note" data-tone="' + (m.level === "required" ? "bad" : "") + '">' +
        (m.level === "required" ? "Required" : "Recommended") + " for " + esc(m.requiredFor.join(", ")) + ". " +
        "It isn't on your file yet — if you already have it, give a copy to your supervisor so they can add it." +
      "</div>" +
      (m.description ? '<p class="acert-desc">' + esc(m.description) + "</p>" : "") +
      '<button type="button" class="acert-btn acert-close" data-close="1">Close</button>'
    );
  }

  function openFilter() {
    sheet(
      '<div class="acert-sheet-title">Show</div><div class="acert-filters">' +
        FILTERS.map(function (f) {
          return '<button type="button" class="acert-filter-opt" data-pick="' + f.key + '" aria-pressed="' + (state.filter === f.key) + '">' + esc(f.label) + "</button>";
        }).join("") +
      "</div>",
      function (e) {
        var pick = e.target.closest("[data-pick]");
        if (pick) { closeSheet(); setFilter(pick.dataset.pick); }
      }
    );
  }

  function uploadDocument(c, file) {
    if (file.size > 10 * 1024 * 1024) { toast("The file must be 10 MB or smaller"); return; }
    var btn = document.querySelector(".acert-sheet [data-upload]");
    if (btn) { btn.disabled = true; btn.textContent = "Uploading…"; }
    var form = new FormData();
    form.append("file", file, file.name);
    api("/mobile/certifications/" + encodeURIComponent(c.id) + "/document", { method: "POST", body: form })
      .then(function () { closeSheet(); toast("Sent to your manager for review"); load(); })
      .catch(function (ex) { toast(ex.message); if (btn) { btn.disabled = false; btn.textContent = "Try again"; } });
  }

  function viewDocument(c, button) {
    button.disabled = true;
    window.AlexiosAuth.fetch("/mobile/certifications/" + encodeURIComponent(c.id) + "/document")
      .then(function (res) {
        if (!res.ok) throw new Error("Couldn't open the document");
        return res.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        if (blob.type.indexOf("image/") === 0) {
          sheet('<div class="acert-sheet-title">' + esc(c.name) + '</div><img class="acert-doc" alt="Your uploaded certificate" src="' + url + '"><button type="button" class="acert-btn acert-close" data-close="1">Close</button>');
        } else {
          var a = document.createElement("a");
          a.href = url; a.target = "_blank"; a.rel = "noopener"; a.download = c.name.replace(/[^A-Za-z0-9]+/g, "-") + ".pdf";
          document.body.appendChild(a); a.click(); a.remove();
        }
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      })
      .catch(function (ex) { toast(ex.message); })
      .then(function () { button.disabled = false; });
  }

  function toast(text) {
    var t = document.createElement("div");
    t.className = "acert-toast";
    t.setAttribute("role", "status");
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  /* ── Events & loading ──────────────────────────────────────────────────── */

  function setFilter(key) {
    state.filter = state.filter === key && key !== "all" ? "all" : key;
    load();
  }

  function onClick(e) {
    var d = state.data;
    var f = e.target.closest("[data-filter]");
    if (f) { setFilter(f.dataset.filter); return; }
    if (e.target.closest("[data-open-filter]")) { openFilter(); return; }
    if (e.target.closest("[data-retry]")) { load(); return; }
    var c = e.target.closest("[data-cert]");
    if (c && d) { var cert = d.items.filter(function (x) { return x.id === c.dataset.cert; })[0]; if (cert) openCert(cert); return; }
    var m = e.target.closest("[data-missing]");
    if (m && d) { var miss = d.missing.filter(function (x) { return x.skillId === m.dataset.missing; })[0]; if (miss) openMissing(miss); }
  }

  function load() {
    var seq = ++requestSeq;
    state.loading = true;
    state.error = null;
    render();
    var q = "?status=" + state.filter + (state.search.trim() ? "&search=" + encodeURIComponent(state.search.trim()) : "");
    return api("/mobile/certifications" + q)
      .then(function (data) {
        if (seq !== requestSeq) return;
        state.data = data;
        state.loadedAt = Date.now();
        paintHomeTile(data.summary);
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

  function findScreen() {
    var leaves = document.querySelectorAll("#root div");
    for (var i = 0; i < leaves.length; i++) {
      var n = leaves[i];
      if (n.childElementCount === 0 && n.textContent.trim() === "CERTIFICATIONS") {
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
    var mine = body.querySelector("[data-acert-panel]");
    if (!mine) {
      mine = panel = buildPanel();
      body.appendChild(mine);
      render();
      if (!state.data || Date.now() - state.loadedAt > 30000) { state.filter = "all"; state.search = ""; load(); }
    } else {
      panel = mine;
    }
    for (var i = 0; i < body.children.length; i++) {
      var child = body.children[i];
      if (child === mine || child === screen.header || child.dataset.acertHidden) continue;
      child.dataset.acertHidden = "true";
      child.style.display = "none";
    }
  }

  /* ── Home tile ─────────────────────────────────────────────────────────── */

  var homeTileText = null;

  function paintHomeTile(summary) {
    if (summary && state.filter === "all" && !state.search.trim()) {
      var needs = summary.expired + summary.missingRequired + summary.expiringSoon;
      homeTileText = summary.expired || summary.missingRequired ? needs + " need" + (needs === 1 ? "s" : "") + " action"
        : summary.expiringSoon ? summary.expiringSoon + " expiring soon"
        : summary.total ? summary.active + " active" : "None on file";
    }
    if (!homeTileText || findScreen()) return;
    var leaves = document.querySelectorAll("#root div");
    for (var i = 0; i < leaves.length; i++) {
      var n = leaves[i];
      if (n.childElementCount === 0 && n.textContent.trim() === "Certifications" && n.nextElementSibling) {
        if (n.nextElementSibling.textContent !== homeTileText) n.nextElementSibling.textContent = homeTileText;
        return;
      }
    }
  }

  function refreshHomeTile() {
    if (!signedIn()) return;
    api("/mobile/certifications").then(function (d) { paintHomeTile(d.summary); }).catch(function () { /* keep the last text */ });
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
    setTimeout(refreshHomeTile, 2000);
    setInterval(refreshHomeTile, 10 * 60 * 1000);
  }

  window.AlexiosCertifications = { apply: apply, reload: function () { return load(); } };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
