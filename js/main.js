function alert(type, msg) {
    $('#alert-text').text(msg);
    var $alert = $('#alert');
    $alert.removeClass("alert-success alert-info alert-warning alert-danger");

    $alert.addClass("alert-"+type);
    $alert.removeClass('hidden');
    $alert.stop(true, true);
    $alert.fadeTo(4000, 500).slideUp(500, function() {
        $alert.addClass('hidden');
    });
    alert2(type, msg);
}

function alert2(type, msg) {
    $('#alert-text2').text(msg);
    var $alert = $('#alert2');
    $alert.removeClass("alert-success alert-info alert-warning alert-danger");

    $alert.addClass("alert-"+type);
    $alert.removeClass('hidden');
    $alert.stop(true, true);
    $alert.fadeTo(4000, 500).slideUp(500, function() {
        $alert.addClass('hidden');
    });
}

var camera, scene, renderer, light, canvas, controls = null;

// antialiasing must be disabled per default, so slower devices are not impaired.
var antialiasing_mode = false;

var botlist = {
    "TakticianBot": [0, "Very&nbsp;Hard"],
    "TakkerusBot": [5, "Very&nbsp;Hard"],
    "alphatak_bot": [10, "Hard"],
    "AaaarghBot": [15, "Hard"],
    "ShlktBot": [20, "Intermediate"],
    "IntuitionBot": [25, "Intermediate"],
    "takkybot": [30, "Easy"],
    "BeginnerBot": [40, "Beginner"],
    "FriendlyBot": [50, "Adjustable"],
    "TakticianBotDev": [60, "Experimental"],
    "FPABot":[65, "Experimental"],
    "alphabot": [70, "Experimental"],
    "cutak_bot": [80, "Experimental"]
};

init();
$(window).on("load", animate);

function init() {
    make_style_selector();
    // load the user settings.
    loadSettings();

    canvas = document.getElementById("gamecanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    camera = new THREE.PerspectiveCamera(70, canvas.width / canvas.height, 1, 2000);
    camera.position.set(0, canvas.width / 2, canvas.height / 2);
    //camera.updateProjectionMatrix();

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({canvas: canvas,
        antialias: antialiasing_mode});
    //renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize( window.innerWidth, window.innerHeight );
    //renderer.setSize( 800, 640);
    renderer.setClearColor(0xdddddd, 1);

    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keyup', onKeyUp, false);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minDistance = 200;
    controls.maxDistance = 1500;
    controls.enableKeys = false;
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("android") > -1 || ua.indexOf("iphone") > -1 ||
            ua.indexOf("ipod") > -1 || ua.indexOf("ipad") > -1)
        controls.zoomSpeed = 0.5;

    var geometry = new THREE.TorusGeometry(sq_size / 2 + 5, 3, 16, 100);
    //geometry.vertices.shift();
    highlighter = new THREE.Mesh(geometry, materials.highlighter);
    highlighter.rotateX(Math.PI / 2);

    canvas.addEventListener('mousedown', onDocumentMouseDown, false);
    canvas.addEventListener('mouseup', onDocumentMouseUp, false);
    canvas.addEventListener('mousemove', onDocumentMouseMove, false);

    board.create(5, "white", true);
    board.initEmpty();

    materials.updateBoardMaterials();
    materials.updatePieceMaterials();
}

function onWindowResize() {
  /*canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  renderer.setSize(canvas.width, canvas.height);

  camera.aspect = canvas.width / canvas.height;
  camera.updateProjectionMatrix();

  $('#chat').offset({ top: $('nav').height() + 5 });
  $('#chat-toggle-button').offset({ top: $('nav').height() + 7 });
  $('#chat').height(window.innerHeight - $('nav').height() - 85
      + (localStorage.getItem('hide-send')==='true' ? 34 : 0));

  if(isBreakpoint('xs') || isBreakpoint('sm')) {
    chathandler.hidechat();
    hidermenu();
  } else {
    chathandler.showchat();
    showrmenu();
  }*/
}

var dontanimate=false;
function animate() {
    setTimeout(function () {
        if(!dontanimate)
          requestAnimationFrame(animate);
    }, 1000 / 30);

    renderer.render(scene, camera);
    controls.update();
}

function onDocumentMouseMove(e) {
    e.preventDefault();
    var x = e.clientX - canvas.offsetLeft;
    var y = e.clientY - canvas.offsetTop;
    mouse.x = (x / canvas.width) * 2 - 1;
    mouse.y = -(y / canvas.height) * 2 + 1;

    board.mousemove();
}

