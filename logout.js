/* ============================================================================
 * ALEXIOS Mobile — Log out
 * ----------------------------------------------------------------------------
 * Add-on layered over the built bundle. No build step, no bundle edits.
 * Requires alexios-auth.js, alexios-ui.css and logout.css.
 *
 * Adds a LOG OUT button at the bottom of Settings (the bundle has none).
 * Tapping it asks for confirmation first:
 *   - on duty or on break → refused: clock out first, so live location and the
 *     timesheet aren't left open with nobody signed in;
 *   - reports still waiting to upload → warned that they will be discarded.
 * Logging out revokes the session on the server (POST /auth/logout), clears
 * this device's saved session, unsent reports and drafts, then reloads, which
 * closes the socket and lands on the login screen.
 *
 * Programmatic: window.AlexiosLogout.open()
 * ========================================================================== */
(function () {
  "use strict";

  var ROW_ID = "alx-logout-row";
  // Belongs to whoever was signed in; must not carry over to the next officer on this phone.
  var USER_KEYS = ["alexios.incidents.queue.v1"];
  var USER_PREFIXES = ["alexios.incidents.draft."];

  /* ── Settings row ──────────────────────────────────────────────────────── */

  // Same header test as settings-trim.js: a leaf DIV with the section-label styling.
  function accountHeader() {
    var nodes = document.querySelectorAll("#root div[style]");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.children.length === 0 && (n.getAttribute("style") || "").indexOf("letter-spacing") > -1 &&
          n.textContent.trim() === "ACCOUNT") return n;
    }
    return null;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  var ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
    '<polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

  function mountRow() {
    if (document.getElementById(ROW_ID)) return;
    var header = accountHeader();
    if (!header || !header.parentElement || !window.AlexiosAuth || !window.AlexiosAuth.token()) return;
    var list = header.parentElement;

    var wrap = el("div");
    wrap.id = ROW_ID;
    var button = el("button", "alx-logout-row");
    button.type = "button";
    button.innerHTML = ICON;
    button.appendChild(document.createTextNode("LOG OUT"));
    button.addEventListener("click", open);
    wrap.appendChild(button);

    var user = window.AlexiosAuth.user();
    if (user && (user.fullName || user.email)) {
      wrap.appendChild(el("p", "alx-logout-who", "Signed in as " + [user.fullName, user.email].filter(Boolean).join(" · ")));
    }
    // Before the bundle's bottom spacer, so the button isn't hidden behind the tab bar.
    var spacer = list.lastElementChild;
    if (spacer && spacer.children.length === 0 && !spacer.textContent.trim()) list.insertBefore(wrap, spacer);
    else list.appendChild(wrap);
  }

  new MutationObserver(mountRow).observe(document.documentElement, { childList: true, subtree: true });

  /* ── Confirm sheet ─────────────────────────────────────────────────────── */

  var scrim = null;

  function close() {
    if (!scrim) return;
    var node = scrim;
    scrim = null;
    node.dataset.open = "false";
    setTimeout(function () { node.remove(); }, 260);
  }

  function sheet(build) {
    close();
    var s = el("div", "alx-logout-scrim");
    s.setAttribute("role", "dialog");
    s.setAttribute("aria-modal", "true");
    var body = el("div", "asc-sheet");
    s.appendChild(body);
    s.addEventListener("click", function (e) { if (e.target === s) close(); });
    build(body);
    document.body.appendChild(s);
    scrim = s;
    requestAnimationFrame(function () { s.dataset.open = "true"; });
    var first = body.querySelector("button");
    if (first) first.focus();
  }

  function button(label, kind, onClick) {
    var b = el("button", "asc-btn", label);
    b.type = "button";
    b.dataset.kind = kind;
    b.addEventListener("click", onClick);
    return b;
  }

  function dutyState() {
    if (!window.AlexiosMobile) return Promise.resolve(null);
    // Offline: don't trap the officer in the app; the server keeps the duty record either way.
    return window.AlexiosMobile.api("/mobile/duty").then(function (d) { return d && d.state; }, function () { return null; });
  }

  function unsentReports() {
    try {
      var queue = JSON.parse(localStorage.getItem("alexios.incidents.queue.v1") || "[]");
      return Array.isArray(queue) ? queue.length : 0;
    } catch (e) {
      return 0;
    }
  }

  function open() {
    var row = document.querySelector("#" + ROW_ID + " button");
    if (row) row.disabled = true;
    dutyState().then(function (state) {
      if (row) row.disabled = false;
      if (state === "on_duty" || state === "on_break") return showOnDuty(state);
      showConfirm();
    });
  }

  function showOnDuty(state) {
    sheet(function (body) {
      body.appendChild(el("div", "asc-sheet-title", "Clock out first"));
      body.appendChild(el("div", "asc-sheet-sub", state === "on_break"
        ? "You're on a break. End your break and clock out before logging out."
        : "You're clocked in. Clock out before logging out, so your shift and live location are closed properly."));
      var actions = el("div", "asc-actions");
      actions.appendChild(button("OK", "primary", close));
      body.appendChild(actions);
    });
  }

  function showConfirm() {
    var pending = unsentReports();
    sheet(function (body) {
      body.appendChild(el("div", "asc-sheet-title", "Log out?"));
      body.appendChild(el("div", "asc-sheet-sub", "You'll need your email and password to sign in again on this device."));
      if (pending) {
        body.appendChild(el("div", "alx-logout-warn", pending === 1
          ? "1 report hasn't uploaded yet. It will be deleted from this phone if you log out now."
          : pending + " reports haven't uploaded yet. They will be deleted from this phone if you log out now."));
      }
      var error = el("div", "alx-logout-err");
      var actions = el("div", "asc-actions");
      var cancel = button("CANCEL", "ghost", close);
      var confirm = button("LOG OUT", "danger", function () {
        confirm.disabled = cancel.disabled = true;
        confirm.textContent = "LOGGING OUT…";
        logout().catch(function () {
          confirm.disabled = cancel.disabled = false;
          confirm.textContent = "LOG OUT";
          error.textContent = "Couldn't log out. Try again.";
        });
      });
      actions.appendChild(cancel);
      actions.appendChild(confirm);
      body.appendChild(actions);
      body.appendChild(error);
    });
  }

  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && scrim) close(); });

  /* ── Log out ───────────────────────────────────────────────────────────── */

  function clearUserData() {
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var key = localStorage.key(i);
        if (!key) continue;
        var drop = USER_KEYS.indexOf(key) > -1 || USER_PREFIXES.some(function (p) { return key.indexOf(p) === 0; });
        if (drop) localStorage.removeItem(key);
      }
    } catch (e) { /* storage blocked: nothing saved to clear */ }
  }

  function logout() {
    return window.AlexiosAuth.logout().then(function () {
      clearUserData();
      // A fresh page drops the socket, timers and every screen's in-memory state.
      location.replace(location.pathname);
    });
  }

  window.AlexiosLogout = { open: open, logout: logout };
})();
