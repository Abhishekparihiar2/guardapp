/* ============================================================================
 * ALEXIOS Mobile — Field Reporting Hub
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 * The Home "Reports" tile opens real screens instead of the bundle's mock-up:
 *
 *   Hub     GET  /mobile/reports                    report types I can file + my recent reports
 *   Form    GET  /mobile/reports/types/:id          the admin's fields, my sites, auto-filled info
 *           POST /mobile/uploads/photo (kind=report) photos and signatures, before submitting
 *           POST /mobile/reports/types/:id          file it (idempotent: retries never double up)
 *   Detail  GET  /mobile/reports/submissions/:id    a filed report as submitted
 *
 * Fields are rendered from the admin's Form Builder: order, labels, help text,
 * required flags and options exactly as configured. Reports can be filed on or
 * off duty; the site defaults to the shift's site.
 * ========================================================================== */
(function () {
  "use strict";

  var ICON = {
    back: '<svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.5 15.5L1.5 8.5L8.5 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3z"/><path d="M12 9v4M12 16h.01"/></svg>',
    wrench: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5z"/></svg>',
    clipboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 11h6M9 15h4"/></svg>'
  };

  var STATUS_TONE = { Submitted: "", Approved: "green", "Manager review": "amber", Rejected: "red", Draft: "grey" };
  var SEVERITIES = ["low", "medium", "high", "critical"];

  /* ── Helpers ───────────────────────────────────────────────────────────── */

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") n.className = attrs[k];
        else if (k === "html") n.innerHTML = attrs[k];
        else if (k === "text") n.textContent = attrs[k];
        else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  function mobile() { return window.AlexiosMobile; }
  function api(path, body) { return mobile().api(path, body); }
  function notice(text, kind) { return el("div", { class: "apt-notice", "data-kind": kind || "warn", text: text }); }
  function hhmm(iso) { return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }); }
  function longDate(iso) { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

  /** Card look from the report's name / category: incidents red, maintenance amber, logs blue. */
  function lookOf(type) {
    var text = (type.name + " " + (type.category || "")).toLowerCase();
    if (/incident|breach|security|emergenc/.test(text)) return { icon: ICON.shield, tone: "red" };
    if (/mainten|repair|facilit|damage/.test(text)) return { icon: ICON.wrench, tone: "amber" };
    if (/hour|patrol|log|activity|check/.test(text)) return { icon: ICON.clock, tone: "" };
    return { icon: ICON.clipboard, tone: "" };
  }

  function badgeOf(type, look) {
    if (!type.mobileReady) return { text: "Web portal only", tone: "grey" };
    if (look.tone === "red") return { text: "Immediate filing", tone: "red" };
    if (type.approvalRequired) return { text: "Manager review", tone: "amber" };
    return { text: "New entry", tone: "" };
  }

  function statusPill(label) {
    return el("span", { class: "arp-pill", "data-tone": STATUS_TONE[label] || null, text: label });
  }

  /** Uploads one photo / signature for a report; resolves to its key. */
  function uploadPhoto(blob, name) {
    var form = new FormData();
    form.append("kind", "report");
    form.append("file", blob, name);
    return window.AlexiosAuth.fetch("/mobile/uploads/photo", { method: "POST", body: form }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (!res.ok) throw new Error((json && json.message) || "Upload failed (" + res.status + ")");
        return json.data.key;
      });
    });
  }

  /** The guard's own report photos are behind auth, so they are fetched and shown as blob URLs. */
  function photoImg(ref) {
    var img = el("img", { alt: "" });
    window.AlexiosAuth.fetch("/mobile/uploads/photo/" + ref.kind + "/" + encodeURIComponent(ref.fileName))
      .then(function (res) { return res.ok ? res.blob() : null; })
      .then(function (blob) { if (blob) img.src = URL.createObjectURL(blob); })
      .catch(function () {});
    return img;
  }

  /** datetime-local gives "YYYY-MM-DDTHH:mm" in local time; send it with the zone. */
  function localToIso(value) { return value ? new Date(value).toISOString() : ""; }

  /* ── Overlay with a small screen stack (same shape as patrol.js) ───────── */

  var UI = null;
  var stack = [];
  var flash = null;

  function build() {
    if (UI) return UI;
    var back = el("button", { class: "acg-back", type: "button", "aria-label": "Back", html: ICON.back, onclick: pop });
    var title = el("div", { class: "acg-title" });
    var sub = el("div", { class: "acg-sub" });
    var body = el("div", { class: "acg-body" });
    var foot = el("div", { class: "acg-foot" });
    var overlay = el("div", { class: "acg-overlay", "data-open": "false", "data-flow": "reports" }, [
      el("div", { class: "acg-head" }, [el("div", { class: "acg-head-row" }, [back, el("div", { class: "acg-head-txt" }, [title, sub])])]),
      body,
      foot
    ]);
    document.body.appendChild(overlay);
    UI = { overlay: overlay, title: title, sub: sub, body: body, foot: foot };
    return UI;
  }

  function push(screen, data) {
    build();
    stack.push(screen);
    UI.overlay.dataset.open = "true";
    show(data);
  }

  function replace(screen, data) {
    stack.pop();
    push(screen, data);
  }

  function pop() {
    stack.pop();
    if (!stack.length) { UI.overlay.dataset.open = "false"; return; }
    show();
  }

  function show(data) {
    var screen = stack[stack.length - 1];
    UI.title.textContent = screen.title;
    UI.sub.textContent = screen.sub || "";
    UI.body.textContent = "";
    UI.foot.textContent = "";
    UI.foot.style.display = "none";
    if (data === undefined) UI.body.appendChild(el("div", { class: "acg-lead", text: "Loading…" }));
    var load = data === undefined ? screen.load() : Promise.resolve(data);
    load.then(function (result) {
      if (stack[stack.length - 1] !== screen) return;
      UI.body.textContent = "";
      if (flash) { UI.body.appendChild(notice(flash.text, flash.kind)); flash = null; }
      if (screen.titleFrom) UI.title.textContent = screen.titleFrom(result);
      screen.render(UI.body, UI.foot, result);
      UI.body.scrollTop = 0;
    }).catch(function (err) {
      UI.body.textContent = "";
      UI.body.appendChild(notice(err.message, "error"));
    });
  }

  function footButton(label, onclick) {
    UI.foot.style.display = "";
    var button = el("button", { class: "acg-next", type: "button", text: label, onclick: onclick });
    UI.foot.appendChild(button);
    return button;
  }

  /* ── Hub ───────────────────────────────────────────────────────────────── */

  function hubScreen() {
    return {
      title: "FIELD REPORTING HUB",
      sub: "SECURE DIGITAL DOCUMENTATION",
      load: function () { return api("/mobile/reports"); },
      render: function (body, foot, hub) {
        if (!hub.types.length) {
          body.appendChild(el("div", { class: "arp-empty", text: "No report types are set up for your sites yet." }));
        } else {
          var grid = el("div", { class: "arp-grid" });
          hub.types.forEach(function (type) {
            var look = lookOf(type);
            var badge = badgeOf(type, look);
            grid.appendChild(el("button", {
              class: "arp-type", type: "button", "data-tone": look.tone || null, "data-disabled": String(!type.mobileReady),
              title: type.mobileReady ? "" : "Needs " + type.blockedBy.join(", ") + ": file it on the web portal",
              onclick: function () { if (type.mobileReady) push(formScreen(type.id, type.name)); }
            }, [
              el("span", { class: "arp-icon", html: look.icon }),
              el("span", { class: "arp-type-name", text: type.name }),
              el("span", { class: "arp-type-desc", text: type.description || type.category || "" }),
              el("span", { class: "arp-pill", "data-tone": badge.tone || null, text: badge.text })
            ]));
          });
          body.appendChild(grid);
        }

        body.appendChild(el("div", { class: "arp-section", text: "Recent submissions" }));
        if (!hub.recent.length) {
          body.appendChild(el("div", { class: "arp-empty", text: "Reports you file appear here." }));
          return;
        }
        hub.recent.forEach(function (r) {
          body.appendChild(el("button", { class: "arp-recent", type: "button", onclick: function () { push(detailScreen(r.id)); } }, [
            el("span", { class: "arp-recent-time", text: hhmm(r.submittedAt) }),
            el("span", { class: "arp-recent-main" }, [
              el("div", { class: "arp-recent-name", text: r.reportName }),
              el("div", { class: "arp-recent-site", text: r.siteName || "" })
            ]),
            statusPill(r.statusLabel)
          ]));
        });
      }
    };
  }

  /* ── Form ──────────────────────────────────────────────────────────────── */

  function formScreen(typeId, name) {
    return {
      title: name.toUpperCase(),
      sub: "NEW REPORT",
      load: function () { return api("/mobile/reports/types/" + encodeURIComponent(typeId)); },
      render: function (body, foot, form) { renderForm(body, form); }
    };
  }

  function renderForm(body, form) {
    var state = {
      key: mobile().newIdempotencyKey(),   // reused on retry, so a resend never files twice
      siteId: form.defaultSiteId || (form.sites[0] && form.sites[0].id) || null,
      severity: null,
      values: {},                          // fieldKey → value
      photos: {},                          // fieldKey → [{ key, url, busy }]
      signatures: {},                      // fieldKey → { canvas, drawn, key }
      rows: {}                             // fieldKey → { wrap, error }
    };
    var now = new Date(form.now);

    if (form.submissionRule === "once" && form.alreadySubmitted) body.appendChild(notice("You have already filed this report. It can only be filed once.", "warn"));
    if (!form.sites.length) body.appendChild(notice("You are not assigned to a site this report is set up for.", "error"));

    // Filled in for the guard, like the design's header card.
    var siteValue;
    if (form.sites.length > 1) {
      siteValue = el("select", { class: "arp-control", onchange: function (e) { state.siteId = e.target.value; } },
        form.sites.map(function (s) { return el("option", { value: s.id, text: s.name, selected: s.id === state.siteId ? "selected" : null }); }));
    } else {
      siteValue = document.createTextNode(form.sites[0] ? form.sites[0].name : "—");
    }
    body.appendChild(el("div", { class: "arp-info" }, [
      infoRow("Guard", form.guardName),
      el("div", { class: "arp-info-row" }, [el("span", { class: "arp-info-k", text: "Site" }), el("span", { class: "arp-info-v" }, [siteValue])]),
      infoRow("Date", longDate(now.toISOString())),
      infoRow("Time", now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }))
    ]));

    if (form.severityEnabled) {
      body.appendChild(fieldWrap(state, { key: "__severity", label: "Severity", required: false }, chips(SEVERITIES, false, function (v) { state.severity = v[0] || null; }, function (s) { return s[0].toUpperCase() + s.slice(1); })));
    }

    form.fields.forEach(function (field) {
      if (field.type === "divider") { body.appendChild(el("div", { class: "arp-divider", text: field.label })); return; }
      body.appendChild(fieldWrap(state, field, controlFor(state, field)));
    });

    var hint = state.hint = el("div", { class: "acg-foot-hint" });
    var blocked = !form.sites.length || (form.submissionRule === "once" && form.alreadySubmitted);
    var submit = footButton("Submit report", function () { if (!blocked) submitReport(form, state, submit, hint); });
    submit.dataset.disabled = String(blocked);
    UI.foot.appendChild(hint);
  }

  function infoRow(k, v) {
    return el("div", { class: "arp-info-row" }, [el("span", { class: "arp-info-k", text: k }), el("span", { class: "arp-info-v", text: v })]);
  }

  function fieldWrap(state, field, control) {
    var error = el("div", { class: "arp-error", hidden: "hidden" });
    var wrap = el("div", { class: "arp-field" }, [
      el("label", { class: "arp-label" }, [field.label, field.required ? el("b", { text: " *" }) : null]),
      field.helpText ? el("div", { class: "arp-help", text: field.helpText }) : null,
      control,
      error
    ]);
    state.rows[field.key] = { wrap: wrap, error: error, label: field.label };
    return wrap;
  }

  function setError(state, key, message) {
    var row = state.rows[key];
    if (!row) return;
    row.wrap.dataset.error = String(Boolean(message));
    row.error.hidden = !message;
    row.error.textContent = message || "";
  }

  /** Toggle chips; `multi` allows several. onChange gets the chosen values. */
  function chips(options, multi, onChange, labelOf) {
    var chosen = [];
    var box = el("div", { class: "arp-chips" });
    options.forEach(function (opt) {
      var chip = el("button", { class: "arp-chip", type: "button", "aria-pressed": "false", text: labelOf ? labelOf(opt) : opt });
      chip.addEventListener("click", function () {
        var i = chosen.indexOf(opt);
        if (multi) { if (i >= 0) chosen.splice(i, 1); else chosen.push(opt); }
        else chosen = i >= 0 ? [] : [opt];
        Array.prototype.forEach.call(box.children, function (c, j) { c.setAttribute("aria-pressed", String(chosen.indexOf(options[j]) >= 0)); });
        onChange(chosen.slice());
      });
      box.appendChild(chip);
    });
    return box;
  }

  function controlFor(state, field) {
    var key = field.key;
    var set = function (v) { state.values[key] = v; setError(state, key, ""); if (state.hint) state.hint.textContent = ""; };
    if (!field.supported) return el("div", { class: "arp-unsupported", text: "This field is filled on the web portal." });

    switch (field.type) {
      case "short":
        return el("input", { class: "arp-control", type: "text", maxlength: "500", oninput: function (e) { set(e.target.value); } });
      case "long":
        return el("textarea", { class: "arp-control", maxlength: "5000", placeholder: "Detailed description of events…", oninput: function (e) { set(e.target.value); } });
      case "number":
        return el("input", { class: "arp-control", type: "number", inputmode: "decimal", oninput: function (e) { set(e.target.value === "" ? "" : Number(e.target.value)); } });
      case "date":
        return el("input", { class: "arp-control", type: "date", onchange: function (e) { set(e.target.value); } });
      case "time":
        return el("input", { class: "arp-control", type: "time", onchange: function (e) { set(e.target.value); } });
      case "datetime":
        return el("input", { class: "arp-control", type: "datetime-local", onchange: function (e) { set(localToIso(e.target.value)); } });
      case "checkbox": {
        var button = el("button", { class: "arp-check", type: "button", "aria-pressed": "false" }, [el("span", { class: "arp-box", html: ICON.check }), el("span", { text: field.label })]);
        state.values[key] = false;
        button.addEventListener("click", function () {
          var on = button.getAttribute("aria-pressed") !== "true";
          button.setAttribute("aria-pressed", String(on));
          set(on);
        });
        return button;
      }
      case "single":
        return field.options.length > 6
          ? el("select", { class: "arp-control", onchange: function (e) { set(e.target.value); } }, [el("option", { value: "", text: "Choose…" })].concat(field.options.map(function (o) { return el("option", { value: o, text: o }); })))
          : chips(field.options, false, function (v) { set(v[0] || ""); });
      case "multi":
        return chips(field.options, true, function (v) { set(v); });
      case "site":
      case "incident":
        return el("select", { class: "arp-control", onchange: function (e) { set(e.target.value); } },
          [el("option", { value: "", text: field.type === "site" ? "Choose a site…" : "Choose an incident type…" })]
            .concat((field.choices || []).map(function (c) { return el("option", { value: c.id, text: c.name }); })));
      case "photo":
      case "photo_high":
        return photoControl(state, field, 1);
      case "photo_gallery":
        return photoControl(state, field, 10);
      case "signature":
        return signatureControl(state, field);
      default:
        return el("div", { class: "arp-unsupported", text: "This field is filled on the web portal." });
    }
  }

  function photoControl(state, field, max) {
    var key = field.key;
    var list = state.photos[key] = [];
    var box = el("div", { class: "arp-photos" });
    var input = el("input", { type: "file", accept: "image/*", capture: "environment", hidden: "hidden" });
    if (max > 1) input.setAttribute("multiple", "multiple");

    function sync() {
      var keys = list.filter(function (p) { return p.key; }).map(function (p) { return p.key; });
      state.values[key] = max > 1 ? keys : keys[0] || "";
      box.textContent = "";
      list.forEach(function (p, i) {
        box.appendChild(el("div", { class: "arp-photo", "data-busy": String(Boolean(p.busy)) }, [
          el("img", { src: p.url, alt: "" }),
          el("button", { class: "arp-photo-x", type: "button", "aria-label": "Remove photo", text: "×", onclick: function () { list.splice(i, 1); sync(); } })
        ]));
      });
      if (list.length < max) box.appendChild(el("button", { class: "arp-photo-add", type: "button", text: max > 1 ? "+ Add photo" : "+ Take photo", onclick: function () { input.click(); } }));
      box.appendChild(input);
    }

    input.addEventListener("change", function () {
      Array.prototype.slice.call(input.files || [], 0, max - list.length).forEach(function (file) {
        var p = { key: null, url: URL.createObjectURL(file), busy: true };
        list.push(p);
        uploadPhoto(file, file.name || "photo.jpg").then(function (k) { p.key = k; }).catch(function (err) {
          list.splice(list.indexOf(p), 1);
          setError(state, key, err.message);
        }).then(function () { p.busy = false; sync(); });
      });
      input.value = "";
      setError(state, key, "");
      sync();
    });
    sync();
    return box;
  }

  function signatureControl(state, field) {
    var canvas = el("canvas");
    var sig = state.signatures[field.key] = { canvas: canvas, drawn: false, key: null };
    var hintText = el("span", { class: "arp-sign-hint", text: "Sign here" });
    var ctx = null;
    var drawing = false;

    function setup() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx = canvas.getContext("2d");
      ctx.scale(2, 2);
      paper();
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#0f172a";
    }
    // Saved as PNG: without a white background the dark ink would vanish on dark screens.
    function paper() {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    function point(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

    canvas.addEventListener("pointerdown", function (e) {
      if (!ctx) setup();
      if (!ctx) return;
      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      var p = point(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var p = point(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      sig.drawn = true;
      sig.key = null;   // changed since it was uploaded
      hintText.hidden = true;
      setError(state, field.key, "");
    });
    canvas.addEventListener("pointerup", function () { drawing = false; });

    var clear = el("button", { class: "arp-sign-clear", type: "button", text: "Clear", onclick: function () {
      if (ctx) paper();
      sig.drawn = false;
      sig.key = null;
      hintText.hidden = false;
    } });
    return el("div", { class: "arp-sign" }, [canvas, hintText, clear]);
  }

  /** Same required rule as the server, so the guard sees every gap at once. */
  function missingRequired(form, state) {
    var missing = [];
    form.fields.forEach(function (f) {
      if (!f.required || !f.supported || f.type === "divider") return;
      var v = state.values[f.key];
      var sig = state.signatures[f.key];
      var empty = f.type === "signature" ? !(sig && sig.drawn)
        : f.type === "checkbox" ? v !== true
        : v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
      if (empty) missing.push(f);
    });
    return missing;
  }

  function uploadSignatures(state) {
    return Promise.all(Object.keys(state.signatures).map(function (key) {
      var sig = state.signatures[key];
      if (!sig.drawn) { delete state.values[key]; return null; }
      if (sig.key) { state.values[key] = sig.key; return null; }
      return new Promise(function (resolve) { sig.canvas.toBlob(resolve, "image/png"); })
        .then(function (blob) { return uploadPhoto(blob, "signature.png"); })
        .then(function (k) { sig.key = k; state.values[key] = k; });
    }));
  }

  var sending = false;

  function submitReport(form, state, button, hint) {
    if (sending) return;
    Object.keys(state.rows).forEach(function (k) { setError(state, k, ""); });
    var busyPhoto = Object.keys(state.photos).some(function (k) { return state.photos[k].some(function (p) { return p.busy; }); });
    if (busyPhoto) { hint.textContent = "Wait for the photos to finish uploading."; return; }
    var missing = missingRequired(form, state);
    if (missing.length) {
      missing.forEach(function (f) { setError(state, f.key, f.type === "checkbox" ? "This must be ticked" : "This field is required"); });
      state.rows[missing[0].key].wrap.scrollIntoView({ behavior: "smooth", block: "center" });
      hint.textContent = missing.length === 1 ? "1 required field is empty." : missing.length + " required fields are empty.";
      return;
    }

    sending = true;
    button.dataset.disabled = "true";
    button.textContent = "Submitting…";
    hint.textContent = "";
    uploadSignatures(state).then(function () {
      var answers = {};
      Object.keys(state.values).forEach(function (k) { answers[k] = state.values[k]; });
      var body = { idempotencyKey: state.key, answers: answers };
      if (state.siteId) body.siteId = state.siteId;
      if (state.severity) body.severity = state.severity;
      return api("/mobile/reports/types/" + encodeURIComponent(form.id), body);
    }).then(function (result) {
      flash = { text: "Report filed." + (result.submission.statusLabel === "Manager review" ? " It is waiting for manager review." : ""), kind: "ok" };
      replace(detailScreen(result.submission.id), result.submission);
    }).catch(function (err) {
      // "Label: problem" from the server names the field to highlight.
      var field = form.fields.filter(function (f) { return err.message && err.message.indexOf(f.label + ":") === 0; })[0];
      if (field) {
        setError(state, field.key, err.message.slice(field.label.length + 1).trim());
        state.rows[field.key].wrap.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      hint.textContent = err.message === "Failed to fetch" ? "No connection. Your answers are kept: try again." : err.message;
    }).then(function () {
      sending = false;
      button.dataset.disabled = "false";
      button.textContent = "Submit report";
    });
  }

  /* ── Detail ────────────────────────────────────────────────────────────── */

  function display(item) {
    var v = item.value;
    if (v === null || v === undefined) return "—";
    if (item.type === "checkbox") return v ? "Yes" : "No";
    if (Array.isArray(v)) return v.join(", ") || "—";
    if (typeof v === "object") return v.name || v.id || "—";
    if (item.type === "datetime") return new Date(v).toLocaleString();
    return String(v);
  }

  function detailScreen(id) {
    return {
      title: "REPORT",
      sub: "SUBMISSION DETAIL",
      titleFrom: function (r) { return (r.reportName + " #" + r.id).toUpperCase(); },
      load: function () { return api("/mobile/reports/submissions/" + encodeURIComponent(id)); },
      render: function (body, foot, r) {
        var statusTone = STATUS_TONE[r.statusLabel] === "" ? "green" : STATUS_TONE[r.statusLabel];
        body.appendChild(el("div", { class: "arp-info" }, [
          infoRow("Report ID", r.reportName + " #" + r.id),
          infoRow("Type", r.category || "Report"),
          el("div", { class: "arp-info-row" }, [el("span", { class: "arp-info-k", text: "Status" }), el("span", { class: "arp-info-v arp-status", "data-tone": statusTone || null, text: r.statusLabel.toUpperCase() })]),
          infoRow("Submitted by", r.submittedBy),
          infoRow("Time", hhmm(r.submittedAt)),
          infoRow("Date", longDate(r.submittedAt)),
          infoRow("Location", r.site ? r.site.name : "—"),
          r.severity ? infoRow("Severity", r.severity[0].toUpperCase() + r.severity.slice(1)) : null
        ]));
        if (r.rejectedReason) body.appendChild(notice("Rejected: " + r.rejectedReason, "error"));

        var photos = 0;
        r.items.forEach(function (item) {
          var card = el("div", { class: "arp-answer" }, [el("div", { class: "arp-info-k", text: item.label })]);
          if (item.photos.length) {
            photos += item.photos.length;
            card.appendChild(el("div", { class: "arp-photos" }, item.photos.map(function (ref) {
              return el("div", { class: "arp-photo", "data-kind": item.type === "signature" ? "signature" : null }, [photoImg(ref)]);
            })));
          } else {
            card.appendChild(el("div", { class: "arp-answer-v", text: display(item) }));
          }
          body.appendChild(card);
        });
        if (!photos) body.appendChild(el("div", { class: "arp-answer" }, [el("div", { class: "arp-info-k", text: "Attachments" }), el("div", { class: "arp-answer-v", text: "No attachments" })]));
      }
    };
  }

  /* ── Entry: the Home "Reports" tile ────────────────────────────────────── */

  function isReportsTile(node) {
    for (var n = node, depth = 0; n && n !== document.body && depth < 6; n = n.parentElement, depth++) {
      var text = (n.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (text.indexOf("reports") === 0 && text.length < 30) return true;
    }
    return false;
  }

  document.addEventListener("click", function (e) {
    if (UI && UI.overlay.contains(e.target)) return;
    if (!isReportsTile(e.target) || !window.AlexiosMobile || !window.AlexiosAuth || !window.AlexiosAuth.token()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    stack = [];
    push(hubScreen());
  }, true);

  window.AlexiosReports = {
    open: function () { stack = []; push(hubScreen()); },
    openType: function (id, name) { stack = []; push(formScreen(id, name || "Report")); },
    openSubmission: function (id) { stack = []; push(detailScreen(id)); }
  };
})();
