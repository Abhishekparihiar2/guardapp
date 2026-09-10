/* ============================================================================
 * ALEXIOS Mobile — Shift Tasks section (design only)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * Splits the Tasks screen into two sections:
 *
 *   SHIFT TASKS   — pinned first, one card for the current shift, on a teal
 *                   accent so it reads as a different class of work. Tapping
 *                   it opens the shift details plus the shift's own task list,
 *                   each row tickable the same way other tasks are completed.
 *   OTHER TASKS   — the bundle's existing cards, untouched, below.
 *
 * The injected block is a sibling placed BEFORE the bundle's list container,
 * never a child of it — React reconciles that list by index, so inserting into
 * it risks the wrong node being removed on the next render.
 *
 * DESIGN ONLY. Nothing is stored or sent. Ticking a task updates the card's
 * progress for this session only, and the shift below is mock-up copy.
 * ========================================================================== */
(function () {
  "use strict";

  var ICON = {
    back: '<svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.5 15.5L1.5 8.5L8.5 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chev: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    file: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    down: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>'
  };

  /* Mock-up copy. In the real build this is the guard's active shift.
     `fields` mirrors the shift record the admin fills in; `half` marks the
     short ones that pair up two-per-row on a phone. */
  var SHIFT = {
    title: "Day Shift — Tower B",
    site: "Ritz-Carlton Tower B",
    post: "Floors 4–22 · Interior & Perimeter",
    window: "09:00 AM – 06:00 PM",
    status: "On duty",

    fields: [
      { label: "Shift date", value: "09/10/2026", half: true },
      { label: "All day", value: false, bool: true, half: true },
      { label: "Start time", value: "09:00 AM", half: true },
      { label: "End time", value: "06:00 PM", half: true },
      { label: "Shift title", value: "Day Shift — Tower B" },
      { label: "Position / job", value: "Armed Security Officer", half: true },
      { label: "Assigned employee", value: "Michael Lambros · OFF-1024", half: true },
      { label: "Site / location", value: "Ritz-Carlton Tower B · Floors 4–22" }
    ],

    description:
      "Maintain interior and perimeter coverage for Floors 4–22. Perimeter " +
      "Tour A runs at 09:30 and the interior sweep at 14:00. Loading dock " +
      "door 4 has a faulty contact sensor — check it physically on every " +
      "tour until the contractor attends. Escalate any access-control alert " +
      "to the control room before responding.",

    attachment: { name: "Tower-B-Post-Orders-v4.pdf", meta: "PDF · 1.2 MB" },

    tasks: [
      ["Site opening walk-through", "All access points and alarms", "09:00", true],
      ["Radio check with control room", "Confirm channel 4 clear", "09:15", true],
      ["Perimeter Tour A", "12 checkpoints · exterior", "09:30", false],
      ["Visitor log reconciliation", "Match badges against register", "12:00", false],
      ["Interior sweep — Floors 4–22", "8 checkpoints", "14:00", false],
      ["Loading dock door 4 physical check", "Sensor fault — check by hand", "16:00", false],
      ["End of shift summary", "Required before clock out", "17:45", false]
    ]
  };

  /* Completion state for this session only. */
  var done = SHIFT.tasks.map(function (t) { return t[3]; });

  /* ── DOM helper ────────────────────────────────────────────────────────── */

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

  function doneCount() {
    return done.filter(Boolean).length;
  }

  function sectionHead(tone, label, count) {
    return el("div", { class: "ash-head", "data-tone": tone }, [
      el("span", { class: "ash-head-t", text: label }),
      el("span", { class: "ash-head-rule" }),
      count != null ? el("span", { class: "ash-head-n", text: count }) : null
    ]);
  }

  /* ── Injected section ──────────────────────────────────────────────────── */

  /* The bundle's task list: a flex column of status-eyebrow cards. */
  function taskList() {
    var eyes = Array.prototype.filter.call(
      document.querySelectorAll("#root div"),
      function (n) {
        return n.children.length === 0 &&
          /^(New|In Progress|Overdue|Completed)\s+•\s+/.test(n.textContent.trim());
      }
    );
    if (!eyes.length) return null;
    var card = eyes[0].parentElement && eyes[0].parentElement.parentElement &&
               eyes[0].parentElement.parentElement.parentElement;
    return card ? { list: card.parentElement, count: eyes.length } : null;
  }

  function shiftCard() {
    var n = doneCount(), total = SHIFT.tasks.length;
    return el("button", {
      class: "ash-card", type: "button", onclick: open
    }, [
      el("div", { class: "ash-card-top" }, [
        el("div", { class: "ash-eyebrow", text: "On Duty • Shift Tasks" }),
        el("div", { class: "ash-time", text: SHIFT.window })
      ]),
      el("div", { class: "ash-title", text: SHIFT.title }),
      el("div", { class: "ash-site", text: SHIFT.site + " · " + SHIFT.post }),
      el("div", { class: "ash-prog" }, [
        el("div", { class: "ash-prog-bar" }, [
          el("div", {
            class: "ash-prog-fill",
            style: "width:" + Math.round((n / total) * 100) + "%"
          })
        ]),
        el("div", { class: "ash-prog-n", text: n + "/" + total })
      ]),
      el("div", { class: "ash-card-go" }, [
        el("span", {
          class: "ash-card-hint",
          text: n === total
            ? "All shift tasks complete"
            : (total - n) + " remaining · tap for shift details"
        }),
        el("span", { class: "ash-card-chev", html: ICON.chev })
      ])
    ]);
  }

  function paint() {
    var found = taskList();
    var existing = document.querySelector("[data-ash-block]");

    if (!found) { if (existing) existing.remove(); return; }

    var signature = doneCount() + "/" + found.count;
    if (existing && existing.dataset.ashSig === signature &&
        existing.nextElementSibling === found.list) return;
    if (existing) existing.remove();

    var block = el("div", { class: "ash-block" }, [
      sectionHead("shift", "Shift Tasks", null),
      shiftCard(),
      sectionHead("other", "Other Tasks", String(found.count))
    ]);
    block.dataset.ashBlock = "true";
    block.dataset.ashSig = signature;

    found.list.parentElement.insertBefore(block, found.list);
  }

  /* ── Detail overlay ────────────────────────────────────────────────────── */

  var UI = null;

  function build() {
    if (UI) return UI;

    var body = el("div", { class: "ash-ov-body" });
    var btn = el("button", { class: "ash-done-btn", type: "button", onclick: close });
    var hint = el("div", { class: "ash-foot-hint" });

    var overlay = el("div", { class: "ash-overlay", "data-open": "false" }, [
      el("div", { class: "ash-ov-head" }, [
        el("button", {
          class: "ash-back", type: "button", "aria-label": "Back",
          html: ICON.back, onclick: close
        }),
        el("div", { class: "ash-ov-txt" }, [
          el("div", { class: "ash-ov-t", text: "Shift Tasks" }),
          el("div", { class: "ash-ov-s", text: SHIFT.window })
        ]),
        el("div", { class: "ash-ov-sp" })
      ]),
      body,
      el("div", { class: "ash-ov-foot" }, [btn, hint])
    ]);

    document.body.appendChild(overlay);
    UI = { overlay: overlay, body: body, btn: btn, hint: hint };
    return UI;
  }

  function render() {
    var u = build();
    u.body.textContent = "";

    /* Shift details — the admin's shift record, read-only here. */
    var grid = el("div", { class: "ash-grid" });
    /* Track the column as we go. A full-width field resets to the left, so
       CSS nth-child parity cannot be trusted for the vertical divider. */
    var col = 0;
    SHIFT.fields.forEach(function (f, i) {
      var value = f.bool
        ? el("span", {
            class: "ash-bool", "data-on": String(!!f.value),
            text: f.value ? "Yes" : "No"
          })
        : el("div", { class: "ash-cell-v", text: f.value });

      var next = SHIFT.fields[i + 1];
      var isLeftOfPair = f.half && col === 0 && next && next.half;

      grid.appendChild(el("div", {
        class: "ash-cell",
        "data-half": String(!!f.half),
        "data-divide": String(!!isLeftOfPair)
      }, [
        el("div", { class: "ash-cell-l", text: f.label }),
        value
      ]));

      col = f.half ? (col === 0 ? 1 : 0) : 0;
    });

    u.body.appendChild(el("div", { class: "ash-label", text: "Shift details" }));
    u.body.appendChild(el("div", { class: "ash-details" }, [
      el("div", { class: "ash-det-hd" }, [
        el("div", { class: "ash-det-site", text: SHIFT.site }),
        el("div", { class: "ash-det-post", text: SHIFT.post }),
        el("span", { class: "ash-det-badge", text: SHIFT.status })
      ]),
      grid
    ]));

    /* Description / instructions, with the post orders attached. */
    u.body.appendChild(el("div", {
      class: "ash-label", text: "Description / instructions"
    }));
    u.body.appendChild(el("div", { class: "ash-desc" }, [
      el("p", { class: "ash-desc-p", text: SHIFT.description }),
      SHIFT.attachment ? el("div", { class: "ash-file" }, [
        el("span", { class: "ash-file-ico", html: ICON.file }),
        el("div", { class: "ash-file-main" }, [
          el("div", { class: "ash-file-n", text: SHIFT.attachment.name }),
          el("div", { class: "ash-file-m", text: SHIFT.attachment.meta })
        ]),
        el("button", {
          class: "ash-file-dl", type: "button",
          "aria-label": "Download " + SHIFT.attachment.name,
          html: ICON.down
        })
      ]) : null
    ]));

    /* Shift tasks */
    var n = doneCount(), total = SHIFT.tasks.length;
    u.body.appendChild(el("div", {
      class: "ash-label",
      text: "Shift tasks · " + n + " of " + total + " complete"
    }));

    var list = el("div", { class: "ash-tasks" });
    SHIFT.tasks.forEach(function (t, i) {
      list.appendChild(el("button", {
        class: "ash-task", "data-done": String(!!done[i]), type: "button",
        onclick: function () { done[i] = !done[i]; render(); paint(); }
      }, [
        el("span", { class: "ash-box", html: ICON.check }),
        el("div", { class: "ash-task-main" }, [
          el("div", { class: "ash-task-t", text: t[0] }),
          el("div", { class: "ash-task-s", text: t[1] })
        ]),
        el("div", { class: "ash-task-time", text: t[2] })
      ]));
    });
    u.body.appendChild(list);

    u.btn.textContent = n === total ? "All complete — back to tasks" : "Back to tasks";
    u.hint.textContent = n === total ? "" : (total - n) + " task" +
      (total - n === 1 ? "" : "s") + " still to complete";
    u.body.scrollTop = 0;
  }

  function open() {
    build();
    render();
    setTimeout(function () { UI.overlay.dataset.open = "true"; }, 16);
  }

  function close() {
    if (!UI) return;
    UI.overlay.dataset.open = "false";
    paint();
  }

  /* ── Repaint ───────────────────────────────────────────────────────────── */

  function start() {
    var root = document.getElementById("root");
    if (!root) { setTimeout(start, 300); return; }
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; paint(); }, 70);
    }).observe(root, { childList: true, subtree: true });
    paint();
  }

  window.AlexiosShiftTasks = { paint: paint, open: open, shift: SHIFT };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
