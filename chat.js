/* ============================================================================
 * ALEXIOS Mobile — Chat (Comms tab)
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 * The bottom-nav "Comms" tab opens real chat instead of the bundle's mock-up:
 *
 *   Messages  GET  /chat/threads                     my conversations, unread counts
 *   Team      GET  /chat/contacts                    who I can message; supervisors first
 *             POST /chat/threads/direct              open (or create) a one-to-one chat
 *   Thread    GET  /chat/threads/:id                 members, canSend
 *             GET  /chat/threads/:id/messages        history (oldest first per page)
 *             POST /chat/threads/:id/messages        send (idempotent: retries never double up)
 *             POST /chat/threads/:id/read            mark seen
 *   Group     POST /chat/threads/group               supervisors only (admins use the CRM)
 *
 * Rules come from the backend: a guard's one-to-one chats are with supervisors
 * (every supervisor is a default contact) and with admins only after the admin
 * writes first; guards never DM each other and only meet in groups an admin or
 * supervisor created (thread.canSend / thread.sendBlock).
 *
 * Live updates arrive on the shared Socket.IO connection from live-location.js.
 * While chat is open it holds that socket open (even off duty; no location is
 * shared off duty) and releases it on close.
 * ========================================================================== */
(function () {
  "use strict";

  var ICON = {
    back: '<svg width="10" height="17" viewBox="0 0 10 17" fill="none"><path d="M8.5 15.5L1.5 8.5L8.5 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    send: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
  };

  var TIER_LABEL = { supervisor: "Supervisor", admin: "Admin" };
  /** thread.sendBlock → why a guard can't post here (backend rules). */
  var LOCKED_TEXT = {
    admin_first: "You can reply once the admin sends you a message.",
    guard_to_guard: "Guards can't message each other directly. Message your supervisor or use a group."
  };
  var MESSAGE_PAGE = 50;

  /* ── Helpers ───────────────────────────────────────────────────────────── */

  /** Builds an element. `act` attaches a click action (see the click router below). */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;   // static icons only, never user text
      else if (k === "text") n.textContent = v;
      else if (k === "act") n.__chatAct = v;
      else n.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  function initials(name) {
    var parts = String(name || "?").trim().split(/\s+/);
    return ((parts[0] || "")[0] + ((parts[1] || "")[0] || "")).toUpperCase() || "?";
  }

  function timeLabel(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    var now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (now - d < 6 * 864e5) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  }

  function personLabel(p) {
    return TIER_LABEL[p.tier] || p.jobTitle || "Security Guard";
  }

  function avatar(name, tier) {
    return el("div", { class: "cht-av", "data-tier": tier || "guard", text: initials(name) });
  }

  function newKey() {
    return window.AlexiosMobile ? window.AlexiosMobile.newIdempotencyKey() : String(Date.now()) + Math.random().toString(16).slice(2);
  }

  /** Full JSON body (list endpoints carry pagination / hasMore next to data). */
  function getRaw(path) {
    return window.AlexiosAuth.fetch(path, { headers: { "X-Client": "mobile" } }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (!res.ok) {
          var err = new Error((json && json.message) || "Request failed (" + res.status + ")");
          err.code = json && json.error && json.error.code;
          throw err;
        }
        return json;
      });
    }, function () { throw new Error("No connection to the server. Try again."); });
  }

  function post(path, body) { return window.AlexiosMobile.api(path, body); }

  function live() { return window.AlexiosLiveLocation; }

  /* ── State ─────────────────────────────────────────────────────────────── */

  var UI = null;
  var me = null;            // { id, tier }
  var screen = null;        // "home" | "thread" | "group"
  var tab = "messages";
  var thread = null;        // open thread view
  var messages = [];        // open thread's messages, oldest first
  var hasMore = false;
  var unsubscribe = null;
  var refreshTimer = null;

  function loadMe() {
    if (me) return Promise.resolve(me);
    return getRaw("/me").then(function (user) {
      var role = String(user.roleName || "").toLowerCase();
      me = { id: String(user.id), tier: user.userRole === "admin" ? "admin" : role === "supervisor" ? "supervisor" : "guard" };
      return me;
    });
  }

  /* ── Overlay ───────────────────────────────────────────────────────────── */

  function build() {
    if (UI) return UI;
    var back = el("button", { class: "acg-back", type: "button", "aria-label": "Back", html: ICON.back, act: goBack });
    var title = el("div", { class: "acg-title" });
    var sub = el("div", { class: "acg-sub" });
    var action = el("div", { class: "cht-head-action" });
    var body = el("div", { class: "acg-body cht-body" });
    var foot = el("div", { class: "cht-foot" });
    var overlay = el("div", { class: "acg-overlay", "data-open": "false", "data-flow": "chat" }, [
      el("div", { class: "acg-head" }, [el("div", { class: "acg-head-row" }, [back, el("div", { class: "acg-head-txt" }, [title, sub]), action])]),
      body,
      foot
    ]);
    document.body.appendChild(overlay);
    UI = { overlay: overlay, title: title, sub: sub, action: action, body: body, foot: foot };
    return UI;
  }

  function frame(titleText, subText) {
    UI.title.textContent = titleText;
    UI.sub.textContent = subText || "";
    UI.action.textContent = "";
    UI.body.textContent = "";
    UI.foot.textContent = "";
    UI.foot.style.display = "none";
  }

  function notice(text, kind) {
    return el("div", { class: "cht-notice", "data-kind": kind || "info", text: text });
  }

  function open() {
    build();
    UI.overlay.dataset.open = "true";
    if (live()) {
      live().retain("chat");
      if (!unsubscribe) unsubscribe = live().onEvent(onSocketEvent);
    }
    showHome();
  }

  function close() {
    if (!UI) return;
    UI.overlay.dataset.open = "false";
    screen = null;
    thread = null;
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    if (live()) live().release("chat");
  }

  function goBack() {
    if (screen === "home") close();
    else showHome();
  }

  /* ── Home: Messages | Team ─────────────────────────────────────────────── */

  function showHome() {
    screen = "home";
    thread = null;
    frame("Chat", "");
    loadMe().then(function () {
      if (screen !== "home") return;
      if (me.tier !== "guard") {
        UI.action.appendChild(el("button", { class: "cht-icon-btn", type: "button", "aria-label": "New group", html: ICON.plus, act: showNewGroup }));
      }
      renderHome();
    }).catch(function (err) { UI.body.appendChild(notice(err.message, "error")); });
  }

  function renderHome() {
    UI.body.textContent = "";
    var tabs = el("div", { class: "cht-tabs" }, [
      el("button", { class: "cht-tab", type: "button", "data-on": String(tab === "messages"), text: "Messages", act: function () { tab = "messages"; renderHome(); } }),
      el("button", { class: "cht-tab", type: "button", "data-on": String(tab === "team"), text: "Team", act: function () { tab = "team"; renderHome(); } })
    ]);
    var list = el("div", { class: "cht-list" }, [el("div", { class: "acg-lead", text: "Loading…" })]);
    UI.body.appendChild(tabs);
    UI.body.appendChild(list);
    (tab === "messages" ? loadThreads(list) : loadTeam(list)).catch(function (err) {
      list.textContent = "";
      list.appendChild(notice(err.message, "error"));
    });
  }

  function loadThreads(list) {
    return getRaw("/chat/threads?limit=50").then(function (res) {
      if (screen !== "home" || tab !== "messages") return;
      list.textContent = "";
      var rows = res.data || [];
      if (!rows.length) {
        list.appendChild(el("div", { class: "cht-empty" }, [
          el("div", { class: "cht-empty-t", text: "No conversations yet" }),
          el("div", { class: "acg-lead", text: "Open Team to message your supervisor." })
        ]));
        return;
      }
      rows.forEach(function (t) { list.appendChild(threadRow(t)); });
    });
  }

  function threadRow(t) {
    var other = t.type === "direct" ? (t.participants || []).filter(function (p) { return p.employeeId !== me.id; })[0] : null;
    var subText = other ? personLabel(other) : "Group · " + t.memberCount + " members";
    var last = t.lastMessage;
    var preview = !last ? "" : last.deleted ? "Message deleted"
      : (last.type === "system" ? "" : last.sender.id === me.id ? "You: " : t.type === "direct" ? "" : last.sender.name.split(" ")[0] + ": ")
        + (last.body || (last.attachment ? "Attachment" : ""));
    return el("div", { class: "cht-row", "data-unread": String(t.unreadCount > 0), act: function () { openThread(t.id); } }, [
      avatar(t.name, other ? other.tier : "group"),
      el("div", { class: "cht-row-main" }, [
        el("div", { class: "cht-row-top" }, [
          el("div", { class: "cht-row-name", text: t.name }),
          el("div", { class: "cht-row-time", text: timeLabel(t.lastMessageAt) })
        ]),
        el("div", { class: "cht-row-sub", text: subText }),
        el("div", { class: "cht-row-bottom" }, [
          el("div", { class: "cht-row-preview", text: preview }),
          t.unreadCount > 0 ? el("div", { class: "cht-badge", text: t.unreadCount > 99 ? "99+" : String(t.unreadCount) }) : null
        ])
      ])
    ]);
  }

  function loadTeam(list) {
    return getRaw("/chat/contacts?limit=100").then(function (res) {
      if (screen !== "home" || tab !== "team") return;
      list.textContent = "";
      var people = res.data || [];
      // Guards only get supervisors back from the API; admins and supervisors get everyone.
      var groups = [
        { label: "Supervisors", rows: people.filter(function (p) { return p.tier === "supervisor"; }) },
        { label: "Guards", rows: people.filter(function (p) { return p.tier === "guard"; }) },
        { label: "Admins", rows: people.filter(function (p) { return p.tier === "admin"; }) }
      ];
      groups.forEach(function (g) {
        if (!g.rows.length) return;
        list.appendChild(el("div", { class: "acg-label cht-section", text: g.label + " · " + g.rows.length }));
        g.rows.forEach(function (p) { list.appendChild(contactRow(p)); });
      });
      if (!people.length) {
        list.appendChild(el("div", { class: "cht-empty" }, [el("div", { class: "acg-lead", text: me.tier === "guard" ? "No supervisors to message yet." : "No one to message yet." })]));
      }
    });
  }

  function contactRow(p) {
    return el("div", { class: "cht-row cht-contact", act: function () { startDirect(p); } }, [
      avatar(p.name, p.tier),
      el("div", { class: "cht-row-main" }, [
        el("div", { class: "cht-row-name", text: p.name }),
        el("div", { class: "cht-row-sub", text: personLabel(p) + (p.site ? " · " + p.site : "") })
      ])
    ]);
  }

  function startDirect(person) {
    post("/chat/threads/direct", { employeeId: person.id })
      .then(function (view) { openThread(view.id, view); })
      .catch(function (err) { UI.body.insertBefore(notice(err.message, "error"), UI.body.firstChild); });
  }

  /* ── Thread ────────────────────────────────────────────────────────────── */

  function openThread(id, view) {
    screen = "thread";
    messages = [];
    hasMore = false;
    frame(view ? view.name : "Chat", "");
    UI.body.appendChild(el("div", { class: "acg-lead", text: "Loading…" }));
    var loadView = view ? Promise.resolve(view) : getRaw("/chat/threads/" + id).then(function (r) { return r.data; });
    Promise.all([loadMe(), loadView, getRaw("/chat/threads/" + id + "/messages?limit=" + MESSAGE_PAGE)])
      .then(function (r) {
        if (screen !== "thread") return;
        thread = r[1];
        messages = r[2].data || [];
        hasMore = Boolean(r[2].hasMore);
        renderThread(true);
        markRead();
      })
      .catch(function (err) {
        UI.body.textContent = "";
        UI.body.appendChild(notice(err.message, "error"));
      });
  }

  function threadSub() {
    if (thread.type !== "direct") return thread.memberCount + " members";
    var other = (thread.participants || []).filter(function (p) { return p.employeeId !== me.id; })[0];
    return other ? personLabel(other) : "";
  }

  function renderThread(scrollToEnd) {
    UI.title.textContent = thread.name;
    UI.sub.textContent = threadSub();
    UI.body.textContent = "";
    if (hasMore) UI.body.appendChild(el("button", { class: "cht-more", type: "button", text: "Load earlier messages", act: loadEarlier }));
    if (!messages.length) UI.body.appendChild(el("div", { class: "cht-empty" }, [el("div", { class: "acg-lead", text: "No messages yet. Say hello." })]));
    var lastDay = "";
    messages.forEach(function (m) {
      var day = new Date(m.sentAt || Date.now()).toDateString();
      if (day !== lastDay) {
        lastDay = day;
        UI.body.appendChild(el("div", { class: "cht-day", text: day === new Date().toDateString() ? "Today" : new Date(m.sentAt).toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" }) }));
      }
      UI.body.appendChild(bubble(m));
    });
    renderComposer();
    if (scrollToEnd) UI.body.scrollTop = UI.body.scrollHeight;
  }

  function bubble(m) {
    if (m.type === "system") return el("div", { class: "cht-system", text: m.body || "" });
    var mine = m.sender && m.sender.id === me.id;
    var text = m.deleted ? "Message deleted" : (m.body || (m.attachment ? "📎 " + m.attachment.name : ""));
    var meta = m.failed ? "Not sent · tap to retry" : m.pending ? "Sending…" : timeLabel(m.sentAt);
    return el("div", { class: "cht-msg", "data-mine": String(mine) }, [
      el("div", { class: "cht-bubble", "data-deleted": String(Boolean(m.deleted)), "data-failed": String(Boolean(m.failed)), act: m.failed ? function () { resend(m); } : null }, [
        !mine && thread.type !== "direct" ? el("div", { class: "cht-sender", text: m.sender.name }) : null,
        el("div", { class: "cht-text", text: text }),
        el("div", { class: "cht-meta", text: meta })
      ])
    ]);
  }

  function renderComposer() {
    UI.foot.textContent = "";
    UI.foot.style.display = "";
    if (!thread.canSend) {
      UI.foot.appendChild(el("div", { class: "cht-locked", text: LOCKED_TEXT[thread.sendBlock] || LOCKED_TEXT.admin_first }));
      return;
    }
    var input = el("textarea", { class: "cht-input", rows: "1", maxlength: "4000", placeholder: "Write a message…" });
    var sendBtn = el("button", { class: "cht-send", type: "button", "aria-label": "Send", html: ICON.send, act: function () { submit(input); } });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
    });
    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });
    UI.foot.appendChild(el("div", { class: "cht-composer" }, [input, sendBtn]));
  }

  function submit(input) {
    var body = input.value.trim();
    if (!body || !thread) return;
    input.value = "";
    input.style.height = "auto";
    var draft = { id: null, clientId: newKey(), type: "text", body: body, sender: { id: me.id, name: "You" }, sentAt: new Date().toISOString(), pending: true };
    messages.push(draft);
    renderThread(true);
    UI.foot.querySelector(".cht-input") && UI.foot.querySelector(".cht-input").focus();
    deliver(draft);
  }

  function deliver(draft) {
    var threadId = thread.id;
    post("/chat/threads/" + threadId + "/messages", { idempotencyKey: draft.clientId, body: draft.body })
      .then(function (saved) {
        if (!thread || thread.id !== threadId) return;
        upsertMessage(saved);
        renderThread(true);
      })
      .catch(function (err) {
        if (!thread || thread.id !== threadId) return;
        draft.pending = false;
        draft.failed = true;
        if (err.code === "CHAT_ADMIN_FIRST" || err.code === "CHAT_NOT_ALLOWED") {
          thread.canSend = false;
          thread.sendBlock = err.code === "CHAT_ADMIN_FIRST" ? "admin_first" : "guard_to_guard";
        }
        renderThread(true);
      });
  }

  /** Same idempotency key: a retry can never create a second copy. */
  function resend(m) {
    m.failed = false;
    m.pending = true;
    renderThread(true);
    deliver(m);
  }

  /** Replaces the optimistic copy (matched by clientId) or appends; ignores duplicates. */
  function upsertMessage(m) {
    for (var i = 0; i < messages.length; i += 1) {
      if ((m.id && messages[i].id === m.id) || (m.clientId && messages[i].clientId === m.clientId)) {
        messages[i] = m;
        return false;
      }
    }
    messages.push(m);
    return true;
  }

  function lastSavedId() {
    for (var i = messages.length - 1; i >= 0; i -= 1) if (messages[i].id) return messages[i].id;
    return null;
  }

  function markRead() {
    var id = lastSavedId();
    if (thread && id) post("/chat/threads/" + thread.id + "/read", { messageId: id }).catch(function () {});
  }

  function loadEarlier() {
    var first = messages.filter(function (m) { return m.id; })[0];
    if (!first) return;
    var height = UI.body.scrollHeight;
    getRaw("/chat/threads/" + thread.id + "/messages?limit=" + MESSAGE_PAGE + "&before=" + first.id).then(function (res) {
      messages = (res.data || []).concat(messages);
      hasMore = Boolean(res.hasMore);
      renderThread(false);
      UI.body.scrollTop = UI.body.scrollHeight - height;   // keep the reader's place
    }).catch(function () {});
  }

  /** After a reconnect: fetch whatever arrived while the socket was down. */
  function catchUp() {
    var after = lastSavedId();
    if (!thread || !after) return;
    var threadId = thread.id;
    getRaw("/chat/threads/" + threadId + "/messages?after=" + after + "&limit=100").then(function (res) {
      if (!thread || thread.id !== threadId) return;
      var added = (res.data || []).filter(upsertMessage).length;
      if (added) { renderThread(true); markRead(); }
    }).catch(function () {});
  }

  /* ── New group (supervisors; admins create groups in the CRM) ──────────── */

  function showNewGroup() {
    screen = "group";
    frame("New group", "Pick a name and members");
    var picked = {};
    var name = el("input", { class: "cht-field", type: "text", maxlength: "255", placeholder: "Group name, e.g. Night shift" });
    var list = el("div", { class: "cht-list" }, [el("div", { class: "acg-lead", text: "Loading…" })]);
    var error = el("div");
    var create = el("button", { class: "acg-next", type: "button", text: "Create group", act: submitGroup });
    UI.body.appendChild(el("div", { class: "acg-label", text: "Name" }));
    UI.body.appendChild(name);
    UI.body.appendChild(el("div", { class: "acg-label", text: "Members" }));
    UI.body.appendChild(list);
    UI.foot.style.display = "";
    UI.foot.appendChild(error);
    UI.foot.appendChild(create);

    getRaw("/chat/contacts?limit=100").then(function (res) {
      if (screen !== "group") return;
      list.textContent = "";
      (res.data || []).forEach(function (p) {
        var box = el("div", { class: "cht-check", html: ICON.check });
        list.appendChild(el("div", { class: "cht-row cht-pick", act: function (row) {
          picked[p.id] = !picked[p.id];
          row.dataset.on = String(Boolean(picked[p.id]));
        } }, [
          avatar(p.name, p.tier),
          el("div", { class: "cht-row-main" }, [
            el("div", { class: "cht-row-name", text: p.name }),
            el("div", { class: "cht-row-sub", text: personLabel(p) + (p.site ? " · " + p.site : "") })
          ]),
          box
        ]));
      });
    }).catch(function (err) { list.textContent = ""; list.appendChild(notice(err.message, "error")); });

    function submitGroup() {
      var memberIds = Object.keys(picked).filter(function (id) { return picked[id]; });
      error.textContent = "";
      if (!name.value.trim()) return error.appendChild(notice("Give the group a name.", "error"));
      if (!memberIds.length) return error.appendChild(notice("Pick at least one member.", "error"));
      create.dataset.disabled = "true";
      post("/chat/threads/group", { name: name.value.trim(), memberIds: memberIds })
        .then(function (view) { openThread(view.id, view); })
        .catch(function (err) {
          create.dataset.disabled = "false";
          error.appendChild(notice(err.message, "error"));
        });
    }
  }

  /* ── Live updates ──────────────────────────────────────────────────────── */

  function refreshHomeSoon() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { if (screen === "home") renderHome(); }, 250);
  }

  function onSocketEvent(envelope) {
    var event = envelope && envelope.payload;
    if (!event || !screen) return;
    if (event.type === "socket.connected") {
      if (screen === "thread") catchUp();
      else if (screen === "home") refreshHomeSoon();
      return;
    }
    if (envelope.channel && envelope.channel.indexOf("chat:") !== 0) return;

    if (screen === "thread" && thread && event.threadId === thread.id) {
      if (event.type === "message.created") {
        // The admin's first message unlocks the composer for a guard.
        if (thread.sendBlock === "admin_first" && event.message.sender.id !== me.id) {
          thread.canSend = true;
          thread.sendBlock = null;
        }
        upsertMessage(event.message);
        renderThread(true);
        if (event.message.sender.id !== me.id) markRead();
      } else if (event.type === "message.deleted") {
        messages.forEach(function (m) { if (m.id === event.messageId) { m.deleted = true; m.body = null; } });
        renderThread(false);
      } else if (event.type === "thread.updated") {
        thread.name = event.name || thread.name;
        UI.title.textContent = thread.name;
      } else if (event.type === "participant.removed" && event.employeeIds.indexOf(me.id) !== -1) {
        showHome();
      }
      return;
    }
    if (screen === "home" && /^(message\.|thread\.|participant\.)/.test(event.type)) refreshHomeSoon();
  }

  /* ── Click router ──────────────────────────────────────────────────────────
   * Window capture runs before the other add-ons' document-capture hooks, which
   * match clicks by text (e.g. reports.js opens on text starting "reports").
   * Clicks inside chat are handled here and stopped, so a message saying
   * "Reports done" can't open another screen. Typing and focus are unaffected.
   * ------------------------------------------------------------------------ */

  function isCommsTab(node) {
    for (var n = node, depth = 0; n && n !== document.body && depth < 4; n = n.parentElement, depth++) {
      if ((n.textContent || "").trim() === "Comms") return true;
    }
    return false;
  }

  window.addEventListener("click", function (e) {
    if (UI && UI.overlay.dataset.open === "true" && UI.overlay.contains(e.target)) {
      e.stopPropagation();
      for (var n = e.target; n && n !== UI.overlay; n = n.parentElement) {
        if (n.__chatAct) {
          if (n.dataset.disabled !== "true") n.__chatAct(n);
          return;
        }
      }
      return;
    }
    if (!isCommsTab(e.target) || !window.AlexiosMobile || !window.AlexiosAuth || !window.AlexiosAuth.token()) return;
    e.preventDefault();
    e.stopPropagation();
    tab = "messages";
    open();
  }, true);

  window.AlexiosChat = {
    open: function () { tab = "messages"; open(); },
    openTeam: function () { tab = "team"; open(); },
    close: close
  };
})();
