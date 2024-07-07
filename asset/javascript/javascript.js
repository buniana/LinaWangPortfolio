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