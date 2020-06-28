var server = {
    connection: null,
    timeoutvar: null,
    myname: null,
    tries:0,
    timervar: null,
    lastTimeUpdate: null,
    anotherlogin: false,

    init: function () {
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
        var url = 'www.playtak.com/ws';
        var proto = 'wss://';
        if (window.location.protocol === "http:" && window.location.host.indexOf("playtak") === -1){
            proto = 'ws://';
            url = window.location.host;
        }
        else if (window.location.protocol === "https:" && window.location.host.indexOf("playtak") === -1){
            url = window.location.host;
        }
        this.connection = new WebSocket(proto+url, "binary");
        board.server = this;
        this.connection.onerror = function (e) {
            output("Connection error: " + e);
        };
        this.connection.onmessage = function (e) {
            var blob = e.data;
            var reader = new FileReader();
            reader.onload = function (event) {
                var res_text = new TextDecoder("utf-8").decode(reader.result);
                var res = res_text.split("\n");
                var i;
                for (i = 0; i < res.length - 1; i++) {
                    server.msg(res[i]);
                }
            };
            reader.readAsArrayBuffer(blob);
        };
        this.connection.onopen = function (e) {
        };
        this.connection.onclose = function (e) {
            document.getElementById('login-button').textContent = 'Sign up / Login';
            $('#onlineplayers').addClass('hidden');
            document.getElementById("onlineplayersbadge").innerHTML = "0";
            document.getElementById("seekcount").innerHTML = "0";
            document.getElementById("seekcountbot").innerHTML = "0";
            document.getElementById("gamecount").innerHTML = "0";
            document.getElementById("scratchsize").disabled = false;
            board.scratch = true;
            board.observing = false;
            board.gameno = 0;
            document.title = "Tak";
            $('#seeklist').children().each(function() {
                this.remove();
            });
            $('#seeklistbot').children().each(function() {
                this.remove();
            });
            $('#gamelist').children().each(function() {
                this.remove();
            });
            stopTime();

            if(localStorage.getItem('keeploggedin')==='true' &&
                                              !server.anotherlogin) {
              alert("info", "Connection lost. Trying to reconnect...");
              server.startLoginTimer();
            } else {
              alert("info", "You're disconnected from server");
            }
        };
    },

    loginTimer: null,

    startLoginTimer: function() {
      if(server.loginTimer !== null)
        return;
      server.loginTimer = setTimeout(server.loginTimerFn, 5000);
    },

    stopLoginTimer: function() {
      if(server.loginTimer == null)
        return;
      clearTimeout(server.loginTimer);
      server.loginTimer = null;
    },

    loginTimerFn: function() {
      server.init();
      server.loginTimer = setTimeout(server.loginTimerFn, 5000);
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
        var retyped_email = $('#retype-register-email').val();

        if (email !== retyped_email) {
          alert("danger", "Email address doesn't match");
          return;
        }

        this.send("Register " + name + " " + email);
    },
    changepassword: function() {
        var curpass = $('#cur-pwd').val();
        var newpass = $('#new-pwd').val();
        var retypenewpass = $('#retype-new-pwd').val();

        if(newpass !== retypenewpass) {
          alert("danger", "Passwords don't match");
        } else {
          this.send("ChangePassword "+curpass+" "+newpass);
        }
    },
    sendresettoken: function() {
        var name = $('#resettoken-username').val();
        var email = $('#resettoken-email').val();
        this.send('SendResetToken '+name+' '+email);
    },
    resetpwd: function() {
        var name = $('#resetpwd-username').val();
        var token = $('#resetpwd-token').val();
        var npwd = $('#reset-new-pwd').val();
        var rnpwd = $('#reset-retype-new-pwd').val();
        if(npwd !== rnpwd) {
            alert("danger", "Passwords don't match");
        } else {
            this.send('ResetPassword '+name+' '+token+' '+npwd);
        }
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

                $('#player-me-img').addClass('white-player-color');
                $('#player-opp-img').removeClass('white-player-color');

                $('#player-me').addClass('selectplayer');
            } else {//I am black
                $('#player-me-name').addClass('player2-name');
                $('#player-opp-name').addClass('player1-name');

                $('#player-me-time').addClass('player2-time');
                $('#player-opp-time').addClass('player1-time');

                $('#player-me-img').removeClass('white-player-color');
                $('#player-opp-img').addClass('white-player-color');

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

            if (spl[7] === "white") {//I am white
                if(!chathandler.roomExists('priv', spl[6]))
                    chathandler.createPrivateRoom(spl[6]);
                chathandler.setRoom('priv', spl[6]);
            } else {//I am black
                if(!chathandler.roomExists('priv', spl[4]))
                    chathandler.createPrivateRoom(spl[4]);
                chathandler.setRoom('priv', spl[4]);
            }

            var chimesound = document.getElementById("chime-sound");
            chimesound.play();
        }
        else if (e.startsWith("Observe Game#")) {
            //Observe Game#1 player1 vs player2, 4x4, 180, 7 half-moves played, player2 to move
            var spl = e.split(" ");

            var p1 = spl[2];
            var p2 = spl[4].split(',')[0];

            board.clear();
            board.create(Number(spl[5].split("x")[0]), "white", false, true);
            board.initEmpty();
            board.gameno = Number(spl[1].split("Game#")[1]);
            $('.player1-name:first').html(p1);
            $('.player2-name:first').html(p2);
            document.title = "Tak: " + p1 + " vs " + p2;

            var time = Number(spl[6].split(",")[0]);
            var m = parseInt(time/60);
            var s = getZero(parseInt(time%60));
            $('.player1-time:first').html(m+':'+s);
            $('.player2-time:first').html(m+':'+s);

            if(!chathandler.roomExists('room', 'Game'+board.gameno))
                chathandler.createGameRoom('Game'+board.gameno, p1, p2);
            chathandler.setRoom('room', 'Game'+board.gameno);
        }
        else if (e.startsWith("GameList Add Game#")) {
            //GameList Add Game#1 player1 vs player2, 4x4, 180, 15, 0 half-moves played, player1 to move
            var spl = e.split(" ");

            var no = spl[2].split("Game#")[1];

            var t = Number(spl[7].split(",")[0]);
            var m = parseInt(t/60);
            var s = getZero(parseInt(t%60));

            var inc = spl[8].split(",")[0];

            var p1 = spl[3];
            var p2 = spl[5].split(",")[0];
            var sz = spl[6].split(",")[0];

            p1 = "<span class='playername'>"+p1+"</span>";
            p2 = "<span class='playername'>"+p2+"</span>";
            sz = "<span class='badge'>"+sz+"</span>";

            var row = $('<tr/>').addClass('row').addClass('game'+no)
                                .click(function() {server.observegame(spl[2].split("Game#")[1]);})
                                .appendTo($('#gamelist'));
            $('<td/>').append(p1).appendTo(row);
            $('<td/>').append('vs').appendTo(row);
            $('<td/>').append(p2).appendTo(row);
            $('<td/>').append(sz).appendTo(row);
            $('<td/>').append(m+':'+s).appendTo(row);
            $('<td/>').append('+'+inc+'s').appendTo(row);

            var op = document.getElementById("gamecount");
            op.innerHTML = Number(op.innerHTML)+1;
        }
        else if (e.startsWith("GameList Remove Game#")) {
            //GameList Remove Game#1 player1 vs player2, 4x4, 180, 0 half-moves played, player1 to move
            var spl = e.split(" ");

            var no = spl[2].split("Game#")[1];
            var game_element = $('.game'+no);

            var op = document.getElementById("gamecount");
            if (game_element.length) {
                op.innerHTML = Number(op.innerHTML)-1;
                game_element.remove()
            }
            else {
                console.log('Game '+no+' removed twice.')
            }
        }
        else if (e.startsWith("Game#")) {
          var spl = e.split(" ");
          var gameno = Number(e.split("Game#")[1].split(" ")[0]);
          //Game#1 ...
          if(gameno === board.gameno) {
            //Game#1 P A4 (C|W)
            if (spl[1] === "P") {
                board.serverPmove(spl[2].charAt(0), Number(spl[2].charAt(1)), spl[3]);
            }
            //Game#1 M A2 A5 2 1
            else if (spl[1] === "M") {
                var nums = [];
                for (i = 4; i < spl.length; i++)
                    nums.push(Number(spl[i]));
                board.serverMmove(spl[2].charAt(0), Number(spl[2].charAt(1)),
                        spl[3].charAt(0), Number(spl[3].charAt(1)),
                        nums);
            }
            //Game#1 Time 170 200
            else if (spl[1] === "Time") {
              var wt = Number(spl[2]);
              var bt = Number(spl[3]);
              lastWt = wt;
              lastBt = bt;

              var now = new Date();
              lastTimeUpdate = now.getHours()*60*60 + now.getMinutes()*60+now.getSeconds();


              $('.player1-time:first').html(parseInt(wt/60)+':'+getZero(wt%60));
              $('.player2-time:first').html(parseInt(bt/60)+':'+getZero(bt%60));

              if(!board.timer_started) {
                board.timer_started = true;
                startTime(true);
              }
            }
            //Game#1 RequestUndo
            else if (spl[1] === "RequestUndo") {
              alert("info", "Your opponent requests to undo the last move");
              $('#undo').toggleClass('opp-requested-undo request-undo');
            }
            //Game#1 RemoveUndo
            else if (spl[1] === "RemoveUndo") {
              alert("info", "Your opponent removes undo request");
              $('#undo').toggleClass('opp-requested-undo request-undo');
            }
            //Game#1 Undo
            else if (spl[1] === "Undo") {
              board.undo();
              alert("info", "Game has been UNDOed by 1 move");
              $('#undo').removeClass('i-requested-undo').removeClass('opp-requested-undo').addClass('request-undo');
            }
            //Game#1 OfferDraw
            else if (spl[1] === "OfferDraw") {
                $('#draw').toggleClass('opp-offered-draw offer-draw');
                alert("info", "Draw is offered by your opponent");
            }
            //Game#1 RemoveDraw
            else if (spl[1] === "RemoveDraw") {
                $('#draw').removeClass('i-offered-draw').removeClass('opp-offered-draw').addClass('offer-draw');
                alert("info", "Draw offer is taken back by your opponent");
            }
            //Game#1 Over result
            else if (spl[1] === "Over") {
                document.title = "Tak";
                board.scratch = true;
                board.result = spl[2];
                board.notate(spl[2]);

                var msg = "Game over <span class='bold'>" + spl[2] + "</span><br>";
                var res;
                var type;

                if(spl[2] === "R-0" || spl[2] === "0-R")
                  type = "making a road";
                else if (spl[2] === "F-0" || spl[2] === "0-F")
                  type = "having more flats";
                else if (spl[2] === "1-0" || spl[2] === "0-1")
                  type = "resignation or time";

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
                } else if (spl[2] === "0-0") {
                  msg += "The game is aborted!";
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

                document.getElementById("scratchsize").disabled = false;
                stopTime();

                $('#gameoveralert-text').html(msg);
                $('#gameoveralert').modal('show');
            }
            //Game#1 Abandoned
            else if (spl[1] === "Abandoned.") {
                //Game#1 Abandoned. name quit
                document.title = "Tak";
                board.scratch = true;

                if(board.mycolor === "white") {
                  board.notate("1-0");
                  board.result = "1-0";
                } else {
                  board.notate("0-1");
                  board.result = "1-0";
                }

                var msg = "Game abandoned by " + spl[2] + ".";
                if(!board.observing)
                  msg += " You win!";

                document.getElementById("scratchsize").disabled = false;
                stopTime();

                $('#gameoveralert-text').html(msg);
                $('#gameoveralert').modal('show');
            }
          }
        }
        else if (e.startsWith("Login or Register")) {
            server.send("Client " + "TakWeb-16.05.26");
            this.timeoutvar = window.setInterval(this.keepalive, 30000);

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
        else if (e.startsWith("Wrong password")) {
          alert("danger", "Wrong Password");
        }
        //You're already logged in
        else if (e.startsWith("You're already logged in")) {
          alert("warning", "You're already logged in from another window");
          this.connection.close();
        }
        //Welcome kaka!
        else if (e.startsWith("Welcome ")) {
            server.stopLoginTimer();

            this.tries = 0;
            $('#login').modal('hide');
            document.getElementById('login-button').textContent = 'Logout';
            this.timeoutvar = window.setInterval(this.keepalive, 30000);
            this.myname = e.split("Welcome ")[1].split("!")[0];
            alert("success", "You're logged in "+this.myname+"!");
            document.title = "Tak";

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
        else if (e.startsWith("Password changed")) {
          $('#settings-modal').modal('hide');
          alert("success", "Password changed!");
        }
        else if (e.startsWith("Message")) {
            var msg = e.split("Message ");

            if (e.includes("You've logged in from another window. Disconnecting"))
              server.anotherlogin = true;

            alert("info", "Server says: " + msg[1]);
        }
        else if (e.startsWith("Error")) {
            var msg = e.split("Error:")[1];
            alert("danger", "Server says: "+msg);
        }
        //Shout <name> msg
        else if (e.startsWith("Shout ")) {
            var regex = /Shout <([^\s]*)> (.*)/g;
            var match = regex.exec(e);

            chathandler.received('global', '', match[1], match[2]);
        }
        //ShoutRoom name <name> msg
        else if (e.startsWith("ShoutRoom")) {
            var regex = /ShoutRoom ([^\s]*) <([^\s]*)> (.*)/g;
            var match = regex.exec(e);

            chathandler.received('room', match[1], match[2], match[3]);
        }
        //Tell <name> msg
        else if (e.startsWith("Tell")) {
            var regex = /Tell <([^\s]*)> (.*)/g;
            var match = regex.exec(e);

            chathandler.received('priv', match[1], match[1], match[2]);
        }
        //Told <name> msg
        else if (e.startsWith("Told")) {
            var regex = /Told <([^\s]*)> (.*)/g;
            var match = regex.exec(e);

            chathandler.received('priv', match[1], this.myname, match[2]);
        }
        else if (e.startsWith("CmdReply")) {
            var msg = e.split("CmdReply ")[1];
            msg = '<span class="cmdreply">' + msg + '</span>';

            chathandler.raw('global', 'global', msg);
        }
        //new seek
        else if (e.startsWith("Seek new")) {
            //Seek new 1 chaitu 5 180 15 W|B
            var spl = e.split(" ");

            var no = spl[2];
            var t = Number(spl[5]);
            var m = parseInt(t/60);
            var s = getZero(parseInt(t%60));

            var inc = spl[6];

            var p = spl[3];
            var sz = spl[4]+'x'+spl[4];

            img = "images/circle_any.svg"
            if(spl.length == 8) {
                img = (spl[7] === 'W')?"images/circle_white.svg":
                                       "images/circle_black.svg";
            }
            img = '<img src="'+img+'"/>';

            var pspan = "<span class='playername'>"+p+"</span>";
            sz = "<span class='badge'>"+sz+"</span>";
            var botlevel = "";

            var op = document.getElementById("seekcount");
            var opbot = document.getElementById("seekcountbot");

            var row = $('<tr/>').addClass('row').addClass('seek'+no)
                                .click(function() {server.acceptseek(spl[2])})
            if (p.toLowerCase().indexOf('bot') !== -1) {
                var listed = $('#seeklistbot').children();
                var previous = null;
                var hardness = 'Unknown';
                var level = 100;
                var botsettings = botlist[p];

                if (botsettings) {
                    for (var i = 0; i < listed.length; i++) {
                        var position = +(/(^| )botid([0-9]+)($| )/.exec(listed[i].className)[2]);
                        if (position < botsettings[0]) {
                            previous = $(listed[i]);
                        }
                    }
                    level = botsettings[0];
                    hardness = botsettings[1];
                } else if (listed.length > 0) {
                    previous = $(listed[listed.length-1]);
                }

                if (previous)
                    previous.after(row);
                else
                    $('#seeklistbot').prepend(row);

                row.addClass('botid'+level);
                botlevel = "<span class='botlevel'>"+hardness+"</span>";
                opbot.innerHTML = Number(opbot.innerHTML)+1;
            }
            else {
                row.appendTo($('#seeklist'));
                op.innerHTML = Number(op.innerHTML)+1;
            }
            $('<td/>').append(img).appendTo(row);
            $('<td/>').append(botlevel+pspan).appendTo(row);
            $('<td/>').append(sz).appendTo(row);
            $('<td/>').append(m+':'+s).appendTo(row);
            $('<td/>').append('+'+inc+'s').appendTo(row);
        }
        //remove seek
        else if (e.startsWith("Seek remove")) {
            //Seek remove 1 chaitu 5 15
            var spl = e.split(" ");

            var no = spl[2];

            var botgame = $('#seeklistbot .seek'+no).length
            $('.seek'+no).remove();

            var op = document.getElementById("seekcount");
            var opbot = document.getElementById("seekcountbot");
            if (botgame) {
                opbot.innerHTML = Number(opbot.innerHTML)-1;
            }
            else{
                op.innerHTML = Number(op.innerHTML)-1;
            }
        }
        //Online players
        else if (e.startsWith("Online ")) {
            $('#onlineplayers').removeClass('hidden');
            var op = document.getElementById("onlineplayersbadge");
            op.innerHTML = Number(e.split("Online ")[1]);
        }
        //Reset token sent
        else if (e.startsWith("Reset token sent")) {
            alert("success", "Token sent to your email");
            $("#resetpwd-ul li:eq(1) a").tab('show');
        }
    },
    chat: function (type, name, msg) {
        if ( type === 'global')
            this.send('Shout '+msg);
        else if (type == 'room')
            this.send('ShoutRoom ' + name + ' ' + msg);
        else if (type === 'priv')
            this.send('Tell ' + name + ' ' + msg);
        else
            console.log('undefined chat type');
    },
    leaveroom: function (room ) {
        this.send('LeaveRoom ' + room);
    },
    send: function (e) {
        var binary_data = (new TextEncoder()).encode(e + "\n");

        if (this.connection && this.connection.readyState === 1)
            this.connection.send(binary_data);
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
        var inc = $('#incselect').find(':selected').text();
        var clrtxt = $('#colorselect').find(':selected').text();
        var clr='';
        if(clrtxt == 'White')
          clr = ' W';
        if(clrtxt == 'Black')
          clr = ' B';

        this.send("Seek "+size+" " + (time*60) + " " + inc + clr);
        $('#creategamemodal').modal('hide');
    },
    removeseek: function() {
        this.send("Seek 0 0 0");
        $('#creategamemodal').modal('hide');
    },
    draw: function() {
        if(board.scratch)
          return;
        else if(board.observing)
          return;

        if($('#draw').hasClass("offer-draw")) {//offer
            $('#draw').toggleClass('i-offered-draw offer-draw');
            this.send("Game#" + board.gameno + " OfferDraw");
        } else if($('#draw').hasClass("i-offered-draw")) {//remove offer
            $('#draw').toggleClass('i-offered-draw offer-draw');
            this.send("Game#" + board.gameno + " RemoveDraw");
        } else {//accept the offer
            $('#draw').removeClass('i-offered-draw').removeClass('opp-offered-draw').addClass('offer-draw');
            this.send("Game#" + board.gameno + " OfferDraw");
        }
    },
    undo: function() {
      if(board.observing)
        return;

      if($('#undo').hasClass('request-undo')) {//request undo
        this.send("Game#" + board.gameno + " RequestUndo");
        $('#undo').toggleClass('request-undo i-requested-undo');
        alert('info', 'Undo request sent');
      } else if ($('#undo').hasClass('opp-requested-undo')) {//accept request
        this.send("Game#" + board.gameno + " RequestUndo");
        $('#undo').toggleClass('request-undo opp-requested-undo');
      } else if ($('#undo').hasClass('i-requested-undo')) {//remove request
        this.send("Game#" + board.gameno + " RemoveUndo");
        $('#undo').toggleClass('request-undo i-requested-undo');
        alert('info', 'Undo request removed');
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
        $('#joingame-modal').modal('hide');
    },
    unobserve: function() {
        if(board.gameno !== 0)
            this.send("Unobserve " + board.gameno);
    },
    observegame: function (no) {
        $('#watchgame-modal').modal('hide');
        if (board.observing === false && board.scratch === false) //don't observe game while playing another
            return;
        if (no === board.gameno)
            return;
        this.unobserve();
        this.send("Observe " + no);
    }
};
