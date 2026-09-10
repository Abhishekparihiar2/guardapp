/* ============================================================================
 * ALEXIOS Mobile — Shift Start Checklist (design only)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * Clock In Now runs first and is never blocked — the bundle's own handler is
 * left alone, so the shift timer starts immediately. This checklist then opens
 * over the top and the steps run one after another:
 *
 *   1. Daily Brief                  — acknowledge
 *   2. Prior Shift Reports (24h)    — one acknowledgement for the whole set
 *   3. Firearms & Duty Gear Log     — armed posts only, photo required
 *   4. Uniform & PPE Compliance     — item checks + selfie
 *
 * Finishing the last step shows a confirmation and returns to the home screen.
 *
 * DESIGN ONLY. Nothing is submitted, stored or uploaded. The camera is not
 * opened — the photo tiles switch to a captured-looking placeholder so the
 * flow can be walked through. Every value below is mock-up copy, and which
 * steps appear would come from Client & Site Module > Checklists in the
 * real build (see STEPS: the shape mirrors that config).
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

  /* Step order. In the real build this comes from the site's checklist config,
     and a step whose post does not match (gear_log on an unarmed post) is
     dropped before the run starts. */
  var STEPS = [
    { id: "brief",  type: "daily_brief",   label: "Daily Brief" },
    { id: "prior",  type: "prior_reports", label: "Prior Shift Reports" },
    { id: "gear",   type: "gear_log",      label: "Firearms & Duty Gear" },
    { id: "ppe",    type: "uniform_ppe",   label: "Uniform & PPE" }
  ];

  /* ── State (per run; nothing persists) ─────────────────────────────────── */

  var state = null;

  function freshState() {
    return {
      index: 0,
      briefAck: false,
      priorAck: false,
      priorOpen: {},
      gearPhoto: false,
      gearItems: {},
      ppeItems: {},
      ppeSelfie: false,
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

  function photoTile(shot, required, label, icon, onclick) {
    return el("button", {
      class: "acg-photo", type: "button",
      "data-shot": String(!!shot), "data-req": String(!!required && !shot),
      onclick: onclick
    }, [
      el("span", { class: "acg-photo-ico", html: icon }),
      el("span", { text: shot ? "Photo captured" : label })
    ]);
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
      state.gearPhoto, true, "Photograph your gear laid out", ICON.cam,
      function () { state.gearPhoto = !state.gearPhoto; render(); }
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
      state.ppeSelfie, true, "Take a selfie in uniform", ICON.selfie,
      function () { state.ppeSelfie = !state.ppeSelfie; render(); }
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
      return state.gearPhoto &&
        GEAR.nonLethal.every(function (_, i) { return state.gearItems[i]; });
    }
    if (s.type === "uniform_ppe") return state.ppeSelfie && countPpe() === PPE.length;
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

  function render() {
    var u = build();
    u.body.textContent = "";

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

    var ready = stepReady();
    u.next.dataset.disabled = String(!ready);
    u.next.textContent = state.index === STEPS.length - 1 ? "Finish" : "Continue";
    u.hint.textContent = hintFor();
    u.body.scrollTop = 0;
  }

  function stamp() {
    var d = new Date();
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  /* ── Navigation ────────────────────────────────────────────────────────── */

  function advance() {
    if (state.done) { close(); return; }
    if (!stepReady()) return;
    if (state.index < STEPS.length - 1) state.index++;
    else state.done = true;
    render();
  }

  function prev() {
    if (state.index === 0) return;
    state.index--;
    render();
  }

  function open() {
    state = freshState();
    build();
    render();
    setTimeout(function () { UI.overlay.dataset.open = "true"; }, 16);
  }

  function close() {
    if (!UI) return;
    UI.overlay.dataset.open = "false";
    /* Back to the home screen, which is where clock-in left the app. */
    setTimeout(function () { UI.body.textContent = ""; }, 260);
  }

  /* ── Clock In hook ─────────────────────────────────────────────────────────
   * Bubble phase, so the bundle's own handler runs first and the shift timer
   * starts before the checklist appears. The click is never cancelled.
   * ------------------------------------------------------------------------ */

  function isClockIn(node) {
    for (var n = node; n && n !== document.body; n = n.parentElement) {
      if (n.tagName === "BUTTON" && n.textContent.trim() === "Clock In Now") return true;
    }
    return false;
  }

  document.addEventListener("click", function (e) {
    if (!isClockIn(e.target)) return;
    setTimeout(open, 420);           // let the clocked-in state paint first
  }, false);

  window.AlexiosClockInGate = {
    open: open, close: close, steps: STEPS
  };
})();
