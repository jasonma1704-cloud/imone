/**
 * imone site language switcher
 * - Default language: English (root paths, no /en/ prefix)
 * - Other languages: /zh/, /pt/, /ja/
 */
(function () {
  'use strict';

  if (window.__IMONE_LANG_INIT__) {
    return;
  }
  window.__IMONE_LANG_INIT__ = true;

  var STORAGE_KEY = 'siteLang';
  var DEFAULT_LANG = 'en';
  var SUPPORTED_LANGS = ['en', 'zh', 'pt', 'ja'];
  var LANG_PREFIXES = ['zh', 'pt', 'ja'];

  function detectLangFromPath(pathname) {
    var parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0 && LANG_PREFIXES.indexOf(parts[0]) !== -1) {
      return parts[0];
    }
    return DEFAULT_LANG;
  }

  function getPagePathWithoutLang(pathname) {
    var path = pathname;

    for (var i = 0; i < LANG_PREFIXES.length; i++) {
      var lang = LANG_PREFIXES[i];
      var prefix = '/' + lang;
      if (path === prefix || path === prefix + '/') {
        path = '/';
        break;
      }
      if (path.indexOf(prefix + '/') === 0) {
        path = path.slice(prefix.length);
        break;
      }
    }

    path = path.replace(/^\//, '');
    if (!path) {
      return 'index.html';
    }
    if (path.charAt(path.length - 1) === '/') {
      path += 'index.html';
    }
    return path;
  }

  function buildUrl(targetLang, pagePath) {
    var suffix = window.location.search + window.location.hash;

    if (targetLang === DEFAULT_LANG) {
      if (pagePath === 'index.html') {
        return '/' + suffix;
      }
      return '/' + pagePath + suffix;
    }

    if (pagePath === 'index.html') {
      return '/' + targetLang + '/' + suffix;
    }

    return '/' + targetLang + '/' + pagePath + suffix;
  }

  /** Always derive language from URL (fixes back-button / bfcache stale select). */
  function syncSelectorFromUrl() {
    var selector = document.getElementById('language-selector');
    if (!selector) {
      return;
    }

    var currentLang = detectLangFromPath(window.location.pathname);
    if (selector.value !== currentLang) {
      selector.value = currentLang;
    }
    localStorage.setItem(STORAGE_KEY, currentLang);
  }

  function bindSelectorOnce() {
    var selector = document.getElementById('language-selector');
    if (!selector || selector.dataset.langSwitcherBound === '1') {
      return;
    }
    selector.dataset.langSwitcherBound = '1';

    selector.addEventListener('change', function () {
      var newLang = this.value;
      if (SUPPORTED_LANGS.indexOf(newLang) === -1) {
        newLang = DEFAULT_LANG;
      }

      var currentLang = detectLangFromPath(window.location.pathname);
      var pagePath = getPagePathWithoutLang(window.location.pathname);
      if (newLang === currentLang) {
        syncSelectorFromUrl();
        return;
      }

      localStorage.setItem(STORAGE_KEY, newLang);
      window.location.assign(buildUrl(newLang, pagePath));
    });
  }

  function boot() {
    syncSelectorFromUrl();
    bindSelectorOnce();
  }

  // Back/forward may restore page from cache without re-running DOMContentLoaded.
  window.addEventListener('pageshow', syncSelectorFromUrl);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
