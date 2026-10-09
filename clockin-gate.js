/* ============================================================================
 * ALEXIOS Mobile — Clock In + Shift Start Checklist
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * Clock In Now is held until the backend accepts the clock-in:
 *
 *   1. Read GPS and call POST /mobile/clock-in/check. Outside the site border,
 *      before/after the shift, or already clocked in → explain and stop.
 *   2. Show only the pages the admin enabled for this guard's position
 *      (Clients & Sites → Checklists → Clock In), any of:
 *        Daily Brief · Prior Shift Reports · Firearms & Duty Gear · Uniform & PPE
 *   3. On the last page, POST /mobile/clock-in. When it succeeds the bundle's
 *      own handler runs and the home screen switches to on duty.
 *
 * Page content (brief rows, gear, PPE items) is still mock-up copy, and photos
 * are not uploaded yet — the photo tiles only mark that one was taken.
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

  /* ── Mock content ──────────────────────────────────────────────────────── */

  var BRIEF = [
    {
      title: "Tours", pill: "2 due", dot: "#3A7BFF",
      rows: [
        ["Perimeter Tour A", "12 checkpoints · Tower B exterior", "09:30"],
        ["Interior Sweep", "8 checkpoints · Floors 4–22", "14:00"]
      ]
    },
    {
      title: "Tasks", pill: "3 due", dot: "#A78BFA",
      rows: [
        ["Complete Site Opening Inspection", "Dispatch task · 3 subtasks", "08:00"],
        ["Respond to Access Control Alert", "Help desk ticket · Sector A", "09:12"],
        ["Vehicle Fuel & Mileage Log", "Recurring task", "17:00"]
      ]
    },
    {
      title: "Reports", pill: "2 due", dot: "#38BDF8",
      rows: [
        ["Hourly Activity Log", "Every hour on the hour", "Hourly"],
        ["End of Shift Summary", "Required before clock out", "17:45"]
      ]
    },
    {
      title: "Forms", pill: "1 due", dot: "#FBBF24",
      rows: [
        ["Visitor Log Reconciliation", "Standard ops form", "16:30"]
      ]
    }
  ];

  var PRIOR = [
    {
      kind: "incident", ref: "IR-260908-0044", when: "Yesterday · 4:16 PM",
      title: "Property Damage — North Perimeter Fence",
      body: "Approximately four metres of mesh cut low to the ground behind the " +
            "generator compound. No entry beyond the fence line. Temporary barrier " +
            "in place pending a maintenance callout. Night shift to keep the " +
            "compound on the patrol route until the panel is replaced."
    },
    {
      kind: "incident", ref: "IR-260908-0042", when: "Yesterday · 2:46 PM",
      title: "Suspicious Activity — Staff Entrance",
      body: "Unfamiliar male in dark hooded jacket photographing the staff entrance " +
            "and camera positions from the far side of the street. Left westbound " +
            "when approached. No vehicle observed. Description circulated to the " +
            "day shift; challenge and log if seen again."
    },
    {
      kind: "maintenance", ref: "MR-260908-0011", when: "Yesterday · 11:20 AM",
      title: "Loading Dock Door 4 — Sensor Intermittent",
      body: "Door 4 contact sensor drops off the panel intermittently, showing open " +
            "while physically closed. Contractor booked for Thursday. Until then " +
            "the door must be checked physically on every perimeter tour."
    }
  ];

  var GEAR = {
    firearm: { model: "Glock 19 Gen5", serial: "GX-44821" },
    ammo: [["3", "Magazines"], ["15", "Rounds each"], ["45", "Total rounds"]],
    nonLethal: [
      ["Taser", "X26P · Serial TX-9931", "Cartridge seated · charged"],
      ["OC Spray", "MK-4 · Serial OC-2207", "Seal intact · in date"],
      ["Baton", '21" Expandable · Serial BT-1180', "Locks and collapses cleanly"]
    ]
  };

  var PPE = [
    "Company-issued shirt and trousers",
    "Duty boots — black, polished",
    "Duty belt and holster",
    "Hi-visibility vest",
    "Photo ID badge worn and visible",
    "Radio and earpiece — tested"
  ];

  /* Screen for each checklist item the admin can enable (Clients & Sites →
     Checklists). The backend decides which of them this guard gets. */
  var SCREENS = {
    "daily-brief":   { id: "brief", type: "daily_brief",   label: "Daily Brief" },
    "shift-summary": { id: "prior", type: "prior_reports", label: "Prior Shift Reports" },
    "firearms":      { id: "gear",  type: "gear_log",      label: "Firearms & Duty Gear" },
    "uniform-ppe":   { id: "ppe",   type: "uniform_ppe",   label: "Uniform & PPE" }
  };

  /* Steps for the current run, in the order the backend returned them. */
  var STEPS = [];

  function stepsFrom(checklist) {
    return checklist
      .filter(function (item) { return SCREENS[item.itemKey]; })
      .map(function (item) {
        var screen = SCREENS[item.itemKey];
        return { id: screen.id, type: screen.type, label: screen.label, itemKey: item.itemKey };
      });
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
      briefAck: false,
      priorAck: false,
      priorOpen: {},
      photos: { gear: { key: null, previewUrl: null, uploading: false },
                selfie: { key: null, previewUrl: null, uploading: false } },
      gearItems: {},
      ppeItems: {},
      done: false
    };
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
   * (rear for gear, front for the selfie); desktops open a file picker.
   * ------------------------------------------------------------------------ */

  function choosePhoto(kind, facing) {
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
    var photo = state.photos[kind];
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

  function stepBrief(body) {
    body.appendChild(el("div", {
      class: "acg-lead",
      text: "Everything below must be completed before you clock out. " +
            "It stays available from the home screen for the rest of your shift."
    }));

    BRIEF.forEach(function (group) {
      var card = el("div", { class: "acg-card" }, [
        el("div", { class: "acg-card-hd" }, [
          el("div", { class: "acg-card-title", text: group.title }),
          el("span", { class: "acg-pill", text: group.pill })
        ])
      ]);
      group.rows.forEach(function (r) {
        card.appendChild(el("div", { class: "acg-row" }, [
          el("span", { class: "acg-dot", style: "--acg-dot:" + group.dot }),
          el("div", { class: "acg-row-main" }, [
            el("div", { class: "acg-row-t", text: r[0] }),
            el("div", { class: "acg-row-s", text: r[1] })
          ]),
          el("div", { class: "acg-row-time", text: r[2] })
        ]));
      });
      body.appendChild(card);
    });

    body.appendChild(el("div", { class: "acg-ack" }, [
      checkRow("I have read and understood today's brief.", state.briefAck, function () {
        state.briefAck = !state.briefAck;
        render();
      })
    ]));
  }

  function stepPrior(body) {
    body.appendChild(el("div", {
      class: "acg-lead",
      text: "Incident and maintenance reports filed in the last 24 hours."
    }));

    PRIOR.forEach(function (r, i) {
      var open = !!state.priorOpen[i];
      var card = el("div", { class: "acg-card" }, [
        el("div", { class: "acg-row" }, [
          el("button", {
            class: "acg-rep", "data-open": String(open), type: "button",
            onclick: function () { state.priorOpen[i] = !open; render(); }
          }, [
            el("div", { class: "acg-rep-top" }, [
              el("span", { class: "acg-tag", "data-kind": r.kind, text: r.kind.toUpperCase() }),
              el("span", { class: "acg-ref", text: r.ref })
            ]),
            el("div", { class: "acg-row-t", text: r.title }),
            el("div", { class: "acg-row-s", text: r.when }),
            el("div", { class: "acg-rep-body", text: r.body,
              style: "margin-top:8px" }),
            el("div", { class: "acg-more", text: open ? "Show less" : "Read more" })
          ])
        ])
      ]);
      body.appendChild(card);
    });

    body.appendChild(el("div", {
      class: "acg-note",
      text: "Hourly activity logs are excluded from this brief by site policy."
    }));

    body.appendChild(el("div", { class: "acg-ack" }, [
      checkRow("I have reviewed all reports from the previous 24 hours.",
        state.priorAck, function () { state.priorAck = !state.priorAck; render(); })
    ]));
  }

  function stepGear(body) {
    body.appendChild(el("div", {
      class: "acg-lead",
      text: "Pre-shift audit for this armed post. Confirm each item against " +
            "what you have been issued."
    }));

    /* Firearm + ammunition */
    var arms = el("div", { class: "acg-card" }, [
      el("div", { class: "acg-card-hd" }, [
        el("div", { class: "acg-card-title", text: "Firearm" }),
        el("span", { class: "acg-pill", text: "Armed post" })
      ]),
      el("div", { class: "acg-field" }, [
        el("div", { class: "acg-field-l", text: "Weapon" }),
        el("div", { class: "acg-field-v", text: GEAR.firearm.model }),
        el("div", { class: "acg-field-sub" }, [
          el("span", { text: "Serial " + GEAR.firearm.serial }),
          el("span", { class: "acg-issued", text: "ISSUED TO YOU" })
        ])
      ]),
      el("div", { class: "acg-field" }, [
        el("div", { class: "acg-field-l", text: "Ammunition count" }),
        el("div", { class: "acg-counts" }, GEAR.ammo.map(function (a, i) {
          return el("div", {
            class: "acg-count-box", "data-total": String(i === GEAR.ammo.length - 1)
          }, [
            el("div", { class: "acg-count-n", text: a[0] }),
            el("div", { class: "acg-count-l", text: a[1] })
          ]);
        }))
      ])
    ]);
    body.appendChild(arms);
    body.appendChild(el("button", {
      class: "acg-link", type: "button",
      text: "Serial number does not match — report a discrepancy"
    }));

    /* Non-lethal equipment */
    var nl = el("div", { class: "acg-card" }, [
      el("div", { class: "acg-card-hd" }, [
        el("div", { class: "acg-card-title", text: "Non-lethal equipment" })
      ])
    ]);
    GEAR.nonLethal.forEach(function (item, i) {
      var on = !!state.gearItems[i];
      nl.appendChild(el("div", { class: "acg-row" }, [
        el("button", {
          class: "acg-check", "data-on": String(on), type: "button",
          style: "background:none;border:none;padding:0",
          onclick: function () { state.gearItems[i] = !on; render(); }
        }, [
          el("span", { class: "acg-box", html: ICON.check }),
          el("span", {}, [
            el("div", { class: "acg-row-t", text: item[0] }),
            el("div", { class: "acg-row-s", text: item[1] }),
            el("div", { class: "acg-row-s", text: item[2] })
          ])
        ])
      ]));
    });
    body.appendChild(nl);

    body.appendChild(el("div", { class: "acg-label", text: "Gear photo" }));
    body.appendChild(photoTile(
      state.photos.gear, true, "Photograph your gear laid out", ICON.cam,
      function () { choosePhoto("gear", "environment"); }
    ));
  }

  function stepPpe(body) {
    body.appendChild(el("div", {
      class: "acg-lead",
      text: "Confirm you are in full company-issued uniform, then take a " +
            "photo for the shift record."
    }));

    var card = el("div", { class: "acg-card" }, [
      el("div", { class: "acg-card-hd" }, [
        el("div", { class: "acg-card-title", text: "Uniform & PPE" }),
        el("span", { class: "acg-pill", text: countPpe() + " of " + PPE.length })
      ])
    ]);
    PPE.forEach(function (label, i) {
      var on = !!state.ppeItems[i];
      card.appendChild(el("div", { class: "acg-row" }, [
        el("button", {
          class: "acg-check", "data-on": String(on), type: "button",
          style: "background:none;border:none;padding:0",
          onclick: function () { state.ppeItems[i] = !on; render(); }
        }, [
          el("span", { class: "acg-box", html: ICON.check }),
          el("span", { class: "acg-row-t", text: label })
        ])
      ]));
    });
    body.appendChild(card);

    body.appendChild(el("div", { class: "acg-label", text: "Compliance selfie" }));
    body.appendChild(photoTile(
      state.photos.selfie, true, "Take a selfie in uniform", ICON.selfie,
      function () { choosePhoto("selfie", "user"); }
    ));
  }

  function countPpe() {
    return PPE.filter(function (_, i) { return state.ppeItems[i]; }).length;
  }

  /* ── Gating (presentation only — nothing is enforced server-side) ──────── */

  function stepReady() {
    var s = STEPS[state.index];
    if (!s) return true;
    if (s.type === "daily_brief") return state.briefAck;
    if (s.type === "prior_reports") return state.priorAck;
    if (s.type === "gear_log") {
      return Boolean(state.photos.gear.key) &&
        GEAR.nonLethal.every(function (_, i) { return state.gearItems[i]; });
    }
    if (s.type === "uniform_ppe") return Boolean(state.photos.selfie.key) && countPpe() === PPE.length;
    return true;
  }

  function hintFor() {
    var s = STEPS[state.index];
    if (stepReady()) return "";
    if (s.type === "daily_brief" || s.type === "prior_reports") {
      return "Acknowledge to continue";
    }
    if (s.type === "gear_log") return "Confirm every item and add a photo";
    return "Confirm every item and add a selfie";
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
    u.sub.textContent = s.label.toUpperCase();
    u.count.textContent = (state.index + 1) + "/" + STEPS.length;
    u.fill.style.width = Math.round(((state.index + 1) / STEPS.length) * 100) + "%";

    if (s.type === "daily_brief") stepBrief(u.body);
    else if (s.type === "prior_reports") stepPrior(u.body);
    else if (s.type === "gear_log") stepGear(u.body);
    else if (s.type === "uniform_ppe") stepPpe(u.body);

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

  /** Server key of the photo uploaded for this page, if it needs one. */
  function photoKeyFor(step) {
    if (step.type === "gear_log") return state.photos.gear.key || undefined;
    if (step.type === "uniform_ppe") return state.photos.selfie.key || undefined;
    return undefined;
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
        STEPS = stepsFrom(r.result.checklist || []);
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

    var checklist = STEPS.map(function (step) {
      return { itemKey: step.itemKey, photoKey: photoKeyFor(step) };
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
        if (err.code === "OUTSIDE_GEOFENCE" || err.code === "SHIFT_ENDED" || err.code === "NO_ACTIVE_SHIFT") {
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
    /** Testing: attach a File to "gear" or "selfie" without the native picker. */
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
