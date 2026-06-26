(function () {
  "use strict";

  var HL_LOCK_APP_NAME = "heartlink-lock-app";
  var HL_LOCK_DEFAULT_WHATSAPP = "201125674359";
  var HL_LOCK_DEFAULT_MESSAGE =
    "عفواً، تم قفل هذه الهدية نهائياً من قبل المطور HeartLink ولا يمكن الوصول إليها أو استخدامها بعد الآن.";
  var HL_LOCK_FIREBASE_CONFIG = {
    apiKey: "AIzaSyBiEatzVzp7lsd0J4wkGmxoASqsEsftH_o",
    authDomain: "heart-link-e7e31-74eff.firebaseapp.com",
    databaseURL: "https://heart-link-e7e31-74eff-default-rtdb.firebaseio.com",
    projectId: "heart-link-e7e31-74eff",
    storageBucket: "heart-link-e7e31-74eff.firebasestorage.app",
    messagingSenderId: "1088958253130",
    appId: "1:1088958253130:web:4047f400ac29fa6b133eb3",
    measurementId: "G-NZN7CEWE1M"
  };

  var HL_LOCK_FIREBASE_SCRIPTS = [
    "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js",
    "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"
  ];

  var hlLockState = {
    giftId: String(window.HEARTLINK_GIFT_ID || "").trim(),
    giftData: null,
    isClosed: false,
    stylesReady: false,
    db: null
  };

  function hlLockReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  function hlLockLoadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        if (existing.dataset.hlLockLoaded === "true") resolve();
        return;
      }

      var script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.hlLockLoaded = "true";
      script.onload = resolve;
      script.onerror = reject;
      (document.head || document.documentElement).appendChild(script);
    });
  }

  function hlLockEnsureFirebase() {
    var chain = Promise.resolve();

    if (!window.firebase || !window.firebase.initializeApp) {
      chain = chain.then(function () {
        return hlLockLoadScript(HL_LOCK_FIREBASE_SCRIPTS[0]);
      });
    }

    chain = chain.then(function () {
      if (!window.firebase || !window.firebase.database) {
        return hlLockLoadScript(HL_LOCK_FIREBASE_SCRIPTS[1]);
      }
      return null;
    });

    return chain.then(function () {
      var app;
      try {
        app = window.firebase.app(HL_LOCK_APP_NAME);
      } catch (error) {
        app = window.firebase.initializeApp(HL_LOCK_FIREBASE_CONFIG, HL_LOCK_APP_NAME);
      }
      hlLockState.db = app.database();
      return hlLockState.db;
    });
  }

  function hlLockEscape(text) {
    return String(text == null ? "" : text).replace(/[&<>"']/g, function (match) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[match];
    });
  }

  function hlLockWhatsapp(raw) {
    var digits = String(raw || HL_LOCK_DEFAULT_WHATSAPP).replace(/\D/g, "");
    return digits || HL_LOCK_DEFAULT_WHATSAPP;
  }

  function hlLockWhatsappUrl(raw) {
    return "https://wa.me/" + hlLockWhatsapp(raw);
  }

  function hlLockApplyStyles() {
    if (hlLockState.stylesReady) return;
    hlLockState.stylesReady = true;

    var style = document.createElement("style");
    style.id = "hl-lock-style";
    style.textContent = [
      "#hl-lock-credit,#hl-lock-credit *,.hl-lock-overlay,.hl-lock-overlay *{box-sizing:border-box;letter-spacing:0!important}",
      "#hl-lock-credit{position:fixed;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483000;display:inline-flex;align-items:center;justify-content:center;max-width:calc(100vw - 24px);padding:7px 10px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(8,8,10,.62);color:#fff;text-decoration:none;font:600 10px/1.2 system-ui,-apple-system,Segoe UI,Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.2);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);opacity:.78;transition:opacity .2s ease,transform .2s ease}",
      "#hl-lock-credit:hover,#hl-lock-credit:focus-visible{opacity:1;transform:translateY(-1px);outline:none}",
      ".hl-lock-overlay{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;padding:22px;background:radial-gradient(circle at 50% 0%,rgba(146,16,38,.22),transparent 32%),linear-gradient(180deg,#09090b 0%,#17070a 48%,#050505 100%);color:#fff;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;text-align:center;direction:rtl}",
      ".hl-lock-overlay[hidden]{display:none!important}",
      ".hl-lock-overlay__panel{width:min(460px,100%);border:1px solid rgba(255,255,255,.12);border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));box-shadow:0 24px 80px rgba(0,0,0,.52);padding:30px 22px}",
      ".hl-lock-overlay__icon{width:82px;height:82px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#e11d48,#6f0617);box-shadow:0 14px 38px rgba(225,29,72,.28);font-size:38px}",
      ".hl-lock-overlay__title{margin:0 0 12px;font-size:30px;line-height:1.25;font-weight:900;color:#fff}",
      ".hl-lock-overlay__message{margin:0 auto 22px;max-width:360px;color:#e7d8dc;font-size:15px;line-height:1.9}",
      ".hl-lock-overlay__button{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 20px;border-radius:8px;background:#25d366;color:#07130b;text-decoration:none;font-weight:900;font-size:15px;box-shadow:0 12px 26px rgba(37,211,102,.22);transition:transform .2s ease,filter .2s ease}",
      ".hl-lock-overlay__button:hover,.hl-lock-overlay__button:focus-visible{transform:translateY(-1px);filter:brightness(1.04);outline:none}",
      ".hl-lock-overlay__credit{display:inline-block;margin-top:22px;color:#ffb3c1;text-decoration:none;font-size:12px;font-weight:800}",
      "html.hl-lock-document-closed,html.hl-lock-document-closed body{overflow:hidden!important}",
      "html.hl-lock-document-closed body>*:not(.hl-lock-overlay):not(#hl-lock-credit){visibility:hidden!important;pointer-events:none!important}",
      "@media (max-width:520px){.hl-lock-overlay{padding:16px}.hl-lock-overlay__panel{padding:26px 18px}.hl-lock-overlay__title{font-size:25px}.hl-lock-overlay__message{font-size:14px}#hl-lock-credit{right:10px;bottom:max(10px,env(safe-area-inset-bottom));font-size:9px;padding:6px 9px}}"
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function hlLockRenderCredit(whatsapp) {
    hlLockApplyStyles();
    var credit = document.getElementById("hl-lock-credit");
    if (!credit) {
      credit = document.createElement("a");
      credit.id = "hl-lock-credit";
      credit.className = "hl-lock-credit";
      credit.target = "_blank";
      credit.rel = "noopener";
      credit.textContent = "Made with ❤️ by HeartLink";
      document.body.appendChild(credit);
    }
    credit.href = hlLockWhatsappUrl(whatsapp);
  }

  function hlLockRenderOverlay(data) {
    hlLockApplyStyles();
    var whatsapp = hlLockWhatsapp(data && data.whatsapp);
    var message = (data && data.lockMessage) || HL_LOCK_DEFAULT_MESSAGE;
    var overlay = document.getElementById("hl-lock-overlay");

    if (!overlay) {
      overlay = document.createElement("section");
      overlay.id = "hl-lock-overlay";
      overlay.className = "hl-lock-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "hl-lock-overlay-title");
      document.body.appendChild(overlay);
    }

    overlay.hidden = false;
    overlay.innerHTML =
      '<div class="hl-lock-overlay__panel">' +
      '<div class="hl-lock-overlay__icon" aria-hidden="true">🔒</div>' +
      '<h1 class="hl-lock-overlay__title" id="hl-lock-overlay-title">الهدية مغلقة</h1>' +
      '<p class="hl-lock-overlay__message">' + hlLockEscape(message) + "</p>" +
      '<a class="hl-lock-overlay__button" target="_blank" rel="noopener" href="' + hlLockWhatsappUrl(whatsapp) + '">تواصل مع المطور</a>' +
      '<br><a class="hl-lock-overlay__credit" target="_blank" rel="noopener" href="' + hlLockWhatsappUrl(whatsapp) + '">Made with ❤️ by HeartLink</a>' +
      "</div>";

    document.documentElement.classList.add("hl-lock-document-closed");
  }

  function hlLockOpenPage(data) {
    var overlay = document.getElementById("hl-lock-overlay");
    if (overlay) overlay.hidden = true;
    document.documentElement.classList.remove("hl-lock-document-closed");
    hlLockRenderCredit(data && data.whatsapp);
  }

  function hlLockApplyGift(data) {
    hlLockState.giftData = data || {};
    hlLockState.isClosed = String(hlLockState.giftData.status || "open").toLowerCase() === "closed";

    if (hlLockState.isClosed) {
      hlLockRenderOverlay(hlLockState.giftData);
    } else {
      hlLockOpenPage(hlLockState.giftData);
    }
  }

  function hlLockStart() {
    hlLockReady(function () {
      hlLockRenderCredit(HL_LOCK_DEFAULT_WHATSAPP);

      if (!hlLockState.giftId) {
        console.warn("[HeartLink Lock] Missing window.HEARTLINK_GIFT_ID.");
        return;
      }

      hlLockEnsureFirebase()
        .then(function (db) {
          db.ref("gifts/" + hlLockState.giftId).on(
            "value",
            function (snapshot) {
              hlLockApplyGift(snapshot.val() || { status: "open", whatsapp: HL_LOCK_DEFAULT_WHATSAPP });
            },
            function (error) {
              console.warn("[HeartLink Lock] Firebase read failed:", error && error.message ? error.message : error);
            }
          );
        })
        .catch(function (error) {
          console.warn("[HeartLink Lock] Could not initialize lock system:", error && error.message ? error.message : error);
        });
    });
  }

  hlLockStart();
})();
