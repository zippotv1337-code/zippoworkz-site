// TikTok OAuth lands here (public HTTPS) and hands the one-time code to UNITY on the owner's own PC, which stays private.
(function () {
  var UNITY = 'http://127.0.0.1:4180/api/tiktok/oauth/callback';
  var src = new URLSearchParams(location.search);
  if (!src.has('code') && !src.has('error')) return; // plain visit: just show the page
  var out = new URLSearchParams();
  ['code', 'state', 'scopes', 'error', 'error_description'].forEach(function (k) {
    if (src.has(k)) out.set(k, src.get(k));
  });
  history.replaceState(null, '', location.pathname); // keep the code out of history
  location.replace(UNITY + '?' + out.toString());
})();
