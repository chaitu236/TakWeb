var white_piece_styles = ["simple", "coral"];
var black_piece_styles = ["simple", "pietersite"];
var white_square_styles = ["simple", "ornate", "sand-velvet", "white-velvet"];
var black_square_styles = ["simple", "red-ornate", "sand-velvet", "blue-velvet"];

function make_board_selector(color)
{
  var form = $('#'+color+'_squares_form')

  if (color === 'white') {
    arr = white_square_styles;
    call = 'radioBoardStyleWhite';
  } else {
    arr = black_square_styles;
    call = 'radioBoardStyleBlack';
  }

  for(var i=0;i<arr.length;i++) {
    var style = arr[i];
    console.log('style='+style);
    var div = $('<div/>').addClass('radio-list-item');
    var inp = $('<input/>').attr('id', 'board-style-'+color+'-' + style)
                           .attr('type', 'radio')
                           .attr('name', 'board-style');
    var img = $('<img/>').attr('src', 'images/board/preview/'+color+'_' + style + '.png')
                         .addClass('radio-list-img')
                         .height(50).width(50)
                         .attr('onClick', call+'(\''+style+'\')');
    div.append(inp).append(img);
    form.append(div);
  }
}

function make_piece_selector(color)
{
  var form = $('#'+color+'_pieces_form')

  if (color === 'white') {
    arr = white_piece_styles;
    call = 'radioPieceStyleWhite';
  } else {
    arr = black_piece_styles;
    call = 'radioPieceStyleBlack';
  }

  for(var i=0;i<arr.length;i++) {
    var style = arr[i];
    console.log('style='+style);
    var div = $('<div/>').addClass('radio-list-item');
    var inp = $('<input/>').attr('id', 'piece-style-'+color+'-' + style)
                           .attr('type', 'radio')
                           .attr('name', 'piece-style');
    var img = $('<img/>').attr('src', 'images/pieces/preview/'+color+'_' + style + '_pieces.png')
                         .addClass('radio-list-img')
                         .height(50).width(50)
                         .attr('onClick', call+'(\''+style+'\')');
    div.append(inp).append(img);
    form.append(div);
  }
}

function make_style_selector()
{
  make_board_selector('white');
  make_board_selector('black');
  make_piece_selector('white');
  make_piece_selector('black');
}
