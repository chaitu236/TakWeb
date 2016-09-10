var chathandler = {
    lastChatTime: '',
    chat_width: 180,
    cur_room: 'global',
    
    init: function() {
        $('#chat').offset({ top: $('nav').height() + 5 });
        $('#chat').height(window.innerHeight - $('nav').height() - 118);
        $('#chat-toggle-button').offset({ top: $('nav').height() + 7 });

        $('#room-div-global').append('<a href="#" onclick="showPrivacyPolicy();"> Privacy Policy</a><br>');
    },
    /*
     * Callback from server
     */
    received: function (type, roomName, name, txt) {
        console.log('received', type, roomName, name, txt);
        var clsname = 'chatname context-player';

        if (name === 'IRC') {
            name = txt.split('<')[1].split('>')[0];
            txt = txt.split('<' + name + '>')[1];
            clsname = clsname + ' ircname';
        }

        if (type === 'priv') {
            //Create room if doesn't exist and switch to it
            if (!this.roomExists('priv', roomName)) {
                chathandler.createPrivateRoom(roomName);
                chathandler.setRoom('priv', roomName);
            }
        }
        var room = type + '-' + roomName;
        if (type == 'global')
            room = 'global';
        
        var $cs = $('#room-div-' + room);

        var now = new Date();
        var hours = now.getHours();
        var mins = now.getMinutes();
        var cls = 'chattime';
        var timenow = getZero(hours) + ':' + getZero(mins);

        if (localStorage.getItem('hide-chat-time') === 'true') {
            cls = cls + ' hidden';
        }

        if (timenow !== this.lastChatTime) {
            $cs.append('<div class="' + cls + '">' + timenow + '</div>');
            this.lastChatTime = timenow;
        }
        $cs.append('<span class="' + clsname + '">' + name + ':</span>');
        var options = {/* ... */};

        var occ = (txt.match(new RegExp(server.myname, "g")) || []).length;
        txt = txt.linkify(options);
        var occ2 = (txt.match(new RegExp(server.myname, "g")) || []).length;

        //someone said our name and link in string doesn't contain name
        if (occ === occ2 && txt.indexOf(server.myname) > -1) {
            txt = txt.replace(new RegExp(server.myname, "g"),
                '<span class="chatmyname">$&</span>');
        }

        $cs.append(' ' + txt + '<br>');

        $cs.scrollTop($cs[0].scrollHeight);
    },
    /*
     * Callback from server to print a msg without styling.
     * The caller will do stying on their end
     */
    raw: function(type, roomName, msg) {
        var room = type + '-' + roomName;
        if (type === 'global')
            room = 'global';
        
        var $cs = $('#room-div-' + room);
        $cs.append(' ' + msg + '<br>');
        
        $cs.scrollTop($cs[0].scrollHeight);
    },
    /*
     * Callback from UI
     */
    send: function () {
        var msg = $('#chat-me').val();
        if (msg.startsWith('.')) {
            server.send(msg.slice(1));
        } else {
            if (this.cur_room.startsWith('global'))
                server.chat('global', '', msg);
            else if (this.cur_room.startsWith('room-'))
                server.chat('room', this.cur_room.split('room-')[1], msg);
            else //Assuming priv
                server.chat('priv', this.cur_room.split('priv-')[1], msg);
        }
        $('#chat-me').val('');
    },
    /*
     * Callback from UI
     */
    selectRoom: function (type, name) {
        this.cur_room = (type + '-' + name);
        if (type === 'global')
            this.cur_room = 'global';
        
        title = $('.room-name-' + this.cur_room + ' a span').html()
        $('#cur_room').html(title);
    },
    
    setRoom: function (type, name) {
        var room = type + '-' + name;
        $('.room-name-' + room + ' a').tab('show');
        chathandler.selectRoom(type, name);
    },
    /*
     * Callback from UI
     */
    removeRoom: function (type, name) {
        var room = type + '-' + name;
        console.log('remove '+room);
        
        if (this.cur_room === room) {
            $('#room_list li:eq(0) a').tab('show');
            this.selectRoom('global', 'global');
        }
        
        if (type === 'room')
            server.leaveroom(name);
        
        $('.room-name-' + room).remove();
        $('#room-div-' + room).remove();
    },
    /*
     * Callback from UI
     */
    createRoom: function (type, name, title) {
        var room = type + '-' + name;
        
        var room_div = $('<div/>').attr('id', 'room-div-' + room)
                            .addClass('tab-pane');
        $('#room_divs').append(room_div);
        
        var room_list = $('#room_list');
        var a = $('<a/>').click(function() { chathandler.selectRoom(type, name) })
                            .attr('data-toggle', 'tab')
                            .attr('href', '#room-div-' + room)
                            .append(title);
        var li = $('<li/>').append(a).addClass('room-name-' + room);
        
        $('<div/>').addClass('btn').html('&times;')
                        .click(function() { chathandler.removeRoom(type, name)})
                        .appendTo(li);
        
        $('#room_list').append(li);
    },
    
    /*
     * Callback from UI
     */
    createGameRoom: function (game, p1, p2) {
        var p1span = $('<span/>').html(p1).addClass('playername');
        var p2span = $('<span/>').html(p2).addClass('playername');
        var vs = $('<span/>').html(' vs ');
        var sp = $('<span/>').append(p1span).append(vs).append(p2span);
        
        this.createRoom('room', game, sp);
    },
    
    createPrivateRoom: function (player) {
        var psp = $('<span/>').html(player).addClass('playername');
        var sp = $('<span/>').append(psp);
        
        this.createRoom('priv', player, sp);
    },
    
    roomExists: function (type, name) {
        return $('.room-name-' + type + '-' + name).length;
    },
    /*
     * Notify checkbox change for checkbox:
     * Hide chat time
     */
    hideChatTime: function() {
        if (document.getElementById('hide-chat-time').checked) {
            localStorage.setItem('hide-chat-time', 'true');
            $('.chattime').each(function (index) {
                $(this).addClass('hidden');
            });
        } else {
            localStorage.setItem('hide-chat-time', 'false');
            $('.chattime').each(function (index) {
                $(this).removeClass('hidden');
            });
        }
    },
    showchat: function() {
        $('#chat-toggle-button').css('right', this.chat_width+5);
        $('#chat-toggle-text').html('>><br>c<br>h<br>a<br>t');
        $('#chat').removeClass('hidden');
    },
    hidechat: function() {
        $('#chat-toggle-button').css('right', 0);
        $('#chat-toggle-text').html('<<<br>c<br>h<br>a<br>t');
        $('#chat').addClass('hidden');
    },
    adjustChatWidth: function(width) {
        this.chat_width = width;
        
        $('#chat-size-display').html(this.chat_width);
        $('#chat-size-slider').val(this.chat_width);
        $('#chat').width(this.chat_width);

        $('chat-toggle-button').css('right', this.chat_width+5);
    },
    togglechat: function() {
        if($('#chat').hasClass('hidden')) {
            this.showchat()
        } else {
            this.hidechat();
        }
    }
};

$(function() {
    $.contextMenu({
        selector: '.context-player',
        trigger: 'left',
        items: {
            PrivateChat: {
                name: "Private chat",
                callback: function(key, opt) {
                    var name = opt.$trigger.context.innerText.split(':')[0];
                    
                    //Don't create if already exists
                    if (!chathandler.roomExists('priv', name))
                        chathandler.createPrivateRoom(name);
                    
                    chathandler.setRoom('priv', name);
                }
            },
            Games: {
                name: "Games",
                callback: function(key, opt) {
                    var name = opt.$trigger.context.innerText.split(':')[0];
                    //yuck.. but we don't need any more sophistication
                    var url = "https://www.playtak.com/games/search?game%5Bplayer_white%5D=kaka&game%5Bplayer_black%5D=kaka&game%5Bjoin%5D=or";
                    url = url.replace(/kaka/g, name);
                    window.open(url);
                }
            },
        }
    });

    $('.context-player').on('click', function(e){
        console.log('clicked', this);
    })
});