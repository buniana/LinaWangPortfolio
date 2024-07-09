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

  window.addEventListener("contactme", function() {
    let contactmebutton = document.querySelector(".contactbutton");
    contactmebutton.addEventListener("click", function() {
      window.open(String('mailto:jiayuwang0815@berkeley.edu').replace('^', '@') );

    });
  });