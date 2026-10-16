// Mobile nav toggle
(function () {
  var btn = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (btn && links) {
    btn.addEventListener('click', function () {
      links.classList.toggle('open');
      btn.setAttribute('aria-expanded', links.classList.contains('open'));
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // Remember language preference for the home links
  try {
    var path = location.pathname;
    if (path.indexOf('/ja/') !== -1) localStorage.setItem('groupings_lang', 'ja');
    else if (/index\.html$|\/$|\.html$/.test(path)) localStorage.setItem('groupings_lang', 'en');
  } catch (e) {}
})();
