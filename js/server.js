
var server = {
    connection: null,
    timeoutvar: null,
    myname: null,
    tries:0,
    timervar: null,
    lastTimeUpdate: null,

    init: function () {
        console.log("called init");
        if (this.connection && this.connection.readyState === 2)//closing connection
            return;
        if (this.connection && this.connection.readyState === 3)//closed
            this.connection = null;
        if (this.connection) { //user clicked logout
            this.connection.close();
            alert("info", "Disconnnecting from server....");

            localStorage.removeItem('keeploggedin');
            localStorage.removeItem('usr');
            localStorage.removeItem('token');
            return;
        }
        var url = window.location.host;
        //if (url.indexOf("playtak") > -1)
            url = 'playtak.com:3000';
        var proto='ws://';
        if (window.location.protocol === "https:")
            proto='wss://';
        this.connection = new WebSocket(proto+url, "binary");
        board.server = this;
        this.connection.onerror = function (e) {
            this.output("Connection error: " + e);
        };
        this.connection.onmessage = function (e) {
            var blob = e.data;
            var reader = new FileReader();
            reader.onload = function (event) {
                var res = reader.result.split("\n");
                var i;
                for (i = 0; i < res.length - 1; i++) {
                    server.msg(res[i]);
                }
            };
            reader.readAsText(blob);
        };
        this.connection.onopen = function (e) {
        };
        this.connection.onclose = function (e) {
            document.getElementById('login-button').textContent = 'Sign up / Login';
            document.getElementById("onlineplayers").innerHTML = "0";
            document.getElementById("seekcount").innerHTML = "0";
            document.getElementById("gamecount").innerHTML = "0";
            document.getElementById("scratchsize").disabled = false;
            board.scratch = true;
            board.observing = false;
            board.gameno = 0;
            document.title = "Tak";
            $('#seeklist').children().each(function() {
                this.remove();
            });
            $('#gamelist').children().each(function() {
                this.remove();
            });
            stopTime();
            alert("info", "You're disconnected from server");
        };
    },
    login: function () {
        var name = $('#login-username').val();
        var pass = $('#login-pwd').val();

        this.send("Login " + name + " " + pass);
    },
    guestlogin: function() {
        this.send("Login Guest");
    },
    register: function () {
        var name = $('#register-username').val();
        var email = $('#register-email').val();
        this.send("Register " + name + " " + email);
    },
    keepalive: function() {
        if(server.connection && server.connection.readyState === 1)//open connection
            server.send("PING");
    },
    msg: function (e) {
        output(e);
        e = e.trim();
        if (e.startsWith("Game Start")) {
            //Game Start no. size player_white vs player_black yourcolor time
            var spl = e.split(" ");
            board.newgame(Number(spl[3]), spl[7]);
            board.gameno = Number(spl[2]);
            console.log("gno "+board.gameno);
            document.getElementById("scratchsize").disabled = true;

            $('#player-me-name').removeClass('player1-name');
            $('#player-me-name').removeClass('player2-name');
            $('#player-opp-name').removeClass('player1-name');
            $('#player-opp-name').removeClass('player2-name');

            $('#player-me-time').removeClass('player1-time');
            $('#player-me-time').removeClass('player2-time');
            $('#player-opp-time').removeClass('player1-time');
            $('#player-opp-time').removeClass('player2-time');

            $('#player-me').removeClass('selectplayer');
            $('#player-opp').removeClass('selectplayer');

            if (spl[7] === "white") {//I am white
                $('#player-me-name').addClass('player1-name');
                $('#player-opp-name').addClass('player2-name');

                $('#player-me-time').addClass('player1-time');
                $('#player-opp-time').addClass('player2-time');

                $('#player-me-img').attr('src', 'images/player-white.png');
                $('#player-opp-img').attr('src', 'images/player-black.png');

                $('#player-me').addClass('selectplayer');
            } else {//I am black
                $('#player-me-name').addClass('player2-name');
                $('#player-opp-name').addClass('player1-name');

                $('#player-me-time').addClass('player2-time');
                $('#player-opp-time').addClass('player1-time');

                $('#player-me-img').attr('src', 'images/player-black.png');
                $('#player-opp-img').attr('src', 'images/player-white.png');

                $('#player-opp').addClass('selectplayer');
            }

            $('.player1-name:first').html(spl[4]);
            $('.player2-name:first').html(spl[6]);
            document.title = "Tak: " + spl[4] + " vs " + spl[6];

            var time = Number(spl[8]);
            var m = parseInt(time/60);
            var s = getZero(parseInt(time%60));
            $('.player1-time:first').html(m+':'+s);
            $('.player2-time:first').html(m+':'+s);

            var chimesound = document.getElementById("chime-sound");
            chimesound.play();
        }
        else if (e.startsWith("Observe Game#")) {
            //Observe Game#1 player1 vs player2, 4x4, 180, 7 half-moves played, player2 to move
            var spl = e.split(" ");
            board.clear();
            board.init(Number(spl[5].split("x")[0]), "white", false, true);
            board.gameno = Number(spl[1].split("Game#")[1]);
            $('.player1-name:first').html(spl[2]);
            $('.player2-name:first').html(spl[4].split(",")[0]);
            document.title = "Tak: " + spl[2] + " vs " + spl[4];

            var time = Number(spl[6].split(",")[0]);
            var m = parseInt(time/60);
            var s = getZero(parseInt(time%60));
            $('.player1-time:first').html(m+':'+s);
            $('.player2-time:first').html(m+':'+s);
        }
        else if (e.startsWith("GameList Add Game#")) {
            //GameList Add Game#1 player1 vs player2, 4x4, 180, 0 half-moves played, player1 to move
            var spl = e.split(" ");

            var no = spl[2].split("Game#")[1];

            var t = Number(spl[7].split(",")[0]);
            var m = parseInt(t/60);
            var s = getZero(parseInt(t%60));

            var p1 = spl[3];
            var p2 = spl[5].split(",")[0];
            var sz = spl[6].split(",")[0];

            p1 = "<span class='playername'>"+p1+"</span>";
            p2 = "<span class='playername'>"+p2+"</span>";
            sz = "<span class='badge'>"+sz+"</span>";

            //var val = spl[3] + " vs " + spl[5].split(",")[0] + " " + spl[6].split(",")[0] + " " + m+':'+s;
            var val = p1 + " vs " + p2 + " " + sz + " " + m+":"+s;

            var li = $('<li/>').addClass('game'+no).appendTo($('#gamelist'));
            $('<a/>').append(val).click(function() {server.observegame(spl[2].split("Game#")[1]);}).
                                  appendTo(li);

            var op = document.getElementById("gamecount");
            op.innerHTML = Number(op.innerHTML)+1;
        }
        else if (e.startsWith("GameList Remove Game#")) {
            //GameList Remove Game#1 player1 vs player2, 4x4, 180, 0 half-moves played, player1 to move
            var spl = e.split(" ");

            var no = spl[2].split("Game#")[1];
            $('.game'+no).remove();

            var op = document.getElementById("gamecount");
            op.innerHTML = Number(op.innerHTML)-1;
        }
        else if (e.startsWith("Game#")) {
          var gameno = Number(e.split("Game#")[1].split(" ")[0]);
          console.log("game no "+gameno+" "+board.gameno);
          //Game#1 ...
          if(gameno === board.gameno) {
            //Game#1 P A4 (C|W)
            if (e.indexOf(" P ") > -1) {
                var spl = e.split(" ");
                board.serverPmove(spl[2].charAt(0), Number(spl[2].charAt(1)), spl[3]);
            }
            //Game#1 M A2 A5 2 1
            else if (e.indexOf(" M ") > -1) {
                var spl = e.split(" ");
                var nums = [];
                for (i = 4; i < spl.length; i++)
                    nums.push(Number(spl[i]));
                board.serverMmove(spl[2].charAt(0), Number(spl[2].charAt(1)),
                        spl[3].charAt(0), Number(spl[3].charAt(1)),
                        nums);
            }
            //Game#1 Time 170 200
            else if (e.indexOf(" Time ") > -1) {
              var spl = e.split(" ");
              var wt = Number(spl[2]);
              var bt = Number(spl[3]);
              lastWt = wt;
              lastBt = bt;

              var now = new Date();
              lastTimeUpdate = now.getHours()*60*60 + now.getMinutes()*60+now.getSeconds();


              $('.player1-time:first').html(parseInt(wt/60)+':'+getZero(wt%60));
              $('.player2-time:first').html(parseInt(bt/60)+':'+getZero(bt%60));

              if(board.movecount > 0) {
                startTime(true);
              }
            }
            //Game#1 OfferDraw
            else if (e.indexOf("OfferDraw") > -1) {
                document.getElementById("draw").src = "images/hand-other-offered.png";
                alert("info", "Draw is offered by your opponent");
            }
            //Game#1 RemoveDraw
            else if (e.indexOf("RemoveDraw") > -1) {
                document.getElementById("draw").src = "images/offer-hand.png";
                alert("info", "Draw offer is taken back by your opponent");
            }
            //Game#1 Over result
            else if (e.indexOf("Over") > -1) {
                document.title = "Tak";
                var spl = e.split(" ");
                board.scratch = true;
                board.notate(spl[2]);

                var msg = "Game over <span class='bold'>" + spl[2] + "</span><br>";
                var res;
                var type;

                if(spl[2] === "R-0" || spl[2] === "0-R")
                  type = "making a road";
                else if (spl[2] === "F-0" || spl[2] === "0-F")
                  type = "having more flats";
                else if (spl[2] === "1-0" || spl[2] === "0-1")
                  type = "resignation";

                if(spl[2] === "R-0" || spl[2] === "F-0" || spl[2] === "1-0") {
                  if(board.observing === true) {
                    msg += "White wins by "+type;
                  }
                  else if(board.mycolor === "white") {
                    msg += "You win by "+type;
                  } else {
                    msg += "Your opponent wins by "+type;
                  }
                } else if (spl[2] === "1/2-1/2") {
                  msg += "The game is a draw!";
                } else {//black wins
                  if(board.observing === true) {
                    msg += "Black wins by "+type;
                  }
                  else if(board.mycolor === "white") {
                    msg += "Your opponent wins by "+type;
                  } else {
                    msg += "You win by "+type;
                  }
                }

                alert("info", msg);
                document.getElementById("scratchsize").disabled = false;
                stopTime();

                $('#gameoveralert-text').html(msg);
                $('#gameoveralert').modal('show');
            }
            //Abandoned
            else if (e.indexOf("Abandoned") > -1) {
                //Game#1 Abandoned. name quit
                var spl = e.split(" ");
                document.title = "Tak";
                board.scratch = true;

                if(board.mycolor === "white")
                  board.notate("1-0");
                else
                  board.notate("0-1");

                var msg = "Game abandoned by " + spl[2] + ".";
                if(!board.observing)
                  msg += " You win!";

                alert("info", msg);
                document.getElementById("scratchsize").disabled = false;
                stopTime();

                $('#gameoveralert-text').html(msg);
                $('#gameoveralert').modal('show');
            }
          }
        }
        else if (e.startsWith("Login or Register")) {
            server.send("Client " + "TakWeb-16.04.21");

            if(localStorage.getItem('keeploggedin')==='true' && this.tries<3) {
              var uname = localStorage.getItem('usr');
              var token = localStorage.getItem('token');
              server.send("Login " + uname + " " + token);
              this.tries++;
            } else {
              localStorage.removeItem('keeploggedin');
              localStorage.removeItem('usr');
              localStorage.removeItem('token');
              $('#login').modal('show');
            }
        }
        //Registered ...
        else if (e.startsWith("Registered")) {
          alert("success", "You're registered! Check mail for password");
        }
        //Name already taken
        else if (e.startsWith("Name already taken")) {
          alert("danger", "Name is already taken");
        }
        //Can't register with guest in the name
        else if (e.startsWith("Can't register with guest in the name")) {
          alert("danger", "Can't register with guest in the name");
        }
        //Unknown format for username/email
        else if (e.startsWith("Unknown format for username/email")) {
          alert("danger", e);
        }
        //Authentication failure
        else if (e.startsWith("Authentication failure")) {
            console.log('failure');
            if(($('#login').data('bs.modal') || {}).isShown) {
              alert("danger", "Authentication failure");
            } else {
              localStorage.removeItem('keeploggedin');
              localStorage.removeItem('usr');
              localStorage.removeItem('token');
              $('#login').modal('show');
            }
        }
        //You're already logged in
        else if (e.startsWith("You're already logged in")) {
          alert("warning", "You're already logged in from another window");
          this.connection.close();
        }
        //Welcome kaka!
        else if (e.startsWith("Welcome ")) {
            this.tries = 0;
            $('#login').modal('hide');
            document.getElementById('login-button').textContent = 'Logout';
            this.timeoutvar = window.setInterval(this.keepalive, 30000);
            this.myname = e.split("Welcome ")[1].split("!")[0];
            alert("success", "You're logged in "+this.myname+"!");

            var rem = $('#keeploggedin').is(':checked');
            if( rem === true && !this.myname.startsWith("Guest")) {
              console.log('storing');
              var name = $('#login-username').val();
              var token = $('#login-pwd').val();

              localStorage.setItem('keeploggedin', 'true');
              localStorage.setItem('usr', name);
              localStorage.setItem('token', token);
            }
        }
        else if (e.startsWith("Message")) {
            var msg = e.split("Message ");
            alert("info", "Server says: " + msg[1]);
        }
        else if (e.startsWith("Error")) {
            var msg = e.split("Error:")[1];
            alert("danger", "Server says: "+msg);
        }
        else if (e.startsWith("Shout")) {
            var msg = e.split("Shout ");
            var name = msg[1].split('<')[1].split('>')[0];
            var txt = msg[1].split('<'+name+'>')[1];
            var clsname = 'chatname';

            if (name=='IRC') {
              name = txt.split('<')[1].split('>')[0];
              txt = txt.split('<'+name+'>')[1];
              clsname = clsname + ' ircname';
            }

            var $cs = $('#chat-server');

            var now = new Date();
            var hours = now.getHours();
            var mins = now.getMinutes();
            var cls = 'chattime'
            if (localStorage.getItem('hide-chat-time')==='true') {
              cls = cls + ' hidden';
            }
            $cs.append('<span class="'+cls+'">['+getZero(hours)+':'+getZero(mins)+'] </span>');
            $cs.append('<span class="'+clsname+'">'+name+':</span>');
            var options = {/* ... */};

            txt = txt.linkify(options);

            //someone said our name
            if(txt.indexOf(this.myname) > -1) {
              var tmp = txt.split(this.myname);
              txt = tmp[0] + '<span class="chatmyname">'+this.myname+'</span>' + tmp[1];
            }

            $cs.append(txt+'<br>');

            $cs.scrollTop($cs[0].scrollHeight);
        }
        else if (e.startsWith("CmdReply")) {
            var msg = e.split("CmdReply ")[1];
            var $cs = $('#chat-server');

            $cs.append('<span class="cmdreply">'+msg+'</span><br>');
            $cs.scrollTop($cs[0].scrollHeight);
        }
        //new seek
        else if (e.startsWith("Seek new")) {
            //Seek new 1 chaitu 5 180
            var spl = e.split(" ");

            var no = spl[2];
            var t = Number(spl[5]);
            var m = parseInt(t/60);
            var s = getZero(parseInt(t%60));

            var p = spl[3];
            var sz = spl[4]+'x'+spl[4];

            p = "<span class='playername'>"+p+"</span>";
            sz = "<span class='badge'>"+sz+"</span>";

            var li = $('<li/>').addClass('seek'+no).appendTo($('#seeklist'));
            $('<a/>').append(p + " " + sz + " " + m+":"+s).click(function() {server.acceptseek(spl[2])}).
                        appendTo(li);

            var op = document.getElementById("seekcount");
            op.innerHTML = Number(op.innerHTML)+1;
        }
        //remove seek
        else if (e.startsWith("Seek remove")) {
            //Seek remove 1 chaitu 5 15
            var spl = e.split(" ");

            var no = spl[2];
            $('.seek'+no).remove();

            var op = document.getElementById("seekcount");
            op.innerHTML = Number(op.innerHTML)-1;
        }
        //Online players
        else if (e.startsWith("Online ")) {
            var op = document.getElementById("onlineplayers");
            op.innerHTML = Number(e.split("Online ")[1]);
        }
    },
    chat: function () {
        var msg = $('#chat-me').val();
        console.log('msg= '+msg);
        if(msg.startsWith('.'))
          this.send(msg.slice(1));
        else
          this.send('Shout '+msg);
        $('#chat-me').val('');
    },
    send: function (e) {
        if (this.connection && this.connection.readyState === 1)
            this.connection.send(e + "\n");
        else
            this.error("You are not logged on to the server");
    },
    error: function (e) {
        alert("danger", e);
    },
    seek: function () {
        var size = $('#boardsize').find(':selected').text();
        size = parseInt(size);
        var time = $('#timeselect').find(':selected').text();
        this.send("Seek "+size+" "+time*60);
        $('#creategamemodal').modal('hide');
    },
    removeseek: function() {
        this.send("Seek 0 0");
        $('#creategamemodal').modal('hide');
    },
    draw: function() {
        if(board.scratch)
          return;
        else if(board.observing)
          return;

        var img = document.getElementById("draw");
        if(img.src.match("offer-hand")) {//offer
            img.src = "images/hand-i-offered.png";
            this.send("Game#" + board.gameno + " OfferDraw");
        } else if(img.src.match("hand-i-offered")) {//remove offer
            img.src = "images/offer-hand.png";
            this.send("Game#" + board.gameno + " RemoveDraw");
        } else {//accept the offer
            this.send("Game#" + board.gameno + " OfferDraw");
        }
    },
    resign: function() {
        if(board.scratch)
          return;
        else if(board.observing)
          return;

        this.send("Game#" + board.gameno + " Resign");
    },
    acceptseek: function (e) {
        this.send("Accept " + e);
    },
    observegame: function (no) {
        if (board.observing === false && board.scratch === false) //don't observe game while playing another
            return;
        if (no === board.gameno)
            return;
        else
            this.send("Unobserve " + board.gameno);
        this.send("Observe " + no);
    }
};
