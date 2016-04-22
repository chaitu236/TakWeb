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
var raycaster = new THREE.Raycaster();
var highlighter;
var mouse = new THREE.Vector2();
var offset = new THREE.Vector3();

// settings
var antialiasing_mode = false;
var stack_dist = 105;
var piece_size = 88;
var piece_height = 15;
var sq_size = 90;
var sq_height = 15;
var capstone_height = 70;
var capstone_radius = 30;
var stack_selection_height = 60;
var border_size = 30;
var letter_size = 12;
var digit_adjustment = 2;
var diagonal_walls = false;
var white_square_tex_name = 'images/board/white_simple.png';
var black_square_tex_name = 'images/board/black_simple.png';
var white_piece_tex_name = 'images/pieces/white_simple_pieces.png';
var black_piece_tex_name = 'images/pieces/black_simple_pieces.png';
var white_caps_tex_name = 'images/pieces/white_simple_caps.png';
var black_caps_tex_name = 'images/pieces/black_simple_caps.png';
// end settings

// calls to initialize the UI and animate the 3D canvas.
init();
animate();

/*
 * Called on file initialization.
 */
function init() {
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
    renderer.setPixelRatio(window.devicePixelRatio);
    //renderer.setSize( window.innerWidth, window.innerHeight );
    //renderer.setSize( 800, 640);
    renderer.setClearColor(0xdddddd, 1);

    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minDistance = 200;
    controls.maxDistance = 1500;
    controls.enableKeys = false;
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("android") > -1 || ua.indexOf("iphone") > -1 ||
            ua.indexOf("ipod") > -1 || ua.indexOf("ipad") > -1)
        controls.zoomSpeed = 0.5;

    var material = new THREE.LineBasicMaterial({color: 0x0000f0});
    var geometry = new THREE.TorusGeometry(sq_size / 2 + 5, 3, 16, 100);
    //geometry.vertices.shift();
    highlighter = new THREE.Mesh(geometry, material);
    highlighter.rotateX(Math.PI / 2);

    canvas.addEventListener('mousedown', onDocumentMouseDown, false);
    canvas.addEventListener('mouseup', onDocumentMouseUp, false);
    canvas.addEventListener('mousemove', onDocumentMouseMove, false);

    board.init(5, "white", true);
}

/*
 * Called on window scaling.
 */
function onWindowResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  renderer.setSize(canvas.width, canvas.height);

  camera.aspect = canvas.width / canvas.height;
  camera.updateProjectionMatrix();

  $('#chat').offset({ top: $('nav').height() + 5 });
  $('#chat-toggle-button').offset({ top: $('nav').height() + 7 });
  $('#chat').height(window.innerHeight - $('nav').height() - 85
      + (localStorage.getItem('hide-send')==='true' ? 34 : 0));

  if (localStorage.getItem('auto_chat')!=='false')
  {
    if(isBreakpoint('xs') || isBreakpoint('sm')) {
      hidechat();
      hidermenu();
    } else {
      showchat();
      showrmenu();
    }
  }
}

function animate() {
    setTimeout(function () {
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
    else
        board.leftclick();
}
function onDocumentMouseUp(e) {
    if (e.button === 2)
        board.rightup();
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
        board.init(size, "white", true);
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
function loadtpn() {
    var tpn = window.prompt("Paste TPS here", "");
    if (!tpn)
        return;
    board.loadtpn(tpn);
}
function statusclick() {
    var inp = document.getElementById('status-inp');
    console.log('input: '+inp.value);
    server.send(inp.value);
    inp.innerHTML='';
}
function volume_change() {
    var img = document.getElementById("volume-img");
    var movesound = document.getElementById("move-sound");
    var chimesound = document.getElementById("chime-sound");

    if(img.src.match("mute")) {
        img.src = "images/ic_volume_up_black_24px.svg";
        movesound.muted = false;
        chimesound.muted = false;

        movesound.play();
        localStorage.setItem('sound', 'true');
    } else {
        img.src = "images/ic_volume_mute_black_24px.svg";
        movesound.muted = true;
        chimesound.muted = true;

        localStorage.setItem('sound', 'false');
    }
}
function togglechat() {
    if($('#chat').hasClass('hidden')) {
        showchat()
    } else {
        hidechat();
    }
}
function showchat() {
    $('#chat-toggle-button').css('right', 185);
    $('#chat-toggle-text').html('>><br>c<br>h<br>a<br>t');
    $('#chat').removeClass('hidden');
}
function hidechat() {
    $('#chat-toggle-button').css('right', 0);
    $('#chat-toggle-text').html('<<<br>c<br>h<br>a<br>t');
    $('#chat').addClass('hidden');
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