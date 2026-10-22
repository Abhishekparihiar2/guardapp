/* ============================================================================
 * ALEXIOS Mobile — Clock In + Shift Start Checklist
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * Clock In Now is held until the backend accepts the clock-in:
 *
 *   1. Read GPS and call POST /mobile/clock-in/check. Outside the site border,
 *      before/after the shift, or already clocked in → explain and stop.
 *   2. Show the pages the admin set up for this site and the guard's position
 *      (Clients & Sites → Checklists → Clock In), in the admin's order. Each
 *      page is one of: Daily Brief (this shift's tours, tasks and repeating
 *      reports), Prior Shift Reports (filed at the site recently) or a
 *      Checklist (the admin's items to tick, optionally with a photo).
 *   3. On the last page, POST /mobile/clock-in with each page's ticked items
 *      and photo. When it succeeds the bundle's own handler runs and the home
 *      screen switches to on duty.
 *
 * Photos upload as soon as they are taken (kind "clock-in").
 * Desk testing: AlexiosClockInGate.mockLocation(lat, lng) replaces GPS.
 * ========================================================================== */
(function () {
  "use strict";

  /* ── Icons ─────────────────────────────────────────────────────────────── */

  var ICON = {
    back: '<svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.5 15.5L1.5 8.5L8.5 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    done: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    cam: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    selfie: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/><rect x="2.5" y="2.5" width="19" height="19" rx="4"/></svg>'
  };

  /* ── Steps for the current run, in the order the backend returned them ──
   * Each is one page the admin set up for this site and position (Clients &
   * Sites → Checklists): { itemKey, type, title, instructions, ackText, items,
   * photo, brief?, reports? }. type is daily_brief | prior_reports | checklist. */
  var STEPS = [];

  var TYPES = { daily_brief: true, prior_reports: true, checklist: true };
  var DOTS = { tours: "#3A7BFF", tasks: "#A78BFA", reports: "#38BDF8" };

  /* Company setting (Time Clock → Require photo): the punch itself needs a
     photo, separate from any checklist page photo. Shown as a last page. */
  var CLOCK_IN_PHOTO = "__clock_in_photo";

  function stepsFrom(checklist, requirePhoto) {
    var steps = checklist.filter(function (step) { return TYPES[step.type]; });
    if (requirePhoto) {
      steps.push({
        itemKey: CLOCK_IN_PHOTO, type: "checklist", title: "Clock-in Photo",
        instructions: "Take a clear selfie at your post. It is saved with your clock-in.",
        ackText: null, items: [],
        photo: { required: true, label: "Take a selfie", camera: "front" }
      });
    }
    return steps;
  }

  /* ── State (per run; nothing persists) ─────────────────────────────────── */

  var state = null;

  function freshState() {
    return {
      /* loading → steps → submitting → done, or blocked when clock-in is refused */
      status: "loading",
      message: "",
      error: "",
      clockIn: null,   // { shiftId, location, idempotencyKey } from the pre-check
      index: 0,
      acks: {},        // itemKey → true once the acknowledgement is ticked
      checked: {},     // itemKey → { itemId: true }
      photos: {},      // itemKey → { key, previewUrl, uploading }
      open: {},        // "itemKey:reportId" → expanded
      done: false
    };
  }

  function photoOf(step) {
    if (!state.photos[step.itemKey]) state.photos[step.itemKey] = { key: null, previewUrl: null, uploading: false };
    return state.photos[step.itemKey];
  }

  function checkedOf(step) {
    if (!state.checked[step.itemKey]) state.checked[step.itemKey] = {};
    return state.checked[step.itemKey];
  }

  /* ── DOM helper (same shape as the other add-ons) ──────────────────────── */

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

  function checkRow(label, on, onclick) {
    return el("button", {
      class: "acg-check", "data-on": String(!!on), type: "button", onclick: onclick
    }, [
      el("span", { class: "acg-box", html: ICON.check }),
      el("span", { text: label })
    ]);
  }

  /** `photo` is state.photos[kind]: { key, previewUrl, uploading }. */
  function photoTile(photo, required, label, icon, onclick) {
    var shot = Boolean(photo.key);
    var tile = el("button", {
      class: "acg-photo", type: "button",
      "data-shot": String(shot), "data-req": String(!!required && !shot && !photo.uploading),
      onclick: photo.uploading ? null : onclick
    }, [
      el("span", { class: "acg-photo-ico", html: icon }),
      el("span", { text: photo.uploading ? "Uploading photo…" : shot ? "Photo uploaded" : label })
    ]);
    if (photo.previewUrl) {
      tile.style.backgroundImage = "linear-gradient(rgba(5,10,20,.55), rgba(5,10,20,.55)), url(" + photo.previewUrl + ")";
      tile.style.backgroundSize = "cover";
      tile.style.backgroundPosition = "center";
    }
    return tile;
  }

  /* ── Photos ────────────────────────────────────────────────────────────────
   * Uploaded to the server (POST /mobile/uploads/photo) as soon as they are
   * taken; the returned key goes on the clock-in. Phones open the camera
   * (rear or front, as the admin set for the page); desktops open a file picker.
   * ------------------------------------------------------------------------ */

  function choosePhoto(step) {
    var facing = step.photo && step.photo.camera === "front" ? "user" : "environment";
    var kind = step.itemKey;
    var input = el("input", { type: "file", accept: "image/jpeg,image/png,image/webp", capture: facing });
    input.style.display = "none";
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      input.remove();
      if (file) attachPhoto(kind, file);
    });
    document.body.appendChild(input);
    input.click();
  }

  function attachPhoto(kind, file) {
    var step = STEPS.find(function (st) { return st.itemKey === kind; });
    if (!step) return Promise.reject(new Error("No page " + kind));
    var photo = photoOf(step);
    photo.uploading = true;
    state.error = "";
    render();

    var form = new FormData();
    form.append("kind", "clock-in");
    form.append("file", file, file.name || kind + ".jpg");
    return window.AlexiosAuth.fetch("/mobile/uploads/photo", { method: "POST", body: form })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          if (!res.ok) throw new Error((json && json.message) || "Upload failed (" + res.status + ")");
          return json.data;
        });
      })
      .then(function (saved) {
        if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
        photo.key = saved.key;
        photo.previewUrl = URL.createObjectURL(file);
      })
      .catch(function (err) {
        state.error = err.message === "Failed to fetch" ? "No connection. Try the photo again." : err.message;
      })
      .then(function () {
        photo.uploading = false;
        render();
      });
  }

  /* ── UI shell ──────────────────────────────────────────────────────────── */

  var UI = null;

  function build() {
    if (UI) return UI;

    var back = el("button", {
      class: "acg-back", type: "button", "aria-label": "Previous step",
      html: ICON.back, onclick: prev
    });
    var title = el("div", { class: "acg-title", text: "SHIFT START" });
    var sub = el("div", { class: "acg-sub" });
    var count = el("div", { class: "acg-count" });
    var fill = el("div", { class: "acg-bar-fill" });
    var body = el("div", { class: "acg-body" });
    var next = el("button", { class: "acg-next", type: "button", onclick: advance });
    var hint = el("div", { class: "acg-foot-hint" });
    var foot = el("div", { class: "acg-foot" }, [next, hint]);

    var overlay = el("div", { class: "acg-overlay", "data-open": "false" }, [
      el("div", { class: "acg-head" }, [
        el("div", { class: "acg-head-row" }, [
          back,
          el("div", { class: "acg-head-txt" }, [title, sub]),
          count
        ]),
        el("div", { class: "acg-bar" }, [fill])
      ]),
      body,
      foot
    ]);

    document.body.appendChild(overlay);
    UI = { overlay: overlay, back: back, sub: sub, count: count, fill: fill,
           body: body, next: next, hint: hint, foot: foot };
    return UI;
  }

  /* ── Steps ─────────────────────────────────────────────────────────────── */

  function lead(body, text) {
    if (text) body.appendChild(el("div", { class: "acg-lead", text: text }));
  }

  function ackRow(body, step) {
    if (!step.ackText) return;
    body.appendChild(el("div", { class: "acg-ack" }, [
      checkRow(step.ackText, state.acks[step.itemKey], function () {
        state.acks[step.itemKey] = !state.acks[step.itemKey];
        render();
      })
    ]));
  }

  function photoBlock(body, step) {
    if (!step.photo) return;
    body.appendChild(el("div", { class: "acg-label", text: "Photo" }));
    body.appendChild(photoTile(
      photoOf(step), true, step.photo.label || "Take a photo",
      step.photo.camera === "front" ? ICON.selfie : ICON.cam,
      function () { choosePhoto(step); }
    ));
  }

  function timeText(row) {
    if (row.timeLabel && !row.time) return row.timeLabel;
    if (!row.time) return "";
    var d = new Date(row.time.length === 16 ? row.time + ":00" : row.time);
    if (isNaN(d)) return row.timeLabel || "";
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function stepBrief(body, step) {
    lead(body, step.instructions);
    var sections = (step.brief && step.brief.sections) || [];
    var any = false;
    sections.forEach(function (group) {
      if (!group.rows.length) return;
      any = true;
      var card = el("div", { class: "acg-card" }, [
        el("div", { class: "acg-card-hd" }, [
          el("div", { class: "acg-card-title", text: group.title }),
          el("span", { class: "acg-pill", text: group.count + " due" })
        ])
      ]);
      group.rows.forEach(function (r) {
        card.appendChild(el("div", { class: "acg-row" }, [
          el("span", { class: "acg-dot", style: "--acg-dot:" + (DOTS[group.key] || "#38BDF8") }),
          el("div", { class: "acg-row-main" }, [
            el("div", { class: "acg-row-t", text: r.title }),
            r.subtitle ? el("div", { class: "acg-row-s", text: r.subtitle }) : null
          ]),
          el("div", { class: "acg-row-time", text: timeText(r) })
        ]));
      });
      body.appendChild(card);
    });
    if (!any) body.appendChild(el("div", { class: "acg-note", text: "Nothing is scheduled for this shift yet." }));
    ackRow(body, step);
  }

  function whenText(iso) {
    var d = new Date(iso);
    var today = new Date();
    var y = new Date(); y.setDate(today.getDate() - 1);
    var day = d.toDateString() === today.toDateString() ? "Today"
      : d.toDateString() === y.toDateString() ? "Yesterday"
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return day + " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function stepPrior(body, step) {
    lead(body, step.instructions);
    var items = (step.reports && step.reports.items) || [];
    items.forEach(function (r) {
      var key = step.itemKey + ":" + r.id;
      var open = !!state.open[key];
      body.appendChild(el("div", { class: "acg-card" }, [
        el("div", { class: "acg-row" }, [
          el("button", {
            class: "acg-rep", "data-open": String(open), type: "button",
            onclick: function () { state.open[key] = !open; render(); }
          }, [
            el("div", { class: "acg-rep-top" }, [
              el("span", { class: "acg-tag", "data-kind": r.kind === "incident" ? "incident" : "maintenance", text: r.kind.toUpperCase() }),
              el("span", { class: "acg-ref", text: r.ref })
            ]),
            el("div", { class: "acg-row-t", text: r.title + (r.severity ? " — " + r.severity.charAt(0).toUpperCase() + r.severity.slice(1) : "") }),
            el("div", { class: "acg-row-s", text: whenText(r.submittedAt) + (r.filedBy ? " · " + r.filedBy : "") }),
            r.summary ? el("div", { class: "acg-rep-body", text: r.summary, style: "margin-top:8px" }) : null,
            r.summary ? el("div", { class: "acg-more", text: open ? "Show less" : "Read more" }) : null
          ])
        ])
      ]));
    });
    if (!items.length) {
      var hours = (step.reports && step.reports.hours) || 24;
      body.appendChild(el("div", { class: "acg-note", text: "No reports were filed at this site in the last " + hours + " hours." }));
    }
    ackRow(body, step);
  }

  function stepChecklist(body, step) {
    lead(body, step.instructions);
    var ticks = checkedOf(step);
    if (step.items.length) {
      var required = step.items.filter(function (i) { return i.required; });
      var card = el("div", { class: "acg-card" }, [
        el("div", { class: "acg-card-hd" }, [
          el("div", { class: "acg-card-title", text: step.title }),
          el("span", { class: "acg-pill", text: countTicked(step) + " of " + required.length })
        ])
      ]);
      step.items.forEach(function (item) {
        var on = !!ticks[item.id];
        card.appendChild(el("div", { class: "acg-row" }, [
          el("button", {
            class: "acg-check", "data-on": String(on), type: "button",
            style: "background:none;border:none;padding:0",
            onclick: function () { ticks[item.id] = !on; render(); }
          }, [
            el("span", { class: "acg-box", html: ICON.check }),
            el("span", {}, [
              el("div", { class: "acg-row-t", text: item.label + (item.required ? "" : " (optional)") }),
              item.detail ? el("div", { class: "acg-row-s", text: item.detail }) : null
            ])
          ])
        ]));
      });
      body.appendChild(card);
    }
    photoBlock(body, step);
    ackRow(body, step);
  }

  function countTicked(step) {
    var ticks = checkedOf(step);
    return step.items.filter(function (i) { return i.required && ticks[i.id]; }).length;
  }

  /* ── Gating (the backend checks the same on clock-in) ──────────────────── */

  function itemsDone(step) {
    return step.items.every(function (i) { return !i.required || checkedOf(step)[i.id]; });
  }

  function stepReady() {
    var s = STEPS[state.index];
    if (!s) return true;
    if (s.ackText && !state.acks[s.itemKey]) return false;
    if (s.type === "checklist" && !itemsDone(s)) return false;
    if (s.photo && !photoOf(s).key) return false;
    return true;
  }

  function hintFor() {
    var s = STEPS[state.index];
    if (stepReady()) return "";
    var needs = [];
    if (s.type === "checklist" && !itemsDone(s)) needs.push("confirm every item");
    if (s.photo && !photoOf(s).key) needs.push("add a photo");
    if (s.ackText && !state.acks[s.itemKey]) needs.push("acknowledge");
    var text = needs.join(", ").replace(/, ([^,]*)$/, " and $1");
    return text.charAt(0).toUpperCase() + text.slice(1) + " to continue";
  }

  /* ── Render ────────────────────────────────────────────────────────────── */

  function renderNotice(u, title, text, buttonLabel) {
    u.back.dataset.hidden = "true";
    u.sub.textContent = title;
    u.count.textContent = "";
    u.fill.style.width = "0%";
    u.hint.textContent = "";
    u.next.dataset.disabled = String(!buttonLabel);
    u.next.textContent = buttonLabel || "Please wait";
    u.body.appendChild(el("div", { class: "acg-done" }, [
      el("div", { class: "acg-done-t", text: title }),
      el("div", { class: "acg-done-s", text: text })
    ]));
  }

  function render() {
    var u = build();
    u.body.textContent = "";

    if (state.status === "loading") {
      renderNotice(u, "CHECKING LOCATION", state.message || "Confirming you are at your post…", "");
      return;
    }
    if (state.status === "blocked") {
      renderNotice(u, "CANNOT CLOCK IN", state.message, "Close");
      return;
    }

    if (state.done) {
      u.back.dataset.hidden = "true";
      u.sub.textContent = "CHECKLIST COMPLETE";
      u.count.textContent = "";
      u.fill.style.width = "100%";
      u.hint.textContent = "";
      u.next.dataset.disabled = "false";
      u.next.textContent = "Go to home";
      u.body.appendChild(el("div", { class: "acg-done" }, [
        el("div", { class: "acg-done-ico", html: ICON.done }),
        el("div", { class: "acg-done-t", text: "Shift Started" }),
        el("div", {
          class: "acg-done-s",
          text: "All shift-start checks are complete. Your brief stays " +
                "available from the home screen."
        }),
        el("div", { class: "acg-done-stamp", text: stamp() })
      ]));
      return;
    }

    var s = STEPS[state.index];
    u.back.dataset.hidden = String(state.index === 0);
    u.sub.textContent = s.title.toUpperCase();
    u.count.textContent = (state.index + 1) + "/" + STEPS.length;
    u.fill.style.width = Math.round(((state.index + 1) / STEPS.length) * 100) + "%";

    if (s.type === "daily_brief") stepBrief(u.body, s);
    else if (s.type === "prior_reports") stepPrior(u.body, s);
    else stepChecklist(u.body, s);

    var ready = stepReady() && state.status !== "submitting";
    var last = state.index === STEPS.length - 1;
    u.next.dataset.disabled = String(!ready);
    u.next.textContent = state.status === "submitting" ? "Clocking in…" : last ? "Finish & Clock In" : "Continue";
    u.hint.textContent = state.error || hintFor();
    u.body.scrollTop = 0;
  }

  function stamp() {
    var d = new Date();
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  /* ── Navigation ────────────────────────────────────────────────────────── */

  function advance() {
    if (state.done || state.status === "blocked") { close(); return; }
    if (state.status !== "steps" || !stepReady()) return;
    if (state.index < STEPS.length - 1) { state.index++; render(); return; }
    submitClockIn();
  }

  function prev() {
    if (state.index === 0) return;
    state.index--;
    render();
  }

  function close() {
    if (!UI) return;
    UI.overlay.dataset.open = "false";
    /* Back to the home screen, which is where clock-in left the app. */
    setTimeout(function () { UI.body.textContent = ""; }, 260);
  }

  /* ── Backend ───────────────────────────────────────────────────────────────
   * POST /mobile/clock-in/check  → geofence result + which pages to show
   * POST /mobile/clock-in        → records the punch once the pages are done
   * Requests go through window.AlexiosAuth (alexios-auth.js) for the token.
   * ------------------------------------------------------------------------ */

  var MOCK_LOCATION_KEY = "alexios.mockLocation";   // "lat,lng" — for desk testing only

  function mockLocation() {
    try {
      var raw = localStorage.getItem(MOCK_LOCATION_KEY);
      if (!raw) return null;
      var parts = raw.split(",").map(Number);
      return isFinite(parts[0]) && isFinite(parts[1]) ? { lat: parts[0], lng: parts[1], accuracyM: 5 } : null;
    } catch (e) {
      return null;
    }
  }

  function currentLocation() {
    var mock = mockLocation();
    if (mock) return Promise.resolve(mock);
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error("This device cannot share its location."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: Math.round(pos.coords.accuracy) });
        },
        function (err) {
          reject(new Error(err.code === 1
            ? "Location permission is off. Allow location access to clock in."
            : "Could not get your location. Move to an open area and try again."));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  /** POST when a body is given, GET otherwise. Resolves to the response's `data`. */
  function api(path, body) {
    if (!window.AlexiosAuth) return Promise.reject(new Error("You are not signed in."));
    var options = body === undefined
      ? { method: "GET", headers: { "X-Client": "mobile" } }
      : { method: "POST", headers: { "Content-Type": "application/json", "X-Client": "mobile" }, body: JSON.stringify(body) };
    return window.AlexiosAuth.fetch(path, options).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (!res.ok) {
          var err = new Error((json && json.message) || "Request failed (" + res.status + ")");
          err.code = json && json.error && json.error.code;
          throw err;
        }
        return json.data;
      });
    }, function () {
      throw new Error("No connection to the server. Try again.");
    });
  }

  function newIdempotencyKey() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, function (c) {
      return (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16);
    });
  }

  function block(message) {
    state.status = "blocked";
    state.message = message;
    render();
  }

  function startClockIn() {
    state = freshState();
    build();
    render();
    setTimeout(function () { UI.overlay.dataset.open = "true"; }, 16);

    currentLocation()
      .then(function (location) {
        return api("/mobile/clock-in/check", location).then(function (result) {
          return { location: location, result: result };
        });
      })
      .then(function (r) {
        if (!r.result.canClockIn) { block(r.result.reason.message); return; }
        STEPS = stepsFrom(r.result.checklist || [], r.result.requirePhoto);
        state.clockIn = { shiftId: r.result.shift.id, location: r.location, idempotencyKey: newIdempotencyKey() };
        state.status = "steps";
        if (STEPS.length === 0) { submitClockIn(); return; }
        render();
      })
      .catch(function (err) { block(err.message); });
  }

  function submitClockIn() {
    state.status = "submitting";
    state.error = "";
    if (STEPS.length) render();
    else renderNoticeNow("CLOCKING IN", "Recording your clock-in…");

    var punchPhoto = STEPS.find(function (step) { return step.itemKey === CLOCK_IN_PHOTO; });
    var checklist = STEPS.filter(function (step) { return step !== punchPhoto; }).map(function (step) {
      var entry = { itemKey: step.itemKey };
      if (step.items.length) {
        var ticks = checkedOf(step);
        entry.checked = step.items.filter(function (i) { return ticks[i.id]; }).map(function (i) { return i.id; });
      }
      if (step.photo && photoOf(step).key) entry.photoKey = photoOf(step).key;
      return entry;
    });

    // Re-read the location: the guard may have moved while filling the pages.
    currentLocation()
      .catch(function () { return state.clockIn.location; })
      .then(function (location) {
        return api("/mobile/clock-in", {
          lat: location.lat,
          lng: location.lng,
          accuracyM: location.accuracyM,
          shiftId: state.clockIn.shiftId,
          idempotencyKey: state.clockIn.idempotencyKey,   // same key on retry → no duplicate punch
          photoKey: punchPhoto ? photoOf(punchPhoto).key || undefined : undefined,
          checklist: checklist
        });
      })
      .then(function () {
        state.status = "done";
        state.done = true;
        // On duty from now on: live-location.js opens the socket and starts GPS.
        if (window.AlexiosLiveLocation) window.AlexiosLiveLocation.onDuty();
        startBundleShift();
        render();
      })
      .catch(function (err) {
        if (err.code === "OUTSIDE_GEOFENCE" || err.code === "SHIFT_ENDED" || err.code === "NO_ACTIVE_SHIFT" || err.code === "SHIFT_NOT_FOUND") {
          block(err.message);
          return;
        }
        state.status = "steps";
        state.error = err.message;
        if (STEPS.length) render();
        else block(err.message);
      });
  }

  function renderNoticeNow(title, text) {
    var u = build();
    u.body.textContent = "";
    renderNotice(u, title, text, "");
  }

  /* ── Clock In hook ─────────────────────────────────────────────────────────
   * Capture phase: the bundle's own handler (which starts the on-duty timer)
   * only runs once the backend has accepted the clock-in.
   * ------------------------------------------------------------------------ */

  var passThrough = false;

  function clockInButton(node) {
    for (var n = node; n && n !== document.body; n = n.parentElement) {
      if (n.tagName === "BUTTON" && n.textContent.trim() === "Clock In Now") return n;
    }
    return null;
  }

  function startBundleShift() {
    var button = Array.prototype.find.call(document.querySelectorAll("button"), function (b) {
      return b.textContent.trim() === "Clock In Now";
    });
    if (!button) return;
    passThrough = true;
    button.click();
  }

  document.addEventListener("click", function (e) {
    if (!clockInButton(e.target)) return;
    if (passThrough) { passThrough = false; return; }
    e.preventDefault();
    e.stopImmediatePropagation();
    startClockIn();
  }, true);

  /* ── Restore after reload ──────────────────────────────────────────────────
   * The bundle keeps duty state in memory only, so a reload always lands on
   * "Off duty". When the home screen appears, ask GET /mobile/duty and replay
   * the bundle's own buttons to match what the backend recorded.
   * Note: the bundle's shift countdown restarts from the moment of the replay.
   * ------------------------------------------------------------------------ */

  var restoreChecked = false;

  function findButton(label) {
    return Array.prototype.find.call(document.querySelectorAll("button"), function (b) {
      return b.textContent.trim() === label;
    });
  }

  function restoreDutyState() {
    if (restoreChecked || !window.AlexiosAuth || !window.AlexiosAuth.token()) return;
    restoreChecked = true;
    api("/mobile/duty")
      .then(function (duty) {
        if (duty.state !== "on_duty" && duty.state !== "on_break") return;
        startBundleShift();
        if (duty.state === "on_break") {
          setTimeout(function () {
            // Replay through break-gate.js so it does not start a second break.
            if (window.AlexiosBreakGate) window.AlexiosBreakGate.replay("Take Break");
          }, 300);
        }
      })
      .catch(function () { restoreChecked = false; /* try again next time home renders */ });
  }

  new MutationObserver(function () {
    if (!restoreChecked && findButton("Clock In Now")) restoreDutyState();
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* Shared with the other add-ons (clockout-gate.js) so they talk to the
     backend the same way. */
  window.AlexiosMobile = {
    api: api,
    currentLocation: currentLocation,
    newIdempotencyKey: newIdempotencyKey,
    findButton: findButton
  };

  window.AlexiosClockInGate = {
    open: startClockIn, close: close,
    /** Testing: attach a File to a page (its itemKey) without the native picker. */
    attachPhoto: function (kind, file) { return attachPhoto(kind, file); },
    steps: function () { return STEPS; },
    /** Desk testing: AlexiosClockInGate.mockLocation(26.7993, 75.8184), or null to use GPS. */
    mockLocation: function (lat, lng) {
      try {
        if (lat == null) localStorage.removeItem(MOCK_LOCATION_KEY);
        else localStorage.setItem(MOCK_LOCATION_KEY, lat + "," + lng);
      } catch (e) { /* storage blocked */ }
    }
  };
})();
