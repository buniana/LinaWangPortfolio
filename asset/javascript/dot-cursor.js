/* Dot cursor — Ink → Light pink
   A small ink dot follows the pointer. Over dark areas (dark sections, dark parts of
   images, the ride canvas) it turns light pink. Over links and buttons it slowly grows
   (10 → 20px) and fades. Only on devices with a real mouse/trackpad. */
(function () {
  if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var INK = '#111318', PINK = '#F7C6D4', BRAND = '#DE7E98', WHITE = '#FFFFFF';
  var NAV = 'header'; // the glass nav bar: dot turns brand pink there, and a soft white circle on hover
  var CLICKABLE = 'a, button, [role="button"], label, summary, select, [onclick], .card, .holder-hit';
  var HIDE = '.np'; // the Next Project spotlight already is the cursor
  var NATIVE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], iframe';

  var css =
    'html.lw-dot, html.lw-dot :not(input):not(textarea):not(select):not([contenteditable]){cursor:none!important}' +
    '.lw-dot-cur{position:fixed;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;' +
    '--dc:' + INK + ';pointer-events:none;z-index:2147483646;transform:translate3d(-100px,-100px,0);will-change:transform}' +
    '.lw-dot-cur i{position:absolute;inset:0;border-radius:50%;background:var(--dc);transform:scale(.5);backface-visibility:hidden;' +
    'transition:transform .8s cubic-bezier(.22,.61,.36,1),opacity .6s ease,background-color .35s ease,box-shadow .35s ease}' +
    '.lw-dot-cur{transition:opacity .25s ease}' +
    '.lw-dot-cur.lw-big i{transform:scale(1);opacity:.3;transition-delay:.12s}' +
    '.lw-dot-cur.lw-dk.lw-big i{opacity:.45}' + // on dark: see-through light pink (a touch stronger than ink, since pink on dark reads fainter)
    '.lw-dot-cur.lw-off{opacity:0}';

  function start() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var el = document.createElement('div'); el.className = 'lw-dot-cur lw-off'; el.setAttribute('aria-hidden', 'true');
    el.appendChild(document.createElement('i')); document.body.appendChild(el);
    document.documentElement.classList.add('lw-dot');

    // carry the last position across page loads so the dot doesn't vanish after a click
    var tx = -100, ty = -100, seen = false;
    try { var p = JSON.parse(sessionStorage.getItem('lw-dot') || 'null');
      if (p && Date.now() - p.t < 5000) { tx = p.x; ty = p.y; seen = true; } } catch (e) {}
    var x = tx, y = ty, hidden = !seen;
    addEventListener('pagehide', function () {
      try { sessionStorage.setItem('lw-dot', JSON.stringify({ x: tx, y: ty, t: Date.now() })); } catch (e) {}
    });

    addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      tx = e.clientX; ty = e.clientY;
      if (!seen) { x = tx; y = ty; seen = true; }
      hidden = false;
    }, { passive: true });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) hidden = true; });
    addEventListener('blur', function () { hidden = true; });

    // ---- how bright is the page right under the dot? ----
    var cache = new WeakMap();
    function avg(d) { var L = 0, n = 0;
      for (var i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; L += (.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]) / 255; n++; }
      return n ? L / n : null; }
    function imgLum(img, px, py) {
      if (!img.complete || !img.naturalWidth) return null;
      var c = cache.get(img);
      if (!c) { var k = Math.min(1, 480 / img.naturalWidth); c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        try { c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, c.width, c.height); } catch (e) { return null; }
        cache.set(img, c); }
      var b = img.getBoundingClientRect(), fit = getComputedStyle(img).objectFit;
      var s = fit === 'contain' ? Math.min(b.width / c.width, b.height / c.height)
            : fit === 'fill' || !fit ? null : Math.max(b.width / c.width, b.height / c.height);
      var ix, iy;
      if (s === null) { ix = (px - b.left) / b.width * c.width; iy = (py - b.top) / b.height * c.height; }
      else { ix = (px - b.left - (b.width - c.width * s) / 2) / s; iy = (py - b.top - (b.height - c.height * s) / 2) / s; }
      if (ix < 0 || iy < 0 || ix >= c.width || iy >= c.height) return null;
      try { return avg(c.getContext('2d').getImageData(Math.max(0, Math.round(ix) - 2), Math.max(0, Math.round(iy) - 2), 5, 5).data); }
      catch (e) { return null; }
    }
    // Reading pixels straight from the page's canvas makes Chrome move that canvas off the GPU,
    // which slows the whole ride down. So copy just a 5x5 patch into our own tiny canvas,
    // and only a few times a second.
    var tiny = document.createElement('canvas'); tiny.width = tiny.height = 5;
    var tg = tiny.getContext('2d', { willReadFrequently: true }), cvAt = 0, cvL = null;
    function canvasLum(cv, px, py) {
      var now = performance.now();
      if (now - cvAt < 250) return cvL; cvAt = now;
      var b = cv.getBoundingClientRect(); if (!b.width || !b.height) return null;
      var ix = (px - b.left) / b.width * cv.width, iy = (py - b.top) / b.height * cv.height;
      try { tg.clearRect(0, 0, 5, 5); tg.drawImage(cv, Math.max(0, ix - 2), Math.max(0, iy - 2), 5, 5, 0, 0, 5, 5);
        cvL = avg(tg.getImageData(0, 0, 5, 5).data); } catch (e) { cvL = null; }
      return cvL;
    }
    function bgOf(e) {
      var m = getComputedStyle(e).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] > .5)) return (.2126 * m[0] + .7152 * m[1] + .0722 * m[2]) / 255;
      return null;
    }
    function lumAt(px, py) {
      var stack = document.elementsFromPoint(px, py);
      for (var i = 0; i < stack.length; i++) {
        var e = stack[i], l = null;
        if (e === document.documentElement) break;
        if (e.tagName === 'IMG') l = imgLum(e, px, py);
        else if (e.tagName === 'CANVAS') l = canvasLum(e, px, py);
        else l = bgOf(e);
        if (l !== null) return l;
      }
      var r = bgOf(document.body); if (r !== null) return r;
      r = bgOf(document.documentElement); return r !== null ? r : 1;
    }

    var last = 0, darkSeen = false, darkSince = 0, darkNow = false, big = false, off = true, nav = false, color = INK;
    function check(now) {
      if (now - last < 40) return; last = now;
      // colour follows where the DOT is (it trails the pointer a little);
      // two thresholds + a short wait keep it from flickering at edges
      var L = lumAt(x, y), dark = darkSeen ? L < .5 : L < .4;
      if (dark !== darkSeen) { darkSeen = dark; darkSince = now; }
      if (darkSeen !== darkNow && now - darkSince > 90) darkNow = darkSeen;
      var t = document.elementFromPoint(tx, ty);
      var native = !!(t && t.closest(NATIVE));
      var skip = !!(t && t.closest(HIDE));
      var b = !!(t && !native && !skip && t.closest(CLICKABLE));
      if (b !== big) { big = b; el.classList.toggle('lw-big', b); }
      var col = darkNow ? PINK : INK; // same everywhere, nav included: ink on light, light pink on dark
      if (col !== color) { color = col; el.style.setProperty('--dc', col); }
      el.classList.toggle('lw-dk', darkNow);
      var o = hidden || native || skip;
      if (o !== off) { off = o; el.classList.toggle('lw-off', o); }
    }
    (function loop(now) {
      x += (tx - x) * .32; y += (ty - y) * .32;
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      if (seen) check(now || 0);
      requestAnimationFrame(loop);
    })();
  }

  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
