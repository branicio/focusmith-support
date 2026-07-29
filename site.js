(function () {
  // Set FIRST. styles.css only hides a language once this attribute is present, so a
  // script error before this line (a parse failure, say) degrades to all three languages
  // shown stacked — never to none. Everything after it runs inside the try/catch below,
  // whose catch removes this very attribute: it is what authorises the stylesheet to hide
  // a [data-lang] section, so a setup failure must withdraw that authorisation rather than
  // leave content hidden with nothing left running to reveal it. Showing the wrong
  // language is cosmetic; showing none is a privacy-policy outage.
  document.documentElement.dataset.js = "on";

  try {
    // The app deep-links privacy.html#portugues / #espanol from Settings, so those
    // fragments have to keep selecting a language.
    var HASH = { portugues: "pt", espanol: "es", top: "en" };
    var LANG_ATTR = { en: "en", pt: "pt-BR", es: "es" };

    var STORE_KEY = "focusmith-support-lang";
    var FRAG = { en: "#top", pt: "#portugues", es: "#espanol" };

    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-lang]"));
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));

    // Same-page links to the site's other documents. These get the active language's
    // fragment appended so the choice survives navigation even when storage is
    // unavailable — and so a copied link carries the language with it.
    var pageLinks = Array.prototype.slice.call(document.querySelectorAll("a[href]"))
      .filter(function (a) {
        return /^[\w-]+\.html(#.*)?$/.test(a.getAttribute("href") || "");
      });

    // Storage gets its own try/catch. A SecurityError here (Safari private browsing,
    // cookies blocked, file://) must cost only persistence — not take down the whole
    // switcher by falling into the outer catch, which would unhide all three languages.
    function readStored() {
      try { return window.localStorage.getItem(STORE_KEY); } catch (e) { return null; }
    }
    function writeStored(lang) {
      try { window.localStorage.setItem(STORE_KEY, lang); } catch (e) { /* links still carry it */ }
    }

    // ---- one-time structural wiring ------------------------------------------------
    // The markup only supplies `data-lang` on each section and `role="tab"` +
    // `data-lang-target` on each control. Everything below is stamped on here so the
    // ARIA relationships cannot drift out of sync with the markup by hand.
    var firstSectionIdForLang = {};
    sections.forEach(function (s, i) {
      s.setAttribute("role", "tabpanel");
      if (!s.id) s.id = "lang-panel-" + (s.dataset.lang || i) + "-" + i;
      if (!(s.dataset.lang in firstSectionIdForLang)) {
        firstSectionIdForLang[s.dataset.lang] = s.id;
      }
    });
    tabs.forEach(function (t) {
      var id = firstSectionIdForLang[t.dataset.langTarget];
      if (id) t.setAttribute("aria-controls", id);
    });

    // Shared chrome (nav, footer) lives outside the per-language sections, so it is
    // translated by attribute instead. The authored text is captured once, before any
    // switch can overwrite it, and is the fallback whenever the active language has no
    // override — so pt -> es on an element with no data-i18n-es restores English rather
    // than leaving stale Portuguese on screen.
    var i18nEls = Array.prototype.slice.call(document.querySelectorAll("[data-i18n-en]"));
    i18nEls.forEach(function (el) { el.dataset.i18nBaseline = el.textContent; });

    // Order matters. An explicit fragment wins so a shared or app-supplied link always
    // shows the language it names, even if this browser previously chose another. A
    // remembered choice then beats the browser's own language, because a reader who
    // picked Português on an English-locale machine meant it.
    function pick() {
      var h = (location.hash || "").replace("#", "").toLowerCase();
      if (HASH[h]) return HASH[h];
      var stored = readStored();
      if (stored && FRAG[stored]) return stored;
      var n = (navigator.language || "en").toLowerCase();
      if (n.indexOf("pt") === 0) return "pt";
      if (n.indexOf("es") === 0) return "es";
      return "en";
    }

    // A language with no matching section falls back to English; if even English has no
    // section, the first one in document order wins. This is what makes "zero active
    // sections" impossible.
    function resolveLang(lang) {
      var i;
      for (i = 0; i < sections.length; i++) {
        if (sections[i].dataset.lang === lang) return lang;
      }
      for (i = 0; i < sections.length; i++) {
        if (sections[i].dataset.lang === "en") return "en";
      }
      return sections.length ? sections[0].dataset.lang : "en";
    }

    function apply(lang, updateHash) {
      lang = resolveLang(lang);

      var activated = false;
      sections.forEach(function (s) {
        // Two sections sharing a data-lang value would be a markup bug, but it must
        // still yield exactly one active panel: only the first match wins.
        var on = !activated && s.dataset.lang === lang;
        if (on) activated = true;
        s.toggleAttribute("data-lang-active", on);
        if (on) s.removeAttribute("aria-hidden");
        else s.setAttribute("aria-hidden", "true");
      });

      tabs.forEach(function (t) {
        var on = t.dataset.langTarget === lang;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });

      i18nEls.forEach(function (el) {
        var v = el.getAttribute("data-i18n-" + lang);
        el.textContent = v != null ? v : el.dataset.i18nBaseline;
      });

      document.documentElement.lang = LANG_ATTR[lang] || lang;

      // Carry the language across navigation. Two independent mechanisms, because
      // either one alone has a hole: storage is unavailable in private browsing, and
      // fragments are lost if a reader edits the URL or follows a link from elsewhere.
      var frag = FRAG[lang] || "#top";
      pageLinks.forEach(function (a) {
        a.setAttribute("href", (a.getAttribute("href") || "").split("#")[0] + frag);
      });

      if (updateHash) {
        writeStored(lang);
        // replaceState, not a hash assignment: switching language should not fill the
        // back button with one entry per tap, and should not scroll the page.
        history.replaceState(null, "", frag);
      }
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { apply(t.dataset.langTarget, true); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var next = tabs[(i + d + tabs.length) % tabs.length];
        next.focus();
        apply(next.dataset.langTarget, true);
      });
    });

    apply(pick(), false);
    window.addEventListener("hashchange", function () { apply(pick(), false); });

  } catch (err) {
    // Setup did not complete, so withdraw the permission data-js grants the stylesheet
    // to hide content. Without it the no-JS branch takes over and all three languages
    // render stacked — the same known-good degraded state as a script that never ran.
    // Never rethrow past this point.
    document.documentElement.removeAttribute("data-js");
    console.error("site.js: language-tab setup failed, falling back to stacked languages", err);
  }
})();
