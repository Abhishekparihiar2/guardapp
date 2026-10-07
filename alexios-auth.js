/* ============================================================================
 * ALEXIOS Mobile — Real login (add-on over the built bundle)
 * ----------------------------------------------------------------------------
 * The bundled login screen accepts any input. This add-on intercepts the
 * "Authenticate" button, signs in against the ALEXIOS API, and only lets the
 * app continue when the backend accepts the credentials.
 *
 * Backend:  POST {apiBase}/auth/login  { email, password }
 *           → { accessToken, user }  + HttpOnly refresh cookie "token"
 * The Officer ID field takes the work email until Officer ID + PIN login
 * exists on the backend (pending client decision).
 *
 * Exposes window.AlexiosAuth: { configure, user, token, fetch, logout }.
 * ========================================================================== */
(function () {
  "use strict";

  var CONFIG = {
    apiBase: "/api/v1", // served through dev-server.mjs, which proxies /api
  };

  var STORAGE_KEY = "alexios.auth";
  var bypassNextClick = false;

  /* ── Session storage ───────────────────────────────────────────────────── */

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function writeSession(session) {
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* private mode: session lives for this page only */
    }
    memorySession = session;
  }

  var memorySession = readSession();

  /* ── API ───────────────────────────────────────────────────────────────── */

  function errorMessage(body, status) {
    var code = body && body.error && body.error.code;
    if (code === "INVALID_CREDENTIALS") return "Invalid email or password.";
    if (code === "ACCOUNT_INACTIVE") return "This account is not active. Contact your supervisor.";
    if (code === "RATE_LIMITED" || status === 429) return "Too many attempts. Try again in a few minutes.";
    if (body && body.message) return body.message;
    return "Sign in failed (" + status + ").";
  }

  function login(email, password) {
    return fetch(CONFIG.apiBase + "/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-Client": "mobile" },
      body: JSON.stringify({ email: email, password: password }),
    })
      .catch(function () {
        throw new Error("Cannot reach the server. Check that the ALEXIOS API is running.");
      })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return null;
          })
          .then(function (body) {
            if (!res.ok) throw new Error(errorMessage(body, res.status));
            return body;
          });
      });
  }

  function refresh() {
    return fetch(CONFIG.apiBase + "/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "X-Client": "mobile" },
    }).then(function (res) {
      if (!res.ok) throw new Error("Session expired");
      return res.json();
    });
  }

  /** fetch() with the Bearer token; refreshes once on an expired token. */
  function authFetch(path, options) {
    options = options || {};
    function send() {
      var headers = Object.assign({}, options.headers);
      if (memorySession && memorySession.accessToken) {
        headers.Authorization = "Bearer " + memorySession.accessToken;
      }
      return fetch(CONFIG.apiBase + path, Object.assign({}, options, { headers: headers, credentials: "include" }));
    }
    return send().then(function (res) {
      if (res.status !== 401) return res;
      return refresh()
        .then(function (body) {
          writeSession(Object.assign({}, memorySession, { accessToken: body.accessToken }));
          return send();
        })
        .catch(function () {
          writeSession(null);
          return res;
        });
    });
  }

  function logout() {
    return fetch(CONFIG.apiBase + "/auth/logout", { method: "POST", credentials: "include" })
      .catch(function () {})
      .then(function () {
        writeSession(null);
      });
  }

  /* ── Login screen hook ─────────────────────────────────────────────────── */

  function findLoginForm(fromNode) {
    var root = fromNode.closest("div[style*='100dvh']") || document;
    return {
      root: root,
      id: root.querySelector("input[placeholder='Officer ID']"),
      secret: root.querySelector("input[placeholder='PIN / Password']"),
    };
  }

  function authenticateButton(target) {
    var node = target && target.closest ? target.closest("button, [role='button'], div, span") : null;
    while (node && node !== document.body) {
      if (node.textContent && node.textContent.trim() === "Authenticate") {
        var form = findLoginForm(node);
        if (form.id && form.secret) return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function showError(form, message) {
    var box = form.root.querySelector(".alexios-auth-error");
    if (!box) {
      box = document.createElement("div");
      box.className = "alexios-auth-error";
      box.setAttribute("role", "alert");
      box.style.cssText =
        "margin:10px 0 0;padding:8px 12px;border-radius:8px;font:500 13px Inter,sans-serif;" +
        "color:#FCA5A5;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.35);";
      form.secret.parentElement.parentElement.appendChild(box);
    }
    box.textContent = message;
    box.style.display = message ? "block" : "none";
  }

  function setBusy(button, busy) {
    button.style.opacity = busy ? "0.6" : "";
    button.style.pointerEvents = busy ? "none" : "";
    var label = button.querySelector("span") || button;
    if (busy) {
      label.dataset.alexiosLabel = label.textContent;
      label.textContent = "Signing in…";
    } else if (label.dataset.alexiosLabel) {
      label.textContent = label.dataset.alexiosLabel;
    }
  }

  function handleAuthenticate(button) {
    var form = findLoginForm(button);
    var email = form.id.value.trim();
    var password = form.secret.value;

    if (!email || !password) return showError(form, "Enter your work email and password.");
    if (email.indexOf("@") === -1) {
      return showError(form, "Officer ID sign-in isn't available yet. Use your work email.");
    }

    showError(form, "");
    setBusy(button, true);
    login(email, password)
      .then(function (body) {
        resumeAttempted = true; // just signed in; no need to re-verify this session
        writeSession({ accessToken: body.accessToken, refreshToken: body.refreshToken || null, user: body.user });
        setBusy(button, false);
        bypassNextClick = true;
        button.click(); // let the bundle's own onLogin run and navigate
      })
      .catch(function (err) {
        setBusy(button, false);
        showError(form, err.message);
      });
  }

  document.addEventListener(
    "click",
    function (event) {
      var button = authenticateButton(event.target);
      if (!button) return;
      if (bypassNextClick) {
        bypassNextClick = false;
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      handleAuthenticate(button);
    },
    true,
  );

  document.addEventListener(
    "keydown",
    function (event) {
      if (event.key !== "Enter" || !event.target || !event.target.matches) return;
      if (!event.target.matches("input[placeholder='Officer ID'], input[placeholder='PIN / Password']")) return;
      var root = findLoginForm(event.target).root;
      var candidates = root.querySelectorAll("button, div, span");
      for (var i = candidates.length - 1; i >= 0; i -= 1) {
        if (candidates[i].textContent.trim() === "Authenticate") {
          event.preventDefault();
          handleAuthenticate(candidates[i]);
          return;
        }
      }
    },
    true,
  );

  /* ── Resume a saved session on reload ──────────────────────────────────── */

  // The bundle always starts at splash → login. When the login screen mounts
  // and a session is stored, verify it with the backend (refreshing the access
  // token through the cookie if needed) and continue straight into the app.
  var resumeAttempted = false;

  function coverLogin(root, on) {
    root.style.visibility = on ? "hidden" : "";
  }

  function tryResume(input) {
    if (resumeAttempted || !memorySession || !memorySession.accessToken) return;
    resumeAttempted = true;
    var form = findLoginForm(input);
    coverLogin(form.root, true);
    authFetch("/auth/me")
      .then(function (res) {
        if (!res.ok) throw new Error("Session expired");
        return res.json();
      })
      .then(function (user) {
        writeSession(Object.assign({}, memorySession, { user: user }));
        var candidates = form.root.querySelectorAll("button, div, span");
        for (var i = candidates.length - 1; i >= 0; i -= 1) {
          if (candidates[i].textContent.trim() === "Authenticate") {
            bypassNextClick = true;
            candidates[i].click();
            return;
          }
        }
        throw new Error("Authenticate button not found");
      })
      .catch(function () {
        writeSession(null);
        coverLogin(form.root, false);
      });
  }

  new MutationObserver(function () {
    var input = document.querySelector("input[placeholder='Officer ID']");
    if (input) tryResume(input);
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.AlexiosAuth = {
    configure: function (options) {
      Object.assign(CONFIG, options || {});
    },
    user: function () {
      return memorySession ? memorySession.user : null;
    },
    token: function () {
      return memorySession ? memorySession.accessToken : null;
    },
    fetch: authFetch,
    logout: logout,
  };
})();
