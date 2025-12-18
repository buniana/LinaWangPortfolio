// window.addEventListener("load", ()=> {
//     document.querySelector(".loader").classList.add("loader--hidden");
// })

window.addEventListener("DOMContentLoaded", function() {
    let boxes = document.querySelectorAll(".box");
  
    Array.from(boxes, function(box) {
      box.addEventListener("click", function() {
        let pagename = this.classList[1];
        let destination = pagename.concat(".html");
        window.location.href = destination;
      });
    });
  });

   // Boxes click handler (keep if you need it)
  window.addEventListener("DOMContentLoaded", function() {
    const boxes = document.querySelectorAll(".box");
    boxes.forEach((box) => {
      box.addEventListener("click", function() {
        const pagename = this.classList[1];
        if (pagename) window.location.href = pagename + ".html";
      });
    });
  });

  // ---- Mobile overlay menu (single source of truth) ----
  window.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById('navToggle');              // hamburger
    const overlay = document.getElementById('mobileOverlay');      // overlay root
    const closeBtn = document.getElementById('overlayClose');      // close (X)
    const focusableSel = 'a,button,[href],[tabindex]:not([tabindex="-1"])';
    let lastFocused = null;

    if (!btn || !overlay) return; // guard

    function openOverlay() {
      lastFocused = document.activeElement;
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      const first = overlay.querySelector(focusableSel);
      if (first) first.focus();
      btn.setAttribute('aria-expanded', 'true');
    }

    function closeOverlay() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      btn.setAttribute('aria-expanded', 'false');
      if (lastFocused) lastFocused.focus();
    }

    // open on hamburger click
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openOverlay();
    });

    // close on backdrop or explicit close
    overlay.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close-overlay')) closeOverlay();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);

    // close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay();
    });
  });

  // window.addEventListener("contactme", function() {
  //   let contactmebutton = document.querySelector(".contactbutton");
  //   contactmebutton.addEventListener("click", function() {
  //     window.open('mailto:jiayuwang0815@berkeley.edu');

  //   });
  // });

  // document.addEventListener("DOMContentLoaded", function() {
  //   let contactmebutton = document.querySelector(".contactbutton");
  //   contactmebutton.addEventListener("click", function() {
  //     window.open('mailto:jiayuwang0815@berkeley.edu');
  //   });
  // });


document.addEventListener("DOMContentLoaded", function() {
  const section = document.getElementById("np");
  if (!section) return;

  const setSpotlight = (e) => {
    const rect = section.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    section.style.setProperty("--mx", x + "%");
    section.style.setProperty("--my", y + "%");
  };

  section.addEventListener("mouseenter", () => section.classList.add("is-active"));
  section.addEventListener("mouseleave", () => section.classList.remove("is-active"));
  section.addEventListener("mousemove", setSpotlight);
});

