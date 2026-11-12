// nurtur 2.0 — reveal on scroll, before/after slider, cycling hero phone
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll
  var items = document.querySelectorAll('.rv, .flow');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // Before / after slider
  document.querySelectorAll('[data-ba]').forEach(function (ba) {
    var input = ba.querySelector('input[type=range]');
    var set = function () { ba.style.setProperty('--pos', input.value + '%'); };
    input.addEventListener('input', set);
    set();
  });

  // Cycling phone (hero B)
  document.querySelectorAll('[data-cycler]').forEach(function (c) {
    var imgs = c.querySelectorAll('.screens img');
    var dots = c.querySelectorAll('.dots button');
    var cap = c.querySelector('.cycler-caption');
    var names = ['Guided session', 'Personal settings', 'Well-being check', 'Help recommendation', 'Support options'];
    var i = 0, timer = null;
    function show(n) {
      i = n;
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === n); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === n); d.setAttribute('aria-selected', k === n); });
      if (cap) cap.textContent = names[n] || '';
    }
    function start() { if (!reduce) timer = setInterval(function () { show((i + 1) % imgs.length); }, 2800); }
    dots.forEach(function (d, k) {
      d.addEventListener('click', function () { clearInterval(timer); show(k); start(); });
    });
    c.addEventListener('mouseenter', function () { clearInterval(timer); });
    c.addEventListener('mouseleave', function () { clearInterval(timer); start(); });
    start();
  });
})();
