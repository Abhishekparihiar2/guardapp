/* ============================================================================
 * ALEXIOS Mobile — Knowledge Center (real data)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * The bundle's Knowledge Center is a mock-up (four folders of three sample
 * PDFs each). This keeps its header and back button and replaces the rest
 * with the admin's documents (Documents module) that apply to this guard:
 * company-wide, for a site they work, their department, or them.
 *
 *   GET  /mobile/knowledge?category=&search=   folders with counts + documents
 *   GET  /mobile/knowledge/:id/file            open the PDF
 *   POST /mobile/knowledge/:id/acknowledge     "I have read and understood this"
 *
 * Documents the admin marked "requires acknowledgment" are flagged until the
 * guard opens and acknowledges them (and again after the admin changes them).
 * The Home "Knowledge Center" tile shows how many are waiting.
 * ========================================================================== */
(function () {
  "use strict";

  var state = { category: null, search: "", loading: false, data: null, error: null, loadedAt: 0 };
  var panel = null;
  var requestSeq = 0;
  var searchTimer = null;
  var opened = {};            // document id → opened this session (acknowledge needs a read first)

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
    if (!ymd) return null;
    var p = String(ymd).slice(0, 10).split("-");
    return MONTHS[Number(p[1]) - 1] + " " + Number(p[2]) + ", " + p[0];
  }

  /** "Updated today / 3 days ago / 2 weeks ago / Aug 4, 2026". */
  function updatedAgo(iso) {
    var days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days <= 0) return "Updated today";
    if (days === 1) return "Updated yesterday";
    if (days < 7) return "Updated " + days + " days ago";
    if (days < 35) { var w = Math.floor(days / 7); return "Updated " + w + (w === 1 ? " week" : " weeks") + " ago"; }
    return "Updated " + fmtDate(iso);
  }

  var ICON = {
    folder: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 10h18"/></svg>',
    doc: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    pen: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
  };

  /* ── Rendering ─────────────────────────────────────────────────────────── */

  function buildPanel() {
    var wrap = document.createElement("div");
    wrap.className = "akc-panel";
    wrap.dataset.akcPanel = "true";
    wrap.addEventListener("click", onClick);
    wrap.addEventListener("input", function (e) {
      if (!e.target.matches("[data-search]")) return;
      state.search = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { render(); }, 200);
    });
    return wrap;
  }

  function matchesSearch(d) {
    var q = state.search.trim().toLowerCase();
    return !q || (d.title + " " + (d.description || "") + " " + d.categoryLabel + " " + (d.owner || "")).toLowerCase().indexOf(q) >= 0;
  }

  function docRow(d) {
    var meta = [d.fileType || "No file", updatedAgo(d.updatedAt)].join(" · ");
    return '<button type="button" class="akc-doc" data-doc="' + esc(d.id) + '" data-ack="' + d.needsAck + '">' +
      '<span class="akc-doc-icon">' + ICON.doc + "</span>" +
      '<span class="akc-doc-main"><b>' + esc(d.title) + "</b><span>" + esc(meta) + "</span>" +
        (d.needsAck ? '<em class="akc-chip" data-tone="warn">' + ICON.pen + (d.reacknowledge ? "Updated — acknowledge again" : "Read & acknowledge") + "</em>"
          : d.requiresAck && d.acknowledgedAt ? '<em class="akc-chip" data-tone="ok">' + ICON.check + "Acknowledged</em>" : "") +
      "</span>" +
      '<span class="akc-chev">›</span>' +
    "</button>";
  }

  function render() {
    if (!panel) return;
    var d = state.data;
    var focused = document.activeElement && document.activeElement.matches && document.activeElement.matches("[data-search]");
    var caret = focused ? document.activeElement.selectionStart : null;

    if (!d) {
      panel.innerHTML = state.error
        ? '<div class="akc-empty"><b>Couldn\'t load the Knowledge Center</b><span>' + esc(state.error) + '</span><button type="button" class="akc-btn" data-retry="1">Try again</button></div>'
        : '<div class="akc-empty"><span class="akc-spinner" aria-hidden="true"></span><span>Loading documents…</span></div>';
      return;
    }

    var selected = state.category || (d.categories.filter(function (c) { return c.count; })[0] || d.categories[0]).key;
    state.category = selected;
    var folder = d.categories.filter(function (c) { return c.key === selected; })[0];

    var html = "";
    if (d.summary.toAcknowledge) {
      html += '<button type="button" class="akc-alert" data-first-ack="1">' + ICON.pen +
        "<span><b>" + d.summary.toAcknowledge + (d.summary.toAcknowledge === 1 ? " document needs" : " documents need") + " your acknowledgement.</b> Tap to read " + (d.summary.toAcknowledge === 1 ? "it" : "the first one") + ".</span></button>";
    }
    html += '<div class="akc-folders">' + d.categories.map(function (c) {
      return '<button type="button" class="akc-folder" data-cat="' + c.key + '" aria-pressed="' + (c.key === selected) + '">' +
        '<span class="akc-folder-icon">' + ICON.folder + "</span>" +
        "<b>" + esc(c.label) + "</b>" +
        "<span>" + c.count + (c.count === 1 ? " document" : " documents") + "</span>" +
        (c.toAcknowledge ? '<i class="akc-badge" aria-label="' + c.toAcknowledge + ' to acknowledge">' + c.toAcknowledge + "</i>" : "") +
      "</button>";
    }).join("") + "</div>";

    html += '<label class="akc-search">' + ICON.search + '<input type="search" data-search placeholder="Search all documents..." value="' + esc(state.search) + '" aria-label="Search documents"></label>';

    var searching = Boolean(state.search.trim());
    var docs = d.documents.filter(function (x) { return searching ? matchesSearch(x) : x.category === selected; });
    html += '<div class="akc-label">' + esc(searching ? "SEARCH RESULTS" : folder.label.toUpperCase()) + "</div>";
    if (docs.length) {
      html += '<div class="akc-list">' + docs.map(docRow).join("") + "</div>";
    } else {
      html += '<div class="akc-empty"><span>' + (searching ? "No documents match “" + esc(state.search.trim()) + "”." : "No " + esc(folder.label.toLowerCase()) + " have been shared with you yet.") + "</span></div>";
    }

    panel.innerHTML = html + (state.loading ? '<div class="akc-refreshing" aria-hidden="true"></div>' : "");
    if (focused) {
      var input = panel.querySelector("[data-search]");
      input.focus();
      if (caret != null) input.setSelectionRange(caret, caret);
    }
  }

  /* ── Document sheet ────────────────────────────────────────────────────── */

  function closeSheet() {
    var old = document.querySelector(".akc-sheet-backdrop");
    if (old) old.remove();
  }

  function kv(label, value) {
    return value ? '<div class="akc-kv"><span>' + esc(label) + "</span><b>" + esc(value) + "</b></div>" : "";
  }

  function openDoc(doc) {
    closeSheet();
    var readFirst = doc.needsAck && doc.hasFile && !opened[doc.id];
    var wrap = document.createElement("div");
    wrap.className = "akc-sheet-backdrop";
    wrap.innerHTML =
      '<div class="akc-sheet" role="dialog" aria-modal="true" aria-label="' + esc(doc.title) + '">' +
        '<div class="akc-grip"></div>' +
        '<div class="akc-sheet-title">' + esc(doc.title) + "</div>" +
        '<div class="akc-sheet-sub">' + esc(doc.categoryLabel + " · " + doc.scope) + "</div>" +
        (doc.needsAck ? '<div class="akc-note" data-tone="warn">' + (doc.reacknowledge ? "This document was updated after you acknowledged it. Read it again and confirm." : "Your company asks you to read this and confirm you understand it.") + "</div>" : "") +
        (doc.requiresAck && doc.acknowledgedAt ? '<div class="akc-note" data-tone="ok">You acknowledged this on ' + esc(fmtDate(doc.acknowledgedAt)) + ".</div>" : "") +
        (doc.description ? '<p class="akc-desc">' + esc(doc.description) + "</p>" : "") +
        '<div class="akc-rows">' +
          kv("Owner", doc.owner) +
          kv("Effective", fmtDate(doc.effectiveDate)) +
          kv("Last updated", fmtDate(doc.updatedAt)) +
          kv("Version", doc.version > 1 ? "v" + doc.version : null) +
          kv("File", doc.hasFile ? [doc.fileType, doc.fileSize].filter(Boolean).join(" · ") : "No file attached") +
        "</div>" +
        '<div class="akc-actions">' +
          (doc.hasFile ? '<button type="button" class="akc-btn" data-primary="' + (!doc.needsAck || readFirst) + '" data-open="1">Open document</button>' : "") +
          (doc.needsAck ? '<button type="button" class="akc-btn" data-primary="' + !readFirst + '" data-ack-btn="1"' + (readFirst ? " disabled" : "") + ">I have read and understood this</button>" : "") +
        "</div>" +
        (readFirst ? '<div class="akc-hint" data-hint>Open the document first, then confirm.</div>' : "") +
        '<button type="button" class="akc-btn akc-close" data-close="1">Close</button>' +
      "</div>";
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap || e.target.closest("[data-close]")) { closeSheet(); return; }
      if (e.target.closest("[data-open]")) { openFile(doc, e.target.closest("[data-open]"), wrap); return; }
      var ack = e.target.closest("[data-ack-btn]");
      if (ack && !ack.disabled) acknowledge(doc, ack);
    });
    document.body.appendChild(wrap);
  }

  function openFile(doc, button, wrap) {
    button.disabled = true;
    var label = button.textContent;
    button.textContent = "Opening…";
    // Open the tab now (user gesture) and point it at the file once it's fetched.
    var tab = window.open("", "_blank");
    window.AlexiosAuth.fetch("/mobile/knowledge/" + encodeURIComponent(doc.id) + "/file")
      .then(function (res) {
        if (!res.ok) return res.json().catch(function () { return {}; }).then(function (b) { throw new Error(b.message || "Couldn't open the document"); });
        return res.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        if (tab && !tab.closed) tab.location.href = url;
        else {
          var a = document.createElement("a");
          a.href = url; a.target = "_blank"; a.rel = "noopener"; a.download = doc.fileName || doc.title + ".pdf";
          document.body.appendChild(a); a.click(); a.remove();
        }
        setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
        opened[doc.id] = true;
        var ack = wrap.querySelector("[data-ack-btn]");
        if (ack) { ack.disabled = false; ack.dataset.primary = "true"; button.dataset.primary = "false"; }
        var hint = wrap.querySelector("[data-hint]");
        if (hint) hint.remove();
      })
      .catch(function (ex) { if (tab && !tab.closed) tab.close(); toast(ex.message); })
      .then(function () { button.disabled = false; button.textContent = label; });
  }

  function acknowledge(doc, button) {
    button.disabled = true;
    button.textContent = "Saving…";
    api("/mobile/knowledge/" + encodeURIComponent(doc.id) + "/acknowledge", { method: "POST" })
      .then(function () { closeSheet(); toast("Acknowledged — thank you"); load(); })
      .catch(function (ex) { toast(ex.message); button.disabled = false; button.textContent = "I have read and understood this"; });
  }

  function toast(text) {
    var t = document.createElement("div");
    t.className = "akc-toast";
    t.setAttribute("role", "status");
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  /* ── Events & loading ──────────────────────────────────────────────────── */

  function onClick(e) {
    var d = state.data;
    var cat = e.target.closest("[data-cat]");
    if (cat) { state.category = cat.dataset.cat; state.search = ""; render(); return; }
    if (e.target.closest("[data-retry]")) { load(); return; }
    if (e.target.closest("[data-first-ack]") && d) {
      var first = d.documents.filter(function (x) { return x.needsAck; })[0];
      if (first) { state.category = first.category; render(); openDoc(first); }
      return;
    }
    var row = e.target.closest("[data-doc]");
    if (row && d) {
      var doc = d.documents.filter(function (x) { return x.id === row.dataset.doc; })[0];
      if (doc) openDoc(doc);
    }
  }

  function load() {
    var seq = ++requestSeq;
    state.loading = true;
    state.error = null;
    render();
    return api("/mobile/knowledge")
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

  /** The bundle's header: "Knowledge Center" over "Policies, procedures and field resources" (the Home tile has the same title). */
  function findScreen() {
    var leaves = document.querySelectorAll("#root div");
    for (var i = 0; i < leaves.length; i++) {
      var n = leaves[i];
      if (n.childElementCount === 0 && n.textContent.trim() === "Knowledge Center" && n.nextElementSibling && /^Policies/.test(n.nextElementSibling.textContent.trim())) {
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
    var mine = body.querySelector("[data-akc-panel]");
    if (!mine) {
      mine = panel = buildPanel();
      body.appendChild(mine);
      render();
      if (!state.data || Date.now() - state.loadedAt > 30000) { state.category = null; state.search = ""; load(); }
    } else {
      panel = mine;
    }
    for (var i = 0; i < body.children.length; i++) {
      var child = body.children[i];
      if (child === mine || child === screen.header || child.dataset.akcHidden) continue;
      child.dataset.akcHidden = "true";
      child.style.display = "none";
    }
  }

  /* ── Home tile ─────────────────────────────────────────────────────────── */

  var homeTileText = null;

  function paintHomeTile(summary) {
    if (summary) homeTileText = summary.toAcknowledge ? summary.toAcknowledge + " to acknowledge" : summary.total + (summary.total === 1 ? " document" : " documents");
    if (!homeTileText || findScreen()) return;
    var leaves = document.querySelectorAll("#root div");
    for (var i = 0; i < leaves.length; i++) {
      var n = leaves[i];
      if (n.childElementCount === 0 && n.textContent.trim() === "Knowledge Center" && n.nextElementSibling) {
        if (n.nextElementSibling.textContent !== homeTileText) n.nextElementSibling.textContent = homeTileText;
        return;
      }
    }
  }

  function refreshHomeTile() {
    if (!signedIn()) return;
    api("/mobile/knowledge").then(function (d) { paintHomeTile(d.summary); }).catch(function () { /* keep the last text */ });
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
    setTimeout(refreshHomeTile, 2200);
    setInterval(refreshHomeTile, 10 * 60 * 1000);
  }

  window.AlexiosKnowledge = { apply: apply, reload: function () { return load(); } };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