function onDocumentMouseDown(e) {
    e.preventDefault();

    var x = e.clientX - canvas.offsetLeft;
    var y = e.clientY - canvas.offsetTop;
    mouse.x = (x / canvas.width) * 2 - 1;
    mouse.y = -(y / canvas.height) * 2 + 1;

    if (e.button === 2)
        board.rightclick();
    else {
      if(board.movecount !== board.moveshown)
        return;
      board.leftclick();
    }
}

function onDocumentMouseUp(e) {
    if (e.button === 2)
        board.rightup();
}

function onKeyUp(e) {
  switch(e.keyCode) {
    case 27://ESC
      stepback();
      stepforward();
      break;

    case 38://UP
      stepback();
      break;

    case 40://DOWN
      stepforward();
      break;
  }
}

function output(e) {
    console.log("output:" + e);
}

function buttonclick() {
    var input = document.getElementById("input");
    var data = input.value;
    input.value = "";
    server.send(data);
}

function scratchbutton(size) {
    if (board.observing)
        server.send("Unobserve " + board.gameno);
    if (board.scratch || board.observing) {
        board.clear();
        board.create(size, "white", true);
        board.initEmpty();
    }
}
function rmenu() {
    if($('#rmenu').hasClass('hidden'))
        showrmenu();
    else
        hidermenu();
}

function showrmenu() {
    $('#notation-toggle-text').html('<<<br>n<br>o<br>t<br>a<br>t<br>i<br>o<br>n');
    $('#rmenu').removeClass('hidden');
}

function hidermenu() {
    $('#rmenu').addClass('hidden');
    $('#notation-toggle-text').html('>><br>n<br>o<br>t<br>a<br>t<br>i<br>o<br>n');
}

function zoom(out) {
    console.log('zoom', out, controls);
    if (out)
        controls.constraint.dollyOut(1.5);
    else
        controls.constraint.dollyIn(1.5);
}

