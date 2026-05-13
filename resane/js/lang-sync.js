(function () {
  var STORAGE_KEY = 'site-language';
  var SUPPORTED_LANGUAGES = ['zh', 'en', 'pt', 'ja'];
  var DEFAULT_LANGUAGE = 'zh';
  function normalizeLanguage(lang) {
    return SUPPORTED_LANGUAGES.indexOf(lang) >= 0 ? lang : DEFAULT_LANGUAGE;
  }

  function getCurrentPathLanguage() {
    var segments = getPathSegments(window.location.pathname || '/');
    return segments.length && SUPPORTED_LANGUAGES.indexOf(segments[0]) >= 0 ? segments[0] : DEFAULT_LANGUAGE;
  }

  function getStoredLanguage() {
    try {
      return normalizeLanguage(localStorage.getItem(STORAGE_KEY) || getCurrentPathLanguage());
    } catch (error) {
      return getCurrentPathLanguage();
    }
  }

  function getActiveLanguage() {
    return getCurrentPathLanguage();
  }

  function setStoredLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, normalizeLanguage(lang));
    } catch (error) {
      // ignore storage errors
    }
  }

  function getPathSegments(pathname) {
    return pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  }

  function stripLanguagePrefix(pathname) {
    var segments = getPathSegments(pathname);
    if (segments.length && SUPPORTED_LANGUAGES.indexOf(segments[0]) >= 0) {
      segments.shift();
      return '/' + segments.join('/');
    }
    return pathname;
  }

  function buildLanguagePath(pathname, lang) {
    var cleanLang = normalizeLanguage(lang);
    var basePath = stripLanguagePrefix(pathname);
    var normalizedPath = basePath === '/' ? '/' : '/' + getPathSegments(basePath).join('/');

    if (normalizedPath === '/index.html') {
      normalizedPath = '/';
    }

    if (cleanLang === DEFAULT_LANGUAGE) {
      return normalizedPath;
    }

    if (normalizedPath === '/') {
      return '/' + cleanLang + '/';
    }

    return '/' + cleanLang + normalizedPath;
  }

  function shouldHandleLink(anchor) {
    if (!anchor || !anchor.getAttribute) return false;
    var href = anchor.getAttribute('href');
    if (!href || href.indexOf('#') === 0) return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    return true;
  }

  function toLocalizedUrl(url, lang) {
    try {
      var targetUrl = new URL(url, window.location.origin);
      if (targetUrl.origin !== window.location.origin) {
        return targetUrl.toString();
      }

      var localizedPath = buildLanguagePath(targetUrl.pathname, lang);
      targetUrl.pathname = localizedPath;
      return targetUrl.toString();
    } catch (error) {
      return url;
    }
  }

  function syncSelectorValue(lang) {
    var selector = document.getElementById('language-selector');
    if (selector) {
      selector.value = normalizeLanguage(lang);
    }
  }

  function redirectToCurrentLanguage() {
    var lang = getStoredLanguage();
    var expectedPath = buildLanguagePath(window.location.pathname, lang);
    var currentPath = window.location.pathname || '/';

    if (expectedPath !== currentPath) {
      window.location.replace(expectedPath + window.location.search + window.location.hash);
    }
  }

  function bindLanguageSelector() {
    var selector = document.getElementById('language-selector');
    if (!selector) return;

    syncSelectorValue(getActiveLanguage());

    selector.addEventListener('change', function () {
      var selectedLanguage = normalizeLanguage(selector.value);
      setStoredLanguage(selectedLanguage);
      var targetPath = buildLanguagePath(window.location.pathname, selectedLanguage);
      window.location.href = targetPath + window.location.search + window.location.hash;
    });
  }

  function bindInternalLinks() {
    document.addEventListener('click', function (event) {
      var anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (!shouldHandleLink(anchor)) return;

      var localizedHref = toLocalizedUrl(anchor.href, getActiveLanguage());
      if (localizedHref !== anchor.href) {
        anchor.href = localizedHref;
      }
    }, true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setStoredLanguage(getCurrentPathLanguage());
    bindLanguageSelector();
    bindInternalLinks();
  });
})();
