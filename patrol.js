/* ============================================================================
 * ALEXIOS Mobile — Tours, Tasks & checkpoint scanning
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 * Reuses the Shift Start overlay styles (clockin-gate.css) plus patrol.css,
 * and the backend helpers clockin-gate.js exposes as window.AlexiosMobile.
 *
 * Entry points (the bundle's own screens are mock-ups, so these open real ones):
 *   Active Tour card → VIEW ALL / START TOUR / RESUME TOUR → my tours
 *   Today's Task tile                                       → my tasks
 *
 * Backend:
 *   GET  /mobile/tours, /mobile/tours/:id      tours on my shifts + stop progress
 *   GET  /mobile/tasks, /mobile/tasks/:id      my tasks + subtask/checkpoint progress
 *   POST /mobile/checkpoints/scan              NFC / QR scan (on duty only)
 *   POST /mobile/tasks/:id/items/:item/toggle  tick a subtask (on duty only)
 *   POST /mobile/tasks/:id/complete            complete (on duty, all done + scanned)
 *
 * Anyone can look; scanning, ticking and completing need the guard clocked in.
 * The scanner uses Web NFC / the camera where the browser supports them and
 * always offers typing the checkpoint's code.
 * ========================================================================== */
(function () {
  "use strict";

  var ICON = {
    back: '<svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.5 15.5L1.5 8.5L8.5 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
  };

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

  function hhmm(iso) {
    return iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";
  }

  /** Shift windows arrive as site wall-clock "YYYY-MM-DDTHH:mm". */
  function wallHhmm(value) { return String(value || "").slice(11, 16); }

  function progressBar(done, total) {
    var pct = total ? Math.round((done / total) * 100) : 0;
    return el("div", { class: "apt-progress" }, [el("span", { style: "width:" + pct + "%" })]);
  }

  function notice(text, kind) { return el("div", { class: "apt-notice", "data-kind": kind || "warn", text: text }); }

  function methodLabel(methods) {
    return (methods || []).map(function (m) { return m === "nfc" ? "NFC" : "QR"; }).join(" / ") || "Code";
  }

  /* ── Overlay with a small screen stack ─────────────────────────────────── */

  var UI = null;
  var stack = [];          // [{ title, render(body, foot) , onShow }]
  var flash = null;        // one-off message shown on the next render { text, kind }

  function build() {
    if (UI) return UI;
    var back = el("button", { class: "acg-back", type: "button", "aria-label": "Back", html: ICON.back, onclick: pop });
    var title = el("div", { class: "acg-title" });
    var sub = el("div", { class: "acg-sub" });
    var body = el("div", { class: "acg-body" });
    var foot = el("div", { class: "acg-foot" });
    var overlay = el("div", { class: "acg-overlay", "data-open": "false", "data-flow": "patrol" }, [
      el("div", { class: "acg-head" }, [el("div", { class: "acg-head-row" }, [back, el("div", { class: "acg-head-txt" }, [title, sub])])]),
      body,
      foot
    ]);
    document.body.appendChild(overlay);
    UI = { overlay: overlay, back: back, title: title, sub: sub, body: body, foot: foot };
    return UI;
  }

  function push(screen) {
    build();
    stack.push(screen);
    UI.overlay.dataset.open = "true";
    show();
  }

  function pop() {
    stack.pop();
    if (!stack.length) { UI.overlay.dataset.open = "false"; return; }
    show();
  }

  /** Loads and renders the top screen; `data` skips the load when a write already returned it. */
  function show(data) {
    var screen = stack[stack.length - 1];
    UI.title.textContent = screen.title;
    UI.sub.textContent = screen.sub || "";
    if (data === undefined) {
      UI.body.textContent = "";
      UI.foot.textContent = "";
      UI.foot.style.display = "none";
      UI.body.appendChild(el("div", { class: "acg-lead", text: "Loading…" }));
    }
    var load = data === undefined ? screen.load() : Promise.resolve(data);
    load.then(function (result) {
      if (stack[stack.length - 1] !== screen) return;   // navigated away meanwhile
      var keepScroll = data === undefined ? 0 : UI.body.scrollTop;
      UI.body.textContent = "";
      UI.foot.textContent = "";
      UI.foot.style.display = "none";
      if (flash) { UI.body.appendChild(notice(flash.text, flash.kind)); flash = null; }
      screen.render(UI.body, UI.foot, result);
      UI.body.scrollTop = keepScroll;
    }).catch(function (err) {
      UI.body.textContent = "";
      UI.body.appendChild(notice(err.message, "error"));
    });
  }

  function refresh(message, kind, data) {
    if (message) flash = { text: message, kind: kind };
    show(data);
  }

  /* One write at a time: taps made while a request is in flight would act on
     what is still on screen (e.g. ticking the same subtask twice). */
  var busy = false;

  function write(request, onDone) {
    if (busy) return;
    busy = true;
    UI.overlay.style.pointerEvents = "none";
    UI.overlay.style.opacity = "0.85";
    request.then(onDone, function (err) { refresh(err.message, "error"); }).then(function () {
      busy = false;
      UI.overlay.style.pointerEvents = "";
      UI.overlay.style.opacity = "";
    });
  }

  function footButton(label, enabled, onclick) {
    UI.foot.style.display = "";
    UI.foot.appendChild(el("button", {
      class: "acg-next", type: "button", "data-disabled": String(!enabled), text: label,
      onclick: enabled ? onclick : null
    }));
  }

  /* ── Tours ─────────────────────────────────────────────────────────────── */

  function toursScreen() {
    return {
      title: "PATROL TOURS",
      sub: "TOURS ON YOUR SHIFTS",
      load: function () { return mobile().api("/mobile/tours"); },
      render: function (body, foot, tours) {
        if (!tours.length) { body.appendChild(el("div", { class: "acg-lead", text: "No tours are assigned to your shifts right now." })); return; }
        var list = el("div", { class: "apt-stack" });
        tours.forEach(function (tour) {
          var p = tour.progress;
          list.appendChild(el("button", { class: "apt-tap", type: "button", onclick: function () { push(tourScreen(tour.id)); } }, [
            el("div", { class: "acg-card" }, [
              el("div", { class: "acg-row" }, [
                el("div", { class: "acg-row-main" }, [
                  el("div", { class: "apt-state", "data-s": tour.state, text: tour.state.replace("_", " ") + (tour.isCurrentShift ? " · current shift" : "") }),
                  el("div", { class: "acg-row-t", text: tour.name }),
                  el("div", { class: "apt-meta" }, [
                    el("span", { text: tour.site.name }),
                    el("span", { text: wallHhmm(tour.window.start) + " – " + wallHhmm(tour.window.end) }),
                    el("span", { text: p.scanned + " of " + p.total + " checkpoints" }),
                    el("span", { text: tour.orderMode === "sequential" ? "In order" : "Any order" })
                  ]),
                  progressBar(p.scanned, p.total)
                ])
              ])
            ])
          ]));
        });
        body.appendChild(list);
      }
    };
  }

  function tourScreen(id) {
    var screen = {
      title: "TOUR",
      load: function () { return mobile().api("/mobile/tours/" + encodeURIComponent(id)); },
      render: function (body, foot, tour) {
        screen.title = tour.name.toUpperCase();
        UI.title.textContent = screen.title;
        UI.sub.textContent = tour.progress.scanned + " OF " + tour.progress.total + " SCANNED";

        if (!tour.canScan) {
          body.appendChild(notice(tour.isCurrentShift ? "Clock in to scan checkpoints. You can still view the tour." : "This tour is on another shift. You can view it but not scan.", "warn"));
        }
        if (tour.state === "completed") body.appendChild(notice("Tour complete. Every required checkpoint is scanned.", "ok"));
        if (tour.instructions) body.appendChild(el("div", { class: "acg-lead", text: tour.instructions }));

        var card = el("div", { class: "acg-card" });
        tour.stops.forEach(function (stop) {
          var right = stop.status === "scanned"
            ? el("span", { class: "apt-done-tag", text: "✓ " + hhmm(stop.scannedAt) })
            : el("button", {
                class: "apt-scan-btn", type: "button", disabled: !tour.canScan,
                text: "Scan",
                onclick: function () { scanFor({ title: "Scan " + stop.name, methods: stop.methods }); }
              });
          card.appendChild(el("div", { class: "apt-stop", "data-s": stop.status }, [
            el("span", { class: "apt-dot", "data-s": stop.status }),
            el("div", { class: "acg-row-main" }, [
              el("div", { class: "acg-row-t", text: stop.sequenceNo + ". " + stop.name }),
              el("div", { class: "apt-method", text: methodLabel(stop.methods) + (stop.status === "next" ? " · next" : "") + (stop.required ? "" : " · optional") })
            ]),
            right
          ]));
        });
        body.appendChild(card);

        if (tour.next && tour.canScan) {
          var next = tour.stops.find(function (s) { return s.checkpointId === tour.next.checkpointId; });
          footButton("Scan " + tour.next.name + " (" + methodLabel(next && next.methods) + ")", true, function () {
            scanFor({ title: "Scan " + tour.next.name, methods: next ? next.methods : ["nfc", "qr"] });
          });
        }
      }
    };
    return screen;
  }

  /* ── Tasks ─────────────────────────────────────────────────────────────── */

  function tasksScreen() {
    return {
      title: "TASKS",
      sub: "ASSIGNED TO YOU",
      load: function () {
        return mobile().api("/mobile/tasks").then(setPending);
      },
      render: function (body, foot, tasks) {
        if (!tasks.length) { body.appendChild(el("div", { class: "acg-lead", text: "You have no tasks right now." })); return; }
        var list = el("div", { class: "apt-stack" });
        tasks.forEach(function (task) {
          var p = task.progress;
          var total = p.itemsTotal + p.checkpointsTotal;
          var done = p.itemsDone + p.checkpointsDone;
          list.appendChild(el("button", { class: "apt-tap", type: "button", onclick: function () { push(taskScreen(task.id)); } }, [
            el("div", { class: "acg-card" }, [
              el("div", { class: "acg-row" }, [
                el("div", { class: "acg-row-main" }, [
                  el("div", { class: "apt-state", "data-s": task.status, text: task.status + " · " + task.kindLabel }),
                  el("div", { class: "acg-row-t", text: task.title }),
                  el("div", { class: "apt-meta" }, [
                    task.site ? el("span", { text: task.site.name }) : null,
                    task.dueAt ? el("span", { text: "Due " + new Date(task.dueAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) }) : null,
                    p.itemsTotal ? el("span", { text: p.itemsDone + "/" + p.itemsTotal + " subtasks" }) : null,
                    p.checkpointsTotal ? el("span", { text: p.checkpointsDone + "/" + p.checkpointsTotal + " scans" }) : null
                  ]),
                  total ? progressBar(done, total) : null
                ])
              ])
            ])
          ]));
        });
        body.appendChild(list);
      }
    };
  }

  function taskScreen(id) {
    var screen = {
      title: "TASK",
      load: function () { return mobile().api("/mobile/tasks/" + encodeURIComponent(id)); },
      render: function (body, foot, task) {
        UI.title.textContent = task.title.toUpperCase();
        UI.sub.textContent = (task.status + " · " + task.kindLabel).toUpperCase();
        var completed = task.status === "Completed";

        if (completed) body.appendChild(notice("Task completed" + (task.completedAt ? " at " + hhmm(task.completedAt) : "") + ".", "ok"));
        else if (!task.canEdit) body.appendChild(notice("Clock in to work on this task. You can still view it.", "warn"));
        if (task.description) body.appendChild(el("div", { class: "acg-lead", text: task.description }));

        if (task.items.length) {
          body.appendChild(el("div", { class: "acg-label", text: "Checklist" }));
          task.items.forEach(function (item) {
            body.appendChild(el("button", {
              class: "acg-check", type: "button", "data-on": String(item.done), disabled: !task.canEdit,
              onclick: task.canEdit ? function () { toggleItem(task.id, item.id); } : null
            }, [el("span", { class: "acg-box", html: ICON.check }), el("span", { text: item.label })]));
          });
        }

        if (task.checkpoints.length) {
          body.appendChild(el("div", { class: "acg-label", text: "Checkpoints to scan" }));
          var card = el("div", { class: "acg-card" });
          task.checkpoints.forEach(function (cp) {
            var right = cp.scanned
              ? el("span", { class: "apt-done-tag", text: "✓ " + hhmm(cp.scannedAt) })
              : cp.configured
                ? el("button", {
                    class: "apt-scan-btn", type: "button", disabled: !task.canEdit, text: "Scan",
                    onclick: function () { scanFor({ title: "Scan " + cp.name, methods: ["nfc", "qr"], taskId: task.id }); }
                  })
                : el("span", { class: "apt-method", text: "Not set up" });
            card.appendChild(el("div", { class: "apt-stop", "data-s": cp.scanned ? "scanned" : "pending" }, [
              el("span", { class: "apt-dot", "data-s": cp.scanned ? "scanned" : "pending" }),
              el("div", { class: "acg-row-main" }, [el("div", { class: "acg-row-t", text: cp.name }), el("div", { class: "apt-method", text: cp.code })]),
              right
            ]));
          });
          body.appendChild(card);
        }

        if (!completed && task.blockers.length && task.canEdit) {
          body.appendChild(el("ul", { class: "apt-blockers" }, task.blockers.map(function (b) { return el("li", { text: b.message }); })));
        }
        if (!completed) {
          footButton(task.canComplete ? "Complete Task" : (task.blockers[0] ? task.blockers[0].message : "Complete Task"), task.canComplete, function () {
            completeTask(task.id);
          });
        }
      }
    };
    return screen;
  }

  /* Both endpoints return the updated task, so the screen re-renders from it directly. */

  function toggleItem(taskId, itemId) {
    write(api("/mobile/tasks/" + encodeURIComponent(taskId) + "/items/" + encodeURIComponent(itemId) + "/toggle", {}), function (task) {
      refresh(null, null, task);
    });
  }

  function completeTask(taskId) {
    write(api("/mobile/tasks/" + encodeURIComponent(taskId) + "/complete", {}), function (task) {
      refreshPending();
      refresh("Task completed. Your supervisor can see it on the task board.", "ok", task);
    });
  }

  /* ── Scanner ───────────────────────────────────────────────────────────────
   * Web NFC (Chrome on Android) reads the tag; BarcodeDetector + camera reads
   * QR codes where available; typing the code always works.
   * ------------------------------------------------------------------------ */

  var sheet = null;
  var stopActive = null;   // cleans up a running NFC / camera reader

  function closeSheet() {
    if (stopActive) { stopActive(); stopActive = null; }
    if (sheet) sheet.dataset.open = "false";
  }

  function sendScan(method, value, opts) {
    closeSheet();
    var request = mobile().currentLocation().catch(function () { return {}; }).then(function (where) {
      return api("/mobile/checkpoints/scan", {
        idempotencyKey: mobile().newIdempotencyKey(),
        method: method,
        value: value,
        taskId: opts.taskId,
        lat: where.lat,
        lng: where.lng
      });
    });
    write(request, function (result) {
      var s = result.scan;
      // A rejected scan's message already says what to do; only accepted ones get the "next" hint.
      var extra = s.matched && result.tour
        ? (result.tour.complete ? " Tour complete!" : result.tour.next ? " Next: " + result.tour.next.name + "." : "")
        : "";
      refresh((s.message || (s.matched ? "Scanned" : "Not accepted")) + "." + extra, s.matched ? "ok" : "error");
    });
  }

  function scanFor(opts) {
    if (!sheet) {
      sheet = el("div", { class: "apt-sheet", "data-open": "false", onclick: function (e) { if (e.target === sheet) closeSheet(); } });
      document.body.appendChild(sheet);
    }
    var methods = opts.methods && opts.methods.length ? opts.methods : ["nfc", "qr"];
    var card = el("div", { class: "apt-sheet-card" });
    sheet.textContent = "";
    sheet.appendChild(card);
    sheet.dataset.open = "true";

    card.appendChild(el("div", { class: "apt-sheet-title", text: opts.title }));
    var status = el("div", { class: "apt-sheet-sub", text: "" });
    card.appendChild(status);

    var canNfc = methods.indexOf("nfc") !== -1 && "NDEFReader" in window;
    var canQr = methods.indexOf("qr") !== -1 && "BarcodeDetector" in window && navigator.mediaDevices;

    if (canNfc) {
      status.textContent = "Hold the top of your phone against the NFC tag.";
      card.appendChild(el("div", { class: "apt-pulse" }));
      startNfc(function (value) { sendScan("nfc", value, opts); }, function (msg) { status.textContent = msg; });
    } else if (canQr) {
      status.textContent = "Point the camera at the checkpoint's QR code.";
      var video = el("video", { class: "apt-video", playsinline: "true", muted: "true" });
      card.appendChild(video);
      startQr(video, function (value) { sendScan("qr", value, opts); }, function (msg) { status.textContent = msg; });
    } else {
      status.textContent = "This device can't read " + methodLabel(methods) + " here. Type the code printed on the checkpoint.";
    }

    // Typing the code is always available (desktop, damaged tag, no permission).
    var input = el("input", { class: "apt-input", type: "text", placeholder: "Checkpoint code", autocomplete: "off", spellcheck: "false" });
    var method = methods.indexOf("qr") !== -1 && methods.indexOf("nfc") === -1 ? "qr" : methods[0];
    var methodPick = methods.length > 1
      ? el("div", { class: "apt-row-btns" }, methods.map(function (m) {
          var b = el("button", { class: "apt-secondary", type: "button", text: m === "nfc" ? "NFC tag code" : "QR code text" });
          b.addEventListener("click", function () {
            method = m;
            Array.prototype.forEach.call(methodPick.children, function (x) { x.style.borderColor = ""; });
            b.style.borderColor = "rgba(59,130,246,.7)";
          });
          if (m === method) b.style.borderColor = "rgba(59,130,246,.7)";
          return b;
        }))
      : null;
    card.appendChild(el("div", { class: "acg-label", text: "Or enter the code" }));
    if (methodPick) card.appendChild(methodPick);
    card.appendChild(input);
    card.appendChild(el("div", { class: "apt-row-btns" }, [
      el("button", { class: "apt-secondary", type: "button", text: "Cancel", onclick: closeSheet }),
      el("button", {
        class: "acg-next", type: "button", text: "Submit code",
        onclick: function () { if (input.value.trim()) sendScan(method, input.value.trim(), opts); }
      })
    ]));
  }

  function startNfc(onValue, onStatus) {
    var controller = new AbortController();
    stopActive = function () { controller.abort(); };
    var reader = new window.NDEFReader();
    reader.scan({ signal: controller.signal }).then(function () {
      reader.onreading = function (event) {
        var text = null;
        (event.message.records || []).forEach(function (record) {
          if (!text && record.recordType === "text") text = new TextDecoder(record.encoding || "utf-8").decode(record.data);
        });
        onValue(text || event.serialNumber);   // tag's text record, else its serial number
      };
    }).catch(function (err) {
      onStatus("NFC unavailable (" + (err.name === "NotAllowedError" ? "permission denied" : err.message) + "). Type the code instead.");
    });
  }

  function startQr(video, onValue, onStatus) {
    var detector = new window.BarcodeDetector({ formats: ["qr_code", "code_128", "ean_13"] });
    var stream = null;
    var running = true;
    stopActive = function () {
      running = false;
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    };
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (s) {
      stream = s;
      video.srcObject = s;
      return video.play();
    }).then(function tick() {
      if (!running) return;
      detector.detect(video).then(function (codes) {
        if (codes.length && running) { onValue(codes[0].rawValue); return; }
        setTimeout(tick, 250);
      }).catch(function () { setTimeout(tick, 400); });
    }).catch(function (err) {
      onStatus("Camera unavailable (" + (err.name === "NotAllowedError" ? "permission denied" : err.message) + "). Type the code instead.");
    });
  }

  /* ── Home card: real pending-task count ────────────────────────────────── */

  // The bundle hard-codes "3 Pending" on the Today's Task card. Show the real
  // number of open tasks instead, and keep it there when React re-renders home.
  var pendingText = null;
  var pendingNode = null;

  function setPending(tasks) {
    pendingText = tasks.filter(function (t) { return t.status !== "Completed"; }).length + " Pending";
    paintPending();
    return tasks;
  }

  function refreshPending() {
    if (!window.AlexiosMobile || !window.AlexiosAuth || !window.AlexiosAuth.token()) return;
    mobile().api("/mobile/tasks").then(setPending).catch(function () { /* keep the last count */ });
  }

  function pendingValueNode() {
    if (pendingNode && pendingNode.isConnected) return pendingNode;
    var label = Array.prototype.find.call(document.querySelectorAll("#root div"), function (n) {
      return n.childElementCount === 0 && n.textContent.trim() === "Today's Task";
    });
    pendingNode = label ? label.nextElementSibling : null;
    return pendingNode;
  }

  function paintPending() {
    var node = pendingText && pendingValueNode();
    if (node && node.textContent !== pendingText) node.textContent = pendingText;
  }

  var paintQueued = false;
  new MutationObserver(function () {
    if (paintQueued || !pendingText) return;
    paintQueued = true;
    requestAnimationFrame(function () { paintQueued = false; paintPending(); });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  setTimeout(refreshPending, 1500);
  setInterval(refreshPending, 2 * 60 * 1000);

  /* ── Entry points ──────────────────────────────────────────────────────── */

  function entryFor(node) {
    // Labels are often upper-cased by CSS only, so compare case-insensitively.
    for (var n = node, depth = 0; n && n !== document.body && depth < 6; n = n.parentElement, depth++) {
      var text = (n.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (n.tagName === "BUTTON" && /^(start tour|resume tour)$/.test(text)) return "start-tour";
      if (text === "view all") return "tours";
      if (text.indexOf("today's task") === 0 && text.length < 40) return "tasks";
    }
    return null;
  }

  /** task-status.js locks Start Tour until flagged activities have a reason. */
  function taskLockActive() {
    var tasks = window.AlexiosTaskStatus;
    if (!tasks || !tasks.flags) return false;
    return Object.keys(tasks.flags).some(function (key) { return !tasks.flags[key].reason; });
  }

  document.addEventListener("click", function (e) {
    if (UI && UI.overlay.contains(e.target)) return;
    if (sheet && sheet.contains(e.target)) return;
    var entry = entryFor(e.target);
    if (!entry || !window.AlexiosMobile || !window.AlexiosAuth || !window.AlexiosAuth.token()) return;
    // The task lock blocks starting a tour, not viewing the list.
    if (entry === "start-tour" && taskLockActive()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    stack = [];
    push(entry === "tasks" ? tasksScreen() : toursScreen());
  }, true);

  window.AlexiosPatrol = {
    openTours: function () { stack = []; push(toursScreen()); },
    openTasks: function () { stack = []; push(tasksScreen()); },
    openTour: function (id) { stack = []; push(tourScreen(id)); },
    openTask: function (id) { stack = []; push(taskScreen(id)); },
    /** Testing: submit a code as if it were scanned. */
    submitCode: function (method, value, taskId) { sendScan(method, value, { taskId: taskId }); }
  };
})();
