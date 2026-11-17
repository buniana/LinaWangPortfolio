/* Lina Wang · page transition
   Same move as the end of the portfolio video, in the light version.
   · Clicking a link: the ring closes onto the logo over the current page, then opens like an iris on the next page.
   · Browser Back / Forward: the same, in that order. The page you are leaving shrinks into the ring and the logo,
     then the ring opens on the page you return to. (Uses cross-document view transitions — Chrome/Edge 126+,
     Safari 18.2+. Other browsers just get the opening half.)
   Load this file in <head> (not deferred) on every page. */
(function () {
  var KEY = 'lw-iris', PAPER = '#FDFCFB', PINK = '#DE7E98', INK = '#111318';
  var LPATH = 'M19.321 32V14.5455H23.5398V28.5739H30.8011V32H19.321Z';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var de = document.documentElement;
  // keep the page from shifting sideways when its scrollbar appears while it loads
  try { de.style.scrollbarGutter = 'stable'; } catch (e) {}
  // opt in to cross-document view transitions so Back/Forward can animate the page being left;
  // the browser's own crossfade is switched off, we draw everything ourselves
  var vtCSS = document.createElement('style');
  vtCSS.textContent = '@view-transition{navigation:auto}' +
    '::view-transition-group(root){animation:none}' +
    '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}' +
    '::view-transition-old(root){z-index:2}::view-transition-new(root){z-index:1}';
  document.head.appendChild(vtCSS);

  var viaLink = false;
  try { var ts = +sessionStorage.getItem(KEY); viaLink = ts && Date.now() - ts < 6000; sessionStorage.removeItem(KEY); } catch (e) {}
  var navType = 'navigate';
  try { var ne = performance.getEntriesByType('navigation')[0]; if (ne) navType = ne.type; } catch (e) {}
  var viaHistory = navType === 'back_forward';
  var canVT = 'onpagereveal' in window;

  // geometry from the window itself, identical on every page, scrollbar or not
  function geo() {
    var W = innerWidth, H = innerHeight, K = Math.min(3.2, Math.min(W, H) / 260);
    return { W: W, H: H, CX: Math.round(W / 2), CY: Math.round(H / 2), K: K, R0: 20 * K, SW0: 7 * K, DIAG: Math.hypot(W, H) / 2 + 60 };
  }
  var NS = 'http://www.w3.org/2000/svg', svg, mr, hole, bg, ring, L;
  function build() {
    if (svg) return;
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;display:none';
    svg.innerHTML = '<defs><mask id="lw-iris-m" maskUnits="userSpaceOnUse"><rect fill="#fff"/><circle r="0" fill="#000"/></mask></defs>' +
      '<rect mask="url(#lw-iris-m)" fill="' + PAPER + '"/><circle fill="none" stroke="' + PINK + '"/>' +
      '<g><path d="' + LPATH + '" fill="' + INK + '"/></g>';
    mr = svg.querySelector('mask rect'); hole = svg.querySelector('mask circle');
    bg = svg.children[1]; ring = svg.children[2]; L = svg.children[3];
    (document.body || de).appendChild(svg);
  }
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a)); };
  var eio = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var mix = function (a, b, k) { var A = [1,3,5].map(function(i){ return parseInt(a.slice(i,i+2),16); }), B = [1,3,5].map(function(i){ return parseInt(b.slice(i,i+2),16); });
    return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * k); }).join(',') + ')'; };
  var back = function (x) { if (x <= 0) return 0; var c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

  function draw(R, sw, holeR, Ls, La, ringA) {
    var g = geo();
    svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H);
    svg.style.width = g.W + 'px'; svg.style.height = g.H + 'px';
    mr.setAttribute('width', g.W); mr.setAttribute('height', g.H); bg.setAttribute('width', g.W); bg.setAttribute('height', g.H);
    hole.setAttribute('cx', g.CX); hole.setAttribute('cy', g.CY); hole.setAttribute('r', Math.max(0, holeR));
    ring.setAttribute('cx', g.CX); ring.setAttribute('cy', g.CY); ring.setAttribute('r', R); ring.setAttribute('stroke-width', sw); ring.style.opacity = ringA;
    L.setAttribute('transform', 'translate(' + g.CX + ' ' + g.CY + ') scale(' + (g.K * Ls) + ') translate(-23.5 -23.5)'); L.style.opacity = La;
  }
  function closedState() { var g = geo(); draw(g.R0, g.SW0, 0, 1, 1, 1); }
  function run(dur, frame, done) {
    var t0 = performance.now();
    (function step(now) { var t = Math.min(dur, (now - t0) / 1000); frame(t); if (t < dur) requestAnimationFrame(step); else if (done) done(); })(t0);
  }

  // ---- the closing half: ring shrinks onto the logo; hole = the radius of whatever is still showing through ----
  var CLOSE = 1.0;
  function closeAt(t) {
    var g = geo(), c = eio(seg(t, 0, .7)), R = g.DIAG + (g.R0 - g.DIAG) * c, sw = g.SW0 * (2.4 - 1.4 * c);
    return { R: R, sw: sw, hole: (R - sw / 2 + 1) * (1 - seg(t, .62, .74)), lp: seg(t, .62, .95) };
  }
  function playClose(showHole, done) {
    build(); svg.style.display = 'block'; ring.setAttribute('stroke', PINK);
    run(CLOSE, function (t) {
      if (t >= CLOSE) { closedState(); return; }
      var s = closeAt(t);
      draw(s.R, s.sw, showHole ? s.hole : 0, back(s.lp), s.lp > 0 ? 1 : 0, clamp(t / .12));
    }, done);
  }

  // ---- the opening half: the L shrinks away and the ring opens onto the page ----
  var opening = false;
  function arrive() {
    if (opening) return; opening = true;
    build(); svg.style.display = 'block'; closedState();
    run(1.05, function (t) {
      var g = geo(), lo = seg(t, 0, .2), o = eio(seg(t, .15, .95));
      var R = g.R0 + (g.DIAG - g.R0) * o, sw = g.SW0 * (1 + 1.4 * o), hk = seg(t, .14, .3);
      // as it opens, the pink ring turns into the page's paper colour (over 0.5s) so it melts into the page
      ring.setAttribute('stroke', mix(PINK, PAPER, eio(seg(t, .15, .65))));
      draw(R, sw, (R - sw / 2 + 1) * hk, 1 - .35 * eio(lo), 1 - lo, 1);
    }, function () { svg.style.display = 'none'; ring.setAttribute('stroke', PINK); opening = false; });
  }
  // start the opening once the new page has settled (two smooth frames in a row), so it doesn't stutter
  function arriveWhenCalm(maxWait) {
    var t0 = performance.now(), last = t0, calm = 0;
    (function tick(now) {
      var dt = now - last; last = now; calm = dt < 24 ? calm + 1 : 0;
      if (calm >= 3 || now - t0 > maxWait) arrive(); else requestAnimationFrame(tick);
    })(t0);
  }

  // ---- clicking a link ----
  var leaving = false;
  function leave(href) {
    if (leaving) return; leaving = true;
    playClose(true, function () {
      try { sessionStorage.setItem(KEY, String(Date.now())); } catch (e) {}
      location.href = href;
    });
  }

  // ---- Back / Forward with a view transition: shrink the old page into the ring, then open the new one ----
  var handledByVT = false;
  function reverseWithVT(vt) {
    handledByVT = true;
    var g = geo(), frames = [], n = 40;
    for (var i = 0; i <= n; i++) { var s = closeAt(i / n * CLOSE); frames.push({ clipPath: 'circle(' + Math.max(0, s.hole).toFixed(1) + 'px at ' + g.CX + 'px ' + g.CY + 'px)' }); }
    vt.ready.then(function () {
      de.animate(frames, { duration: CLOSE * 1000, easing: 'linear', fill: 'forwards', pseudoElement: '::view-transition-old(root)' });
      de.animate([{ opacity: 1 }, { opacity: 1 }], { duration: CLOSE * 1000, pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
    // underneath the old page, this page draws the paper, the ring and the logo popping in, in step with the clip
    playClose(false, function () { arriveWhenCalm(300); });
  }

  if (canVT) {
    window.addEventListener('pagereveal', function (e) {
      var vt = e.viewTransition;
      var traverse = viaHistory;
      try { if (window.navigation && navigation.activation) traverse = navigation.activation.navigationType === 'traverse'; } catch (er) {}
      if (vt && traverse) { opening = false; reverseWithVT(vt); return; }
      if (vt){ vt.ready.catch(function(){}); vt.finished.catch(function(){}); vt.updateCallbackDone.catch(function(){}); vt.skipTransition(); }   // link clicks already animated themselves
      if (traverse && !handledByVT) { build(); svg.style.display = 'block'; closedState(); arriveWhenCalm(700); }
    });
  }

  // cover the page right away with the closed logo when we arrive through a link
  // (and through Back/Forward on browsers without view transitions)
  if (viaLink || (viaHistory && !canVT)) { build(); svg.style.display = 'block'; closedState(); }

  function isPageLink(a, e) {
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;
    var raw = a.getAttribute('href') || '';
    if (!raw || raw.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(raw)) return false;
    var u; try { u = new URL(a.href, location.href); } catch (er) { return false; }
    if (u.origin !== location.origin) return false;
    if (u.pathname === location.pathname && u.search === location.search) return false;
    return true;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (svg && svg.parentNode !== document.body) document.body.appendChild(svg);
    if (viaLink || (viaHistory && !canVT)) arriveWhenCalm(700);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!isPageLink(a, e)) return;
      e.preventDefault(); leave(a.href);
    });
  });

  // restored from the browser's page cache: if no view transition took care of it, open the page
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (!handledByVT && !opening) { build(); svg.style.display = 'block'; closedState(); arrive(); } handledByVT = false; }); });
  });
})();
