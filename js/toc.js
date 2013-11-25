$(function () {
  var toc = $('#toc');
  if (toc.length == 0) {
    return;
  }

  // Generate the TOC contents
  var current_level = 0;
  $('#primary :header[id]').each(function(i, el) {
    var del = $(el);
    console.log(el);

    var div = $('<div></div>')
      .addClass('toc-' + el.nodeName.toLowerCase());
    div.append($('<a></a>')
      .attr('href', '#' + del.attr('id'))
      .html(del.html()));
    toc.append(div);
  });
});
