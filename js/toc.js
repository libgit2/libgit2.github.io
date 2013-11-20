$(window).scroll(function(){
  $("#toc")
    .stop()
    .animate({"marginTop": ($(window).scrollTop()) + "px",
              "marginLeft":($(window).scrollLeft()) + "px"},
             "fast");
});
