/* ============================================================================
 * ALEXIOS Mobile — Task status + Late/Missed reasoning matrix (design only)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 *
 * 1. Every task card gains a status pill (New / In Progress / Completed /
 *    Overdue / Late / Missed / Reason submitted).
 * 2. Cards the admin has flagged Late or Missed say who flagged them and carry
 *    a SUBMIT REASON action.
 * 3. While a flagged activity has no reason, the guard is locked out of
 *    starting the next activity — tours, tasks, reports, forms and clock out.
 *    The lock screen asks for one of three reasons; Other reveals a mandatory
 *    description box. Submitting sends it to the supervisor for review.
 *
 * SOS and Comms are deliberately never locked. A guard in trouble must be able
 * to raise an alarm and reach a supervisor without filing paperwork first.
 *
 * DESIGN ONLY. Nothing is stored or sent — submitting a reason just moves the
 * card to its "awaiting review" look and lifts the lock for this session. The
 * flags below are mock-up copy; in the real build they arrive from the admin
 * portal, and the reason list would come from Client & Site Module.
 * ========================================================================== */
(function () {
  "use strict";

  var ICON = {
    warn: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    lock: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    sent: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>'
  };

  /* Admin-applied flags, keyed by task title. Mock-up copy. */
  var FLAGS = {
    "Complete Site Opening Inspection": {
      kind: "task", state: "late",
      by: "J. Morrison", at: "2h ago",
      due: "Due 08:00 · completed 09:24",
      reason: "weather"                 // already explained — awaiting review
    },
    "Respond to Access Control Alert": {
      kind: "task", state: "missed",
      by: "J. Morrison", at: "35m ago",
      due: "Due 09:30 · no activity recorded",
      reason: null                      // unexplained — this is what locks
    }
  };

  var REASONS = [
    { value: "weather", label: "Weather" },
    { value: "security_matter", label: "Responding to other Security Matter" },
    { value: "other", label: "Other" }
  ];

  /* Actions the lock blocks — starting the NEXT activity.
     SOS and Comms are absent on purpose: a guard must always be able to raise
     an alarm and reach a supervisor. The task list is absent too, because that
     is where the flagged card and its Submit reason button live — locking it
     would hide the only way out of the lock. */
  var BLOCKED = ["Start Tour", "Clock Out", "Reports", "Forms"];

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

  function unresolved() {
    return Object.keys(FLAGS).filter(function (k) { return !FLAGS[k].reason; });
  }

  function pill(state) {
    var label = state === "submitted" ? "Reason submitted" : state;
    return el("span", { class: "ats-pill", "data-s": state, text: label });
  }

  /* ── Task cards ────────────────────────────────────────────────────────── */

  /* The eyebrow is a leaf div reading "<Status> • <Type>". Its card is three
     levels up: eyebrow -> text block -> flex row -> card. */
  function eyebrows() {
    return Array.prototype.filter.call(
      document.querySelectorAll("#root div"),
      function (n) {
        return n.children.length === 0 &&
          /^(New|In Progress|Overdue|Completed)\s+•\s+/.test(n.textContent.trim());
      }
    );
  }

  function paintCards() {
    eyebrows().forEach(function (eye) {
      var titleEl = eye.nextElementSibling;
      var card = eye.parentElement && eye.parentElement.parentElement &&
                 eye.parentElement.parentElement.parentElement;
      if (!titleEl || !card) return;

      var title = titleEl.textContent.trim();
      var flag = FLAGS[title];
      var status = eye.textContent.split("•")[0].trim().toLowerCase();

      /* Which pill this card should be showing right now. */
      var want = flag
        ? (flag.reason ? "submitted" : flag.state)
        : status;

      var foot = card.querySelector("[data-ats-foot]");
      if (foot && foot.dataset.atsState === want) return;   // already correct
      if (foot) foot.remove();

      foot = el("div", { class: "ats-foot" });
      foot.dataset.atsFoot = "true";
      foot.dataset.atsState = want;
      foot.appendChild(pill(want));

      if (flag) {
        foot.appendChild(el("span", {
          class: "ats-flag",
          text: flag.reason
            ? "Sent to supervisor · " + flag.at
            : "Flagged by " + flag.by + " · " + flag.at
        }));
        if (!flag.reason) {
          foot.appendChild(el("button", {
            class: "ats-act", type: "button", text: "Submit reason",
            onclick: function (e) {
              e.preventDefault();
              e.stopPropagation();
              openLock(title);
            }
          }));
        }
      }

      card.appendChild(foot);
    });
  }

  /* ── Home banner ───────────────────────────────────────────────────────── */

  function paintBanner() {
    var pending = unresolved();
    var existing = document.querySelector("[data-ats-banner]");

    /* Only on the home screen, which is the one carrying the shift card.
       That screen lays its cards out in a grid, so the banner has to be a
       direct grid child spanning every column — otherwise it takes a single
       narrow tile slot. */
    var label = null;
    var divs = document.querySelectorAll("#root div[style]");
    for (var i = 0; i < divs.length; i++) {
      if (divs[i].children.length === 0 &&
          divs[i].textContent.trim() === "SCHEDULED TOUR") { label = divs[i]; break; }
    }

    var anchor = null, grid = null;
    for (var up = label; up && up.parentElement; up = up.parentElement) {
      if (getComputedStyle(up.parentElement).display === "grid") {
        anchor = up; grid = up.parentElement; break;
      }
    }

    if (!pending.length || !grid) { if (existing) existing.remove(); return; }
    if (existing && existing.parentElement === grid) return;
    if (existing) existing.remove();

    var n = pending.length;
    var banner = el("div", {
      class: "ats-banner",
      onclick: function () { openLock(pending[0]); }
    }, [
      el("span", { class: "ats-banner-ico", html: ICON.warn }),
      el("div", { class: "ats-banner-txt" }, [
        el("div", {
          class: "ats-banner-t",
          text: n + (n === 1 ? " activity needs a reason" : " activities need a reason")
        }),
        el("div", {
          class: "ats-banner-s",
          text: "Next activity is locked until this is submitted."
        })
      ]),
      el("span", { class: "ats-banner-go", html: ICON.chev })
    ]);
    banner.dataset.atsBanner = "true";
    banner.style.gridColumn = "1 / -1";
    grid.insertBefore(banner, anchor);
  }

  /* ── Lock screen ───────────────────────────────────────────────────────── */

  var UI = null;
  var draft = { title: null, reason: null, note: "", sent: false };

  function build() {
    if (UI) return UI;

    var head = el("div", { class: "ats-lock-head" }, [
      el("div", { class: "ats-lock-ico", html: ICON.lock }),
      el("div", { class: "ats-lock-t", text: "Reason Required" }),
      el("div", {
        class: "ats-lock-s",
        text: "This activity was flagged by your supervisor. " +
              "The next activity stays locked until you submit a reason."
      })
    ]);
    var body = el("div", { class: "ats-lock-body" });
    var submit = el("button", { class: "ats-submit", type: "button", onclick: send });
    var hint = el("div", { class: "ats-lock-hint" });
    var foot = el("div", { class: "ats-lock-foot" }, [submit, hint]);

    var lock = el("div", { class: "ats-lock", "data-open": "false" },
      [head, body, foot]);
    document.body.appendChild(lock);

    UI = { lock: lock, head: head, body: body, submit: submit,
           hint: hint, foot: foot };
    return UI;
  }

  function render() {
    var u = build();
    u.body.textContent = "";

    if (draft.sent) {
      u.head.style.display = "none";
      u.submit.dataset.disabled = "false";
      u.submit.textContent = "Continue";
      u.hint.textContent = "";
      u.body.appendChild(el("div", { class: "ats-sent" }, [
        el("div", { class: "ats-sent-ico", html: ICON.sent }),
        el("div", { class: "ats-sent-t", text: "Sent for review" }),
        el("div", {
          class: "ats-sent-s",
          text: "Your supervisor will review the reason. " +
                "You can carry on with your shift."
        })
      ]));
      return;
    }

    u.head.style.display = "";
    var flag = FLAGS[draft.title] || {};

    u.body.appendChild(el("div", { class: "ats-subject" }, [
      el("div", { class: "ats-subject-top" }, [
        el("span", { class: "ats-kind", text: (flag.kind || "task") + " flagged" }),
        pill(flag.state || "late")
      ]),
      el("div", { class: "ats-subject-t", text: draft.title || "" }),
      el("div", { class: "ats-subject-m", text: flag.due || "" }),
      el("div", {
        class: "ats-subject-m",
        text: "Flagged by " + (flag.by || "") + " · " + (flag.at || "")
      })
    ]));

    u.body.appendChild(el("div", { class: "ats-label", text: "Select a reason" }));

    REASONS.forEach(function (r) {
      u.body.appendChild(el("button", {
        class: "ats-opt", "data-on": String(draft.reason === r.value),
        type: "button",
        onclick: function () { draft.reason = r.value; render(); }
      }, [
        el("span", { class: "ats-radio" }),
        el("span", { text: r.label })
      ]));
    });

    /* Other is the only reason that asks for detail. */
    if (draft.reason === "other") {
      var ta = el("textarea", {
        class: "ats-textarea",
        placeholder: "Describe what happened…"
      });
      ta.value = draft.note;
      ta.addEventListener("input", function () {
        draft.note = ta.value;
        var ok = ready();
        UI.submit.dataset.disabled = String(!ok);
        UI.hint.textContent = ok ? "" : "A description is required for Other";
      });
      u.body.appendChild(el("div", { class: "ats-other" }, [
        el("div", { class: "ats-label", text: "Description" }),
        ta,
        el("div", { class: "ats-req", text: "Required" })
      ]));
    }

    var ok = ready();
    u.submit.dataset.disabled = String(!ok);
    u.submit.textContent = "Submit to supervisor";
    u.hint.textContent = ok ? ""
      : (draft.reason === "other" ? "A description is required for Other"
                                  : "Select a reason to continue");
  }

  function ready() {
    if (!draft.reason) return false;
    if (draft.reason === "other") return draft.note.trim().length > 0;
    return true;
  }

  function send() {
    if (draft.sent) { close(); return; }
    if (!ready()) return;
    if (FLAGS[draft.title]) FLAGS[draft.title].reason = draft.reason;
    draft.sent = true;
    render();
  }

  function openLock(title) {
    var pending = unresolved();
    draft = {
      title: title || pending[0],
      reason: null, note: "", sent: false
    };
    if (!draft.title) return;
    build();
    render();
    setTimeout(function () { UI.lock.dataset.open = "true"; }, 16);
  }

  function close() {
    if (!UI) return;
    UI.lock.dataset.open = "false";
    setTimeout(function () { UI.body.textContent = ""; apply(); }, 240);
  }

  /* ── The lock itself ───────────────────────────────────────────────────────
   * Capture phase, so the block lands before the bundle's own handler. SOS and
   * Comms are not in BLOCKED and stay reachable at all times.
   * ------------------------------------------------------------------------ */

  function blockedLabel(node) {
    for (var n = node; n && n !== document.body; n = n.parentElement) {
      var t = (n.textContent || "").trim();
      for (var i = 0; i < BLOCKED.length; i++) {
        if (t === BLOCKED[i] || t.indexOf(BLOCKED[i]) === 0) {
          if (n.tagName === "BUTTON" || n.getAttribute("style")) return BLOCKED[i];
        }
      }
    }
    return null;
  }

  document.addEventListener("click", function (e) {
    if (!unresolved().length) return;
    if (UI && UI.lock.dataset.open === "true") return;
    if (e.target.closest && e.target.closest(".ats-lock, .ats-banner, .ats-act")) return;
    if (!blockedLabel(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    openLock(null);
  }, true);

  /* ── Repaint ───────────────────────────────────────────────────────────── */

  function apply() {
    paintCards();
    paintBanner();
  }

  function start() {
    var root = document.getElementById("root");
    if (!root) { setTimeout(start, 300); return; }
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; apply(); }, 70);
    }).observe(root, { childList: true, subtree: true });
    apply();
  }

  window.AlexiosTaskStatus = {
    apply: apply, open: openLock, flags: FLAGS, reasons: REASONS
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
