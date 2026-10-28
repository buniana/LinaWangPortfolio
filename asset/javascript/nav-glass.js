// Mobile menu for pages that don't load javascript.js
window.addEventListener('DOMContentLoaded',function(){
  var btn=document.getElementById('navToggle'), overlay=document.getElementById('mobileOverlay'), closeBtn=document.getElementById('overlayClose');
  if(!btn||!overlay) return;
  var last=null;
  function open(){ last=document.activeElement; overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.body.classList.add('no-scroll'); btn.setAttribute('aria-expanded','true'); var f=overlay.querySelector('a,button'); if(f) f.focus(); }
  function close(){ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); document.body.classList.remove('no-scroll'); btn.setAttribute('aria-expanded','false'); if(last) last.focus(); }
  btn.addEventListener('click',function(e){ e.stopPropagation(); open(); });
  overlay.addEventListener('click',function(e){ if(e.target.hasAttribute('data-close-overlay')) close(); });
  if(closeBtn) closeBtn.addEventListener('click',close);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&overlay.classList.contains('open')) close(); });
});
