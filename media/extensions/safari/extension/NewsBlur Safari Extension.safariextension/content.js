document.addEventListener("beforeload", function(e) {
  if (/feed:\/\//.test(window.location.href)) {
    window.location = "http://www.pytune.com/?url=" + encodeURIComponent(window.location.href.replace('feed://', 'http://'));
  }
}, true);