function load() {
    $('#loadmodal').modal('hide')
    if (!board.scratch && !board.observing) {
        alert('warning', "TPS/PTN won't be displayed in the middle of an online game");
        return;
    }

    server.unobserve();

    var text = $('#loadptntext').val();

    var tpsRE = /\[(TPS\s*)?\"?\s*([,x12345678SC\/]+)(\s+([\d+]))?(\s+(\d+|-))?\s*\"?\s*\]/;
    var tps = tpsRE.exec(text);

    dontanimate = true;

    if(!tps)
      board.loadptn(text);
    else
      board.loadtps(text);

    dontanimate = false;

    $('#loadptntext').val('');
}

function loadptn(text) {
    $('#loadmodal').modal('hide')
    var files = $('#loadptnfile')[0].files;
    if(files.length == 0)
        return;
    var reader = new FileReader();
    reader.onload = function(txt) {
        server.unobserve();
        board.loadptn(reader.result);
    }
    reader.readAsText(files[0]);
}

function volume_change() {
    var movesound = document.getElementById("move-sound");
    var chimesound = document.getElementById("chime-sound");

    if($('#volume-img').hasClass('fa-volume-off')) {
        movesound.muted = false;
        chimesound.muted = false;

        movesound.play();
        localStorage.setItem('sound', 'true');
    } else {
        movesound.muted = true;
        chimesound.muted = true;

        localStorage.setItem('sound', 'false');
    }
    $('#volume-img').toggleClass('fa-volume-up fa-volume-off');
}

function isBreakpoint( alias ) {
    return $('.device-' + alias).is(':hidden');
}

function startTime(fromFn) {
  if(typeof fromFn === 'undefined' && !server.timervar)
    return;
  var now = new Date();
  var t = now.getHours()*60*60 + now.getMinutes()*60+now.getSeconds();
  var elapsed = t-lastTimeUpdate;

  if(board.movecount%2 === 0) {
    t1 = lastWt - elapsed;
    $('.player1-time:first').html(parseInt(t1/60)+':'+getZero(t1%60));
  } else {
    t2 = lastBt - elapsed;
    $('.player2-time:first').html(parseInt(t2/60)+':'+getZero(t2%60));
  }

  server.timervar = setTimeout(startTime, 500);
}

function stopTime() {
  clearTimeout(server.timervar);
  server.timervar = null;
}

function getZero(t) {
  return t<10?'0'+t:t;
}

/*
 * Settings loaded on initialization. Try to keep them in the order of the window.
 * First the left-hand div, then the right-hand div.
 */
function loadSettings() {
  // load the setting for wall orientation.
  if(localStorage.getItem('diagonal_walls')==='true') {
    document.getElementById('wall-orientation').checked = true;
    diagonal_walls = true;
  }

  // load the setting for piece size.
  if(localStorage.getItem('piece_size')!==null) {
    piece_size = parseInt(localStorage.getItem('piece_size'));
    document.getElementById('piece-size-display').innerHTML = piece_size;
    document.getElementById('piece-size-slider').value = piece_size;
  }

  // load white piece style.
  if (localStorage.getItem('piece_style_white2')!==null) {
    var styleName = localStorage.getItem('piece_style_white2');
    materials.white_piece_style_name = styleName;
    materials.white_cap_style_name = styleName;
    document.getElementById('piece-style-white-' + styleName).checked = true;
  }

  // load black piece style.
  if (localStorage.getItem('piece_style_black2')!==null) {
    var styleName = localStorage.getItem('piece_style_black2');
    materials.black_piece_style_name = styleName;
    materials.black_cap_style_name = styleName;
    document.getElementById('piece-style-black-' + styleName).checked = true;
  }

  // load black board style.
  if (localStorage.getItem('board_style_black2')!==null) {
    var styleName = localStorage.getItem('board_style_black2');
    materials.black_sqr_style_name = styleName;
    document.getElementById('board-style-black-' + styleName).checked = true;
  }

  // load white board style.
  if (localStorage.getItem('board_style_white2')!==null) {
    var styleName = localStorage.getItem('board_style_white2');
    materials.white_sqr_style_name = styleName;
    document.getElementById('board-style-white-' + styleName).checked = true;
  }

  // load the setting for antialiasing.
  if(localStorage.getItem('antialiasing_mode')==='true') {
    document.getElementById('antialiasing-checkbox').checked = true;
    antialiasing_mode = true;
  }

  // load whether or not the 'Send' button should be hidden.
  if (localStorage.getItem('hide-send')==='true')
  {
    document.getElementById('hide-send-checkbox').checked = true;
    document.getElementById('send-button').style.display = "none";
    $('#chat').height(window.innerHeight - $('nav').height() - 51);
  }

  //load setting for hide chat time
  if (localStorage.getItem('hide-chat-time')==='true')
  {
    document.getElementById('hide-chat-time').checked = true;
    $('.chattime').each(function(index) {
      $(this).addClass('hidden');
    });
  }

  // load the setting for automatically rotating the board, when assigned player 2.
  if(localStorage.getItem('auto_rotate')==='false') {
    document.getElementById('auto-rotate-checkbox').checked = false;
  }

  /*//load chat width.. doesnt work properly
  if(localStorage.getItem('chat-width')!==null) {
    chat_width = Number(localStorage.getItem('chat-width'));
    console.log('val====='+chat_width);
    adjustChatWidth();
  }*/
}

/*
 * Notify checkbox change for checkbox:
 *   Diagonal walls
 */
function checkboxDiagonalWalls() {
  if (document.getElementById('wall-orientation').checked) {
    localStorage.setItem('diagonal_walls', 'true');
    diagonal_walls = true;
  } else {
    localStorage.setItem('diagonal_walls', 'false');
    diagonal_walls = false;
  }
  board.updatepieces();
}

/*
 * Notify slider movement:
 *   Piece size
 */
function sliderPieceSize(newSize) {
  localStorage.setItem('piece_size', newSize);
  document.getElementById('piece-size-display').innerHTML=newSize;
  piece_size = parseInt(newSize);
}

/*
 * Notify radio button check:
 *   Piece style - white
 */
function radioPieceStyleWhite(styleName) {
  document.getElementById('piece-style-white-' + styleName).checked = true;
  materials.white_piece_style_name = styleName;
  materials.white_cap_style_name = styleName;
  localStorage.setItem('piece_style_white2', styleName);
  board.updatepieces();
}

/*
 * Notify radio button check:
 *   Piece style - black
 */
function radioPieceStyleBlack(styleName) {
  document.getElementById('piece-style-black-' + styleName).checked = true;
  materials.black_piece_style_name = styleName;
  materials.black_cap_style_name = styleName;
  localStorage.setItem('piece_style_black2', styleName);
  board.updatepieces();
}

/*
 * Notify radio button check:
 *   Board style - black
 */
function radioBoardStyleBlack(styleName) {
  document.getElementById('board-style-black-' + styleName).checked = true;
  materials.black_sqr_style_name = styleName;
  localStorage.setItem('board_style_black2', styleName);
  board.updateboard();
}

/*
 * Notify radio button check:
 *   Board style - white
 */
function radioBoardStyleWhite(styleName) {
  document.getElementById('board-style-white-' + styleName).checked = true;
  materials.white_sqr_style_name = styleName;
  localStorage.setItem('board_style_white2', styleName);
  board.updateboard();
}

/*
 * Notify checkbox change for checkbox:
 *   Antialiasing
 */
function checkboxAntialiasing() {
  if (document.getElementById('antialiasing-checkbox').checked) {
    localStorage.setItem('antialiasing_mode', 'true');
  } else {
    localStorage.setItem('antialiasing_mode', 'false');
  }
}

/*
 * Notify checkbox change for checkbox:
 *   Hide 'Send' button
 */
function checkboxHideSend() {
  if (document.getElementById('hide-send-checkbox').checked) {
    localStorage.setItem('hide-send', 'true');
    document.getElementById('send-button').style.display = "none";
    $('#chat').height(window.innerHeight - $('nav').height() - 51);
  } else {
    localStorage.setItem('hide-send', 'false');
    document.getElementById('send-button').style.display = "initial";
    $('#chat').height(window.innerHeight - $('nav').height() - 85);
  }

}

/*
 * Notify checkbox change for checkbox:
 *   Rotate board when player 2
 */
function checkboxAutoRotate() {
  if (document.getElementById('auto-rotate-checkbox').checked) {
    localStorage.setItem('auto_rotate', 'true');
  } else {
    localStorage.setItem('auto_rotate', 'false');
  }
}

function showPrivacyPolicy() {
    $('#help-modal').modal('hide');
    $('#privacy-modal').modal('show');
}

function getHeader(key, val) {
  return '['+key+' "'+val+'"]\r\n';
}

function getNotation() {
    var p1 = $('.player1-name:first').html();
    var p2 = $('.player2-name:first').html();
    var now = new Date();
    var dt = (now.getYear()-100)+'.'+(now.getMonth()+1)+'.'+now.getDate()+' '+now.getHours()+'.'+getZero(now.getMinutes());

    $('#download_notation').attr('download', p1+' vs '+p2+' '+dt+'.ptn');

    var res='';
    res += getHeader('Site', 'PlayTak.com');
    res += getHeader('Date', '20'+(now.getYear()-100)+'.'+(now.getMonth()+1)+'.'+now.getDate());
    res += getHeader('Player1', p1);
    res += getHeader('Player2', p2);
    res += getHeader('Size', board.size);
    res += getHeader('Result', board.result);
    res += '\r\n';

    var count=1;

    $('#moveslist tr').each(function() {
      $('td', this).each(function() {
        var val = $(this).text();
        res += val;

        if(count%3 === 0)
          res += '\r\n';
        else
          res += ' ';

        count++;
      })
    });

    return res;
}

function downloadNotation() {
    $('#download_notation').attr('href', 'data:text/plain;charset=utf-8,'+encodeURIComponent(getNotation()));
}

function copyNotationLink() {
    var link = 'http://www.playtak.com/?load=' + encodeURIComponent(getNotation());

    var dummy = document.createElement("input");
    document.body.appendChild(dummy);

    dummy.value = link;
    dummy.select();

    try {
      var successful = document.execCommand('copy');
      if (successful)
        alert('success', 'Copied!');
      else
        alert('danger', 'Unable to copy!');
    } catch(err) {
      alert('danger', 'Unable to copy!');
    }

    document.body.removeChild(dummy);
}

function sliderChatSize(newSize) {
    chathandler.showchat();
    chathandler.adjustChatWidth(Number(newSize));
}

function undoButton() {
    if(board.scratch)
      board.undo();
    else
      server.undo();
}

function showresetpwd() {
    $('#login').modal('hide');
    $('#resetpwd-modal').modal('show');
}

function fastrewind() {
  board.showmove(board.movestart);
}

function stepback() {
  board.showmove(board.moveshown-1);
}

function stepforward() {
  board.showmove(board.moveshown+1);
}

function fastforward() {
  board.showmove(board.movecount);
}

$(document).ready(function() {
    if(localStorage.getItem('sound')==='false') {
        volume_change();
    }
    if(isBreakpoint('xs') || isBreakpoint('sm')) {
        chathandler.hidechat();
        hidermenu();
    } else {
        chathandler.showchat();
        showrmenu();
    }
    chathandler.init();
    if (location.search.startsWith('?load=')) {
       var text = decodeURIComponent(location.search.split('?load=')[1]);
       $('#loadptntext').val(text.replace(/\n/g, ' '));
       document.title = "Tak Review";
       load();
    } else if(localStorage.getItem('keeploggedin')==='true') {
        server.init();
    }
    tour(false);
})
