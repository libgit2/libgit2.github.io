$(function () {
  var toc = $('#toc');
  if (toc.length == 0) {
    return;
  }

  // Keep the TOC in view
  $(window).scroll(function(){
    $("#toc")
      .stop()
      .animate({"marginTop": ($(window).scrollTop()) + "px",
                "marginLeft":($(window).scrollLeft()) + "px"},
               "fast");
  });

  // Generate the TOC contents
  var current_level = 0;
  $('#primary :header[id]').each(function(i, el) {
    var del = $(el);
    console.log(el);

    var div = $('<div></div>')
      .addClass('toc-' + el.nodeName.toLowerCase());
    div.append($('<a></a>')
      .attr('href', '#' + del.attr('id'))
      .text(del.text()));
    toc.append(div);
  });
});
