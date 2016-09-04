var chathandler = {
    lastChatTime: '',
    chat_width: 180,
    
    init: function() {
        $('#chat').offset({ top: $('nav').height() + 5 });
        $('#chat').height(window.innerHeight - $('nav').height() - 95);
        $('#chat-toggle-button').offset({ top: $('nav').height() + 7 });

        $('#chat-server').append('<a href="#" onclick="showPrivacyPolicy();"> Privacy Policy</a><br>');
    },
    received: function (msg) {
        "use strict";
        var name = msg[1].split('<')[1].split('>')[0];
        var txt = msg[1].split('<' + name + '>')[1];
        var clsname = 'chatname context-player';

        if (name === 'IRC') {
            name = txt.split('<')[1].split('>')[0];
            txt = txt.split('<' + name + '>')[1];
            clsname = clsname + ' ircname';
        }

        var $cs = $('#chat-server');

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

        var occ = (txt.match(new RegExp(this.myname, "g")) || []).length;
        txt = txt.linkify(options);
        var occ2 = (txt.match(new RegExp(this.myname, "g")) || []).length;

        //someone said our name and link in string doesn't contain name
        if (occ === occ2 && txt.indexOf(this.myname) > -1) {
            var tmp = txt.split(this.myname);
            txt = tmp[0] + '<span class="chatmyname">' + this.myname + '</span>' + tmp[1];
        }

        $cs.append(txt + '<br>');

        $cs.scrollTop($cs[0].scrollHeight);
    },
    send: function () {
        "use strict";
        
        var msg = $('#chat-me').val();
        if (msg.startsWith('.')) {
            server.send(msg.slice(1));
        } else {
            server.chat(msg);
        }
        $('#chat-me').val('');
    },
    selectRoom: function (room) {
        "use strict";
    
    },
    removeRoom: function (room) {
        "use strict";
    
    },
    createRoom: function (room) {
        "use strict";
        
    },
    
    /*
     * Notify checkbox change for checkbox:
     * Hide chat time
     */
    hideChatTime: function() {
        "use strict";
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
    sliderChatSize: function(newSize) {
        this.showchat();

        this.chat_width = Number(newSize);
        //localStorage.setItem('chat-width', this.chat_width);

        this.adjustChatWidth();
    },
    adjustChatWidth: function() {
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