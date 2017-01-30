const WHITE_PLAYER = 1, BLACK_PLAYER = 2;
var stack_dist = 105;
var piece_size = 88;
var piece_height = 15;
var sq_size = 90;
var sq_height = 15;
var capstone_height = 70;
var capstone_radius = 30;
var stack_selection_height = 60;
var border_size = 30;
var stackOffsetFromBorder = 50;
var letter_size = 12;
var diagonal_walls = false;

var raycaster = new THREE.Raycaster();
var highlighter;
var mouse = new THREE.Vector2();
var offset = new THREE.Vector3();

var materials = {
    images_root_path: 'images/',
    board_texture_path: 'images/board/',
    pieces_texture_path: 'images/pieces/',
    white_sqr_style_name: 'simple',
    black_sqr_style_name: 'simple',
    white_piece_style_name: 'simple',
    black_piece_style_name: 'simple',
    white_cap_style_name: 'simple',
    black_cap_style_name: 'simple',
    white_piece: new THREE.MeshBasicMaterial({color: 0xd4b375}),
    black_piece: new THREE.MeshBasicMaterial({color: 0x573312}),
    white_cap: new THREE.MeshBasicMaterial({color: 0xd4b375}),
    black_cap: new THREE.MeshBasicMaterial({color: 0x573312}),
    white_sqr: new THREE.MeshBasicMaterial({color: 0xe6d4a7}),
    black_sqr: new THREE.MeshBasicMaterial({color: 0xba6639}),
    border: new THREE.MeshBasicMaterial({color: 0x6f4734}),
    letter: new THREE.MeshBasicMaterial({color: 0xFFF5B5}),
    highlighter: new THREE.LineBasicMaterial({color: 0x0000f0}),

    getWhiteSquareTextureName: function() {
        return this.board_texture_path + 'white_' + this.white_sqr_style_name + '.png';
    },
    getBlackSquareTextureName: function(styleName) {
         return this.board_texture_path + 'black_' + this.black_sqr_style_name + '.png';
    },
    getWhitePieceTextureName: function() {
        return this.pieces_texture_path + 'white_' + this.white_piece_style_name + '_pieces.png';
    },
    getBlackPieceTextureName: function() {
         return this.pieces_texture_path + 'black_' + this.black_piece_style_name + '_pieces.png';
    },
    getWhiteCapTextureName: function() {
        return this.pieces_texture_path + 'white_' + this.white_cap_style_name + '_caps.png';
    },
    getBlackCapTextureName: function() {
         return this.pieces_texture_path + 'black_' + this.black_cap_style_name + '_caps.png';
    },
    // updateBoardMaterials after the user changes the board styles
    updateBoardMaterials: function() {
        var loader = new THREE.TextureLoader();
        this.boardLoaded = 0;

        this.white_sqr = new THREE.MeshBasicMaterial(
            {map: loader.load(this.getWhiteSquareTextureName(), this.boardLoadedFn)});
        this.black_sqr = new THREE.MeshBasicMaterial(
            {map: loader.load(this.getBlackSquareTextureName(), this.boardLoadedFn)});
    },
    // updatePieceMaterials after the user changes the piece styles
    updatePieceMaterials: function() {
        var loader = new THREE.TextureLoader();
        this.piecesLoaded = 0;

        this.white_piece = new THREE.MeshBasicMaterial(
        {map: loader.load(this.getWhitePieceTextureName(), this.piecesLoadedFn)});
        this.black_piece = new THREE.MeshBasicMaterial(
            {map: loader.load(this.getBlackPieceTextureName(), this.piecesLoadedFn)});
        this.white_cap = new THREE.MeshBasicMaterial(
            {map: loader.load(this.getWhiteCapTextureName(), this.piecesLoadedFn)});
        this.black_cap = new THREE.MeshBasicMaterial(
            {map: loader.load(this.getBlackCapTextureName(), this.piecesLoadedFn)});
    },

    piecesLoaded: 0,
    //callback on loading piece textures
    piecesLoadedFn: function() {
      materials.piecesLoaded++;

      if(materials.piecesLoaded === 4) {
        materials.piecesLoaded = 0;
        // reapply texture.
        for (i = 0; i < board.piece_objects.length ; i++) {
          if (board.piece_objects[i].iscapstone)
          {
              board.piece_objects[i].material = (board.piece_objects[i].iswhitepiece)
                  ? materials.white_cap : materials.black_cap;
          } else {
              board.piece_objects[i].material = (board.piece_objects[i].iswhitepiece)
                  ? materials.white_piece : materials.black_piece;
          }
        }
      }
    },

    boardLoaded: 0,
    //callback on loading board textures
    boardLoadedFn: function() {
      materials.boardLoaded++;

      if(materials.boardLoaded === 2) {
        materials.boardLoaded = 0;
        for (i = 0; i < board.size * board.size; ++i) {
            if (board.board_objects[i].isboard===true) {
                board.board_objects[i].material =
                    ((i + Math.floor(i / board.size) * ((board.size - 1) % 2)) % 2)
                    ? materials.white_sqr : materials.black_sqr;
            }
        }
      }
    }
};

var boardFactory = {
    makeSquare: function(file,rankInverse,scene) {
        var geometry = new THREE.BoxGeometry(sq_size, sq_height, sq_size);
        geometry.center();
        var square = new THREE.Mesh(geometry, ((file+rankInverse) % 2 ? materials.white_sqr : materials.black_sqr));
        square.position.set(board.sq_position.startx + file*sq_size, 0,
                            board.sq_position.startz + rankInverse*sq_size);
        square.file = file;
        square.rank = board.size - 1 - rankInverse;
        square.isboard = true;
        scene.add(square);
        return square;
    },
    makeBorders: function(scene) {
        // We use the same geometry for all 4 borders. This means the borders
        // overlap each other at the corners. Probably OK at this point, but
        // maybe there are cases where that would not be good.
        var geometry = new THREE.BoxGeometry(board.length, piece_height, border_size);
        geometry.center();
        var border;

        // Top border
        border = new THREE.Mesh(geometry, materials.border);
        border.position.set(0, 0, board.corner_position.z + border_size/2);
        scene.add(border);
        // Bottom border
        border = new THREE.Mesh(geometry, materials.border);
        border.position.set(0, 0, board.corner_position.endz - border_size/2);
        border.rotateY(Math.PI);
        scene.add(border);
        // Left border
        border = new THREE.Mesh(geometry, materials.border);
        border.position.set(board.corner_position.x + border_size/2, 0, 0);
        border.rotateY(Math.PI/2);
        scene.add(border);
        // Right border
        border = new THREE.Mesh(geometry, materials.border);
        border.position.set(board.corner_position.endx - border_size/2, 0, 0);
        border.rotateY(-Math.PI / 2);
        scene.add(border);

        var loader = new THREE.FontLoader();
        loader.load('fonts/helvetiker_regular.typeface.js', function(font) {
                // add the letters and numbers around the border
                for (var i = 0; i < board.size; i++) {
                    var geometry, letter;

                    // Top letters
                    geometry = new THREE.TextGeometry(String.fromCharCode('A'.charCodeAt(0) + i),
                        {size: letter_size, height: 1, font: font, weight: 'normal'});
                    letter = new THREE.Mesh(geometry, materials.letter);
                    letter.rotateX(Math.PI / 2);
                    letter.rotateY(Math.PI);
                    letter.position.set(board.sq_position.startx + letter_size/2 + i*sq_size, sq_height/2,
                                        board.corner_position.z + border_size/2 - letter_size/2);
                    scene.add(letter);
                    // Bottom letters
                    geometry = new THREE.TextGeometry(String.fromCharCode('A'.charCodeAt(0) + i),
                        {size: letter_size, height: 1, font: font, weight: 'normal'});
                    letter = new THREE.Mesh(geometry, materials.letter);
                    letter.rotateX(-Math.PI / 2);
                    letter.position.set(board.sq_position.startx - letter_size/2 + i*sq_size, sq_height/2,
                                        board.corner_position.endz - border_size/2 + letter_size/2);
                    scene.add(letter);
                    // Left side numbers
                    geometry = new THREE.TextGeometry(String.fromCharCode('1'.charCodeAt(0) + i),
                        {size: letter_size, height: 1, font: font, weight: 'normal'});
                    letter = new THREE.Mesh(geometry, materials.letter);
                    letter.rotateX(-Math.PI / 2);
                    letter.position.set(board.corner_position.x + letter_size, sq_height / 2,
                                        board.sq_position.endz + letter_size/2 - i*sq_size);
                    scene.add(letter);
                    // Right side numbers
                    geometry = new THREE.TextGeometry(String.fromCharCode('1'.charCodeAt(0) + i),
                        {size: letter_size, height: 1, font: font, weight: 'normal'});
                    letter = new THREE.Mesh(geometry, materials.letter);
                    letter.rotateX(-Math.PI / 2);
                    letter.rotateZ(Math.PI);
                    letter.position.set(board.corner_position.endx - letter_size, sq_height / 2,
                                        board.sq_position.endz - letter_size/2 - i*sq_size);
                    scene.add(letter);
                }
            });
    }
};

var pieceFactory = {
    makePiece: function(playerNum,pieceNum,scene) {
        var materialMine = (playerNum === WHITE_PLAYER ? materials.white_piece : materials.black_piece);
        var materialOpp = (playerNum === WHITE_PLAYER ? materials.black_piece : materials.white_piece);
        var geometry = new THREE.BoxGeometry(piece_size, piece_height, piece_size);
        geometry.center();

        var stackno = Math.floor(pieceNum / 10);
        var stackheight = pieceNum % 10;
        var piece = new THREE.Mesh(geometry, materialMine);
        piece.iswhitepiece = (playerNum === WHITE_PLAYER);
        if (playerNum === WHITE_PLAYER) {
            piece.position.set(board.corner_position.endx + stackOffsetFromBorder + piece_size/2,
                                stackheight*piece_height,
                                board.corner_position.endz - piece_size/2 - stackno*stack_dist);
        } else {
            piece.position.set(board.corner_position.x - stackOffsetFromBorder - piece_size/2,
                                stackheight*piece_height,
                                board.corner_position.z + piece_size/2 + stackno*stack_dist);
        }

        piece.isstanding = false;
        piece.onsquare = null;
        piece.isboard = false;
        piece.iscapstone = false;
        scene.add(piece);
        return piece;
    },
    makeCap: function(playerNum,capNum,scene) {
        var geometry = new THREE.CylinderGeometry(capstone_radius, capstone_radius, capstone_height, 30);
        geometry.center();

        // the capstones go at the other end of the row
        var piece;
        if ( playerNum === WHITE_PLAYER) {
            piece = new THREE.Mesh(geometry, materials.white_cap);
            piece.position.set(board.corner_position.endx + capstone_radius + stackOffsetFromBorder,
                                capstone_height/2,
                                board.corner_position.z + capstone_radius + capNum*stack_dist);
            piece.iswhitepiece = true;
        } else {
            piece = new THREE.Mesh(geometry, materials.black_cap);
            piece.position.set(board.corner_position.x - capstone_radius - stackOffsetFromBorder,
                                capstone_height/2,
                                board.corner_position.endz - capstone_radius - capNum*stack_dist);
            piece.iswhitepiece = false;
        }
        piece.isstanding = true;
        piece.onsquare = null;
        piece.isboard = false;
        piece.iscapstone = true;
        scene.add(piece);
        return piece;
    }
};

var board = {
    size: 0,
    totcaps: 0,
    tottiles: 0,
    whitepiecesleft: 0,
    blackpiecesleft: 0,
    mycolor: "white",
    movecount: 0,  // how many moves have been made in this game
    moveshown: 0,  // which move are we showing (we can show previous moves)
    // movestart is the initial move number of this game.
    // An empty board starts from 0, but a game loaded from
    // TPS may start at some other move.
    // This matters during Undo, because we can't undo beyond
    // the initial board layout received from the TPS.
    movestart: 0,
    scratch: true,
    // string representation of contents of each square on the board
    sq: [],
    // visual objects representing the board
    board_objects: [],
    // visual objects representing the pieces
    piece_objects: [],
    move: {start: null, end: null, dir: 'U', squares: []},
    highlighted: null,
    totalhighlighted: null,
    selected: null,
    selectedStack: null,
    ismymove: false,
    server: null,
    gameno: 0,
    boardside: "white",
    result: "",
    observing: false,

    // Keep track of some important positions
    sq_position: {startx: 0, startz: 0, endx:0, endz:0},
    corner_position: {x: 0, z: 0, endx: 0, endz: 0},

    // a stack of board layouts
    board_history: [],
    timer_started: false,
    // the game has ended and play cannot continue
    isPlayEnded: false,

    create: function (sz, color, isScratch, obs) {
        this.size = sz;

        if (sz === 3) {
            this.totcaps = 0;
            this.tottiles = 10;
        } else if (sz === 4) {
            this.totcaps = 0;
            this.tottiles = 15;
        } else if (sz === 5) {
            this.totcaps = 1;
            this.tottiles = 21;
        } else if (sz === 6) {
            this.totcaps = 1;
            this.tottiles = 30;
        } else if (sz === 7) {
            this.totcaps = 2;
            this.tottiles = 40;
        } else {
            this.totcaps = 2;
            this.tottiles = 50;
        }
        this.whitepiecesleft = this.tottiles + this.totcaps;
        this.blackpiecesleft = this.tottiles + this.totcaps;

        this.mycolor = color;
        this.sq = [];
        this.initCounters(0);
        this.scratch = isScratch;
        this.board_objects = [];
        this.piece_objects = [];
        this.highlighted = null;
        this.selected = null;
        this.selectedStack = null;
        this.gameno = 0;
        this.move = {start: null, end: null, dir: 'U', squares: []};
        this.result = "";
        this.observing = typeof obs !== 'undefined' ? obs : false;
        this.ismymove = this.checkifmymove();
        this.board_history = [];
        this.timer_started = false;
    },
    initEmpty: function () {
        // we keep track of the complete board position before each move
        // thus, the initial board position is an empty board of the proper size
        this.pushInitialEmptyBoard(this.size);

        this.addboard();
        this.addpieces();

        document.getElementById("player-opp").className = "selectplayer";
        document.getElementById("player-me").className = "";

        if (this.mycolor !== this.boardside)
            this.reverseboard();
    },
    initCounters: function (startMove) {
        this.movestart = startMove;
        this.movecount = startMove;
        this.moveshown = startMove;
    },
    calculateBoardPositions: function() {
        this.length = this.size*sq_size + border_size*2;
        this.sq_position.endx = ((this.size-1)*sq_size) / 2.0;
        this.sq_position.endz = ((this.size-1)*sq_size) / 2.0;
        this.sq_position.startx = -this.sq_position.endx;
        this.sq_position.startz = -this.sq_position.endz;
        this.corner_position.endx = this.length/2;
        this.corner_position.endz = this.length/2;
        this.corner_position.x = -this.corner_position.endx;
        this.corner_position.z = -this.corner_position.endz;
    },
    // addboard: draws the empty board in the scene
    // The center of the board is at 0,0,0.
    // All these elements are drawn as centered at their x,y,z position
    addboard: function () {
        this.calculateBoardPositions();

        // draw the squares
        for (i = 0; i < this.size; i++) {
            for (j = 0; j < this.size; j++) {
                // We draw them from the left to right and top to bottom.
                // But, note, the naming (A1, B1, etc) is left to right and bottom to top.
                var square = boardFactory.makeSquare(i,j,scene);
                this.board_objects.push(square);
                this.sq[i][j].board_object = square;
            }
        }

        // draw the border around the squares
        boardFactory.makeBorders(scene);
    },
    // addpieces: add the pieces to the scene, not on the board
    addpieces: function () {
        var piece;
        for (var i=0 ; i < this.tottiles; i++ ) {
            piece = pieceFactory.makePiece(WHITE_PLAYER,i,scene);
            this.piece_objects.push(piece);

            piece = pieceFactory.makePiece(BLACK_PLAYER,i,scene);
            this.piece_objects.push(piece);
        }

        for (var i=0; i < this.totcaps; i++) {
            piece = pieceFactory.makeCap(WHITE_PLAYER,i,scene);
            this.piece_objects.push(piece);

            piece = pieceFactory.makeCap(BLACK_PLAYER,i,scene);
            this.piece_objects.push(piece);
        }
    },
    // called if the user changes the texture of the board
    updateboard: function () {
        materials.updateBoardMaterials();
    },
    // called if the user changes the texture or size of the pieces
    updatepieces: function () {
        var geometry = new THREE.BoxGeometry(piece_size, piece_height, piece_size);
        materials.updatePieceMaterials();
        var old_size = this.piece_objects[0].geometry.parameters.width;

        // for all pieces...
        for (i = 0; i < this.piece_objects.length ; i++) {
            if (this.piece_objects[i].iscapstone) {
            // <updates on the capstones will be made here>
            } else {
                // if standing, reset and reapply orientation.
                if (this.piece_objects[i].isstanding) {
                    this.piece_objects[i].rotation.set(0, 0, 0);
                    this.piece_objects[i].updateMatrix();
                    this.piece_objects[i].position.y -= old_size / 2 - piece_height / 2;
                    this.piece_objects[i].isstanding = false;
                    this.standup(this.piece_objects[i]);
                }

                // reapply geometry.
                this.piece_objects[i].geometry = geometry;
                this.piece_objects[i].updateMatrix();
            }
        }
    },
    file: function (no) {
        return String.fromCharCode('A'.charCodeAt(0) + no);
    },
    //file is no. rank is no.
    squarename: function (file, rank) {
        return this.file(file) + (rank + 1);
    },
    get_board_obj: function (file, rank) {
        return this.sq[file][this.size - 1 - rank].board_object;
    },
    incmovecnt: function () {
        this.save_board_pos();
        if(this.moveshown === this.movecount) {
          this.moveshown++;
          $('.curmove:first').removeClass('curmove');
          $('.moveno'+this.movecount+':first').addClass('curmove');
        }
        this.movecount++;
        document.getElementById("move-sound").play();

        $('#player-me').toggleClass('selectplayer');
        $('#player-opp').toggleClass('selectplayer');

       // In a scratch game I'm playing both colors
        if (this.scratch) {
            if (this.mycolor === "white")
                this.mycolor = "black";
            else
                this.mycolor = "white";
        }

        this.ismymove = this.checkifmymove();
        $('#undo').removeClass('i-requested-undo').removeClass('opp-requested-undo').addClass('request-undo');
    },
    // We save an array that contains a description of the pieces in each cell.
    // Each piece is either a:  p=flatstone, c=capstone, w=wall
    // Uppercase is a whitepiece, Lowercase is a blackpiece
    save_board_pos: function() {
        var bp = [];
        //for all squares, convert stack info to board position info
        for(var i=0;i<this.size;i++) {
            for(var j=0;j<this.size;j++) {
                var bp_sq = [];
                var stk = this.sq[i][j];

                //if(stk.length===0)
                //  bp_sq.push('.');
                for(var s=0;s<stk.length;s++) {
                    var pc = stk[s];
                    var c = 'p';
                    if(pc.iscapstone)
                        c = 'c';
                    else if (pc.isstanding)
                        c = 'w';

                    if(pc.iswhitepiece)
                        c = c.charAt(0).toUpperCase();

                    bp_sq.push(c);
                }
                bp.push(bp_sq);
            }
        }
        this.board_history.push(bp);
    },
    apply_board_pos: function(moveNum) {
        // grab the given board_history
        // pos is a single dim. array of size*size containing arrays of piece types
        var pos = this.board_history[moveNum  - this.movestart];
        if (pos === 'undefined') {
            console.log( "no board position found for moveNum " + moveNum);
            return;
        }

        // scan through each cell in the pos array
        for(var i=0;i<this.size;i++) {//file
            for(var j=0;j<this.size;j++) {//rank
                var sq = this.get_board_obj(i, j);
                var sqpos = pos[i*this.size + j];
                // sqpos describes a stack of pieces in that square
                // scan through those pieces
                for(var s=0;s<sqpos.length;s++) {
                    var pc = sqpos[s];
                    var iscap = (pc==='c' || pc==='C');
                    var iswall = (pc==='w' || pc==='W');
                    var iswhite = (pc===pc.charAt(0).toUpperCase());

                    // get an available piece
                    var pc = this.getfromstack(iscap, iswhite);
                    // what if there is not a piece available? Maybe that
                    // is not possible, because when we first created the board
                    // we know that there were enough pieces.
                    if(iswall)
                        this.standup(pc);

                    this.pushPieceOntoSquare(sq, pc);

                    if(iswhite)
                        this.whitepiecesleft--;
                    else
                        this.blackpiecesleft--;
                }
            }
        }
    },
    leftclick: function () {
        this.remove_total_highlight();
        if (!this.ismymove) {
            return;
        }

        // if the board position is valid and we've got a piece in our hand then place it
        if (this.highlighted && this.selected) {
            st = this.get_stack(this.highlighted);
            hlt = this.highlighted;
            this.unhighlight_sq();
            sel = this.selected;
            this.unselect();

            //place on board
            if (st.length === 0) {
                this.pushPieceOntoSquare(hlt, sel);

                var stone = 'Piece';
                if (sel.iscapstone)
                    stone = 'Cap';
                else if (sel.isstanding)
                    stone = 'Wall';

                console.log("Place " + this.movecount,
                        sel.iswhitepiece ? 'White' : 'Black', stone,
                        this.squarename(hlt.file, hlt.rank));

                var sqname = this.squarename(hlt.file, hlt.rank);
                var msg = "P " + sqname;
                if (stone !== 'Piece')
                    msg += " " + stone.charAt(0);
                this.sendmove(msg);
                this.notatePmove(sqname, stone.charAt(0));

                var pcs;
                if (this.mycolor === "white") {
                    this.whitepiecesleft--;
                    pcs = this.whitepiecesleft;
                } else {
                    this.blackpiecesleft--;
                    pcs = this.blackpiecesleft;
                }
                if (this.scratch) {
                    var over = this.checkroadwin();
                    if(!over) {
                        over = this.checksquaresover();
                        if (!over && pcs <= 0) {
                            this.findwhowon();
                            this.gameover();
                        }
                    }
                }
                this.incmovecnt();
            }
            return;
        }

        // if a piece is already in our hand
        if (this.selected) {
            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects(scene.children);
            if (intersects.length > 0) {
                var obj = intersects[0].object;
                //if already selected is same as clicked obj, rotate it
                if (this.selected === obj && Math.floor(this.movecount / 2) !== 0) {
                    this.rotate(obj);
                    return;
                }
            }
            this.unselect(obj);
            return;
        }

        // if we've got a stack in our hand
        if (this.selectedStack) {
            if (this.highlighted && this.selectedStack.length > 0) {
                var obj = this.selectedStack.pop();
                //this.unselectStackElem(obj);
                this.pushPieceOntoSquare(this.highlighted, obj);
                this.move_stack_over(this.highlighted, this.selectedStack);
                this.move.squares.push(this.highlighted);

                if (this.move.squares.length > 1 && this.move.dir === 'U')
                    this.setmovedir();

                if (this.selectedStack.length === 0) {
                    this.move.end = this.highlighted;
                    this.selectedStack = null;
                    this.unhighlight_sq();
                    this.generateMove();
                }
            } else {
                this.move.end = this.move.squares[this.move.squares.length - 1];
                this.unselectStack();
                this.generateMove();
            }
            return;
        }

        // if we are here, then we don't have something in our hand
        this.unhighlight_sq();

        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(scene.children);
        //select piece
        if (intersects.length > 0) {
            var obj = intersects[0].object;

            if (!obj.isboard && !obj.onsquare && !this.isPlayEnded) {
                // these must match to pick up this obj
                if (obj.iswhitepiece !== this.is_white_piece_to_move())
                    return;
                //no capstone move on 1st moves
                if (Math.floor(this.movecount / 2) === 0 && obj.iscapstone)
                    return;

                this.select(obj);
            }
            //select stack ... no stack selection on 1st moves
            else if (!this.selectedStack && Math.floor(this.movecount / 2) !== 0 && !this.isPlayEnded) {
                var sq = obj;
                if (!obj.isboard) {
                    if (!obj.onsquare)
                        return;
                    sq = obj.onsquare;
                }
                var stk = this.get_stack(sq);
                if (this.is_top_mine(sq) && stk.length > 0) {
                    this.selectStack(stk);
                    this.move.start = sq;
                    this.move.squares.push(sq);
                }
            }
        }
    },
    mousemove: function () {
        if (!this.ismymove)
            return;

        raycaster.setFromCamera(mouse, camera);
        if (!this.selected && !this.selectedStack)
            return;

        var intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            var obj = intersects[0].object;
            if (!obj.isboard && !obj.onsquare)
                return;
            if (!obj.isboard)
                obj = obj.onsquare;

            if (this.selectedStack) {
                var tp = this.top_of_stack(obj);
                if (tp && tp.iscapstone)
                    return;
                if (tp && tp.isstanding &&
                        !this.selectedStack[this.selectedStack.length - 1].iscapstone)
                    return;

                var prev = this.move.squares[this.move.squares.length - 1];

                var rel = this.sqrel(prev, obj);

                if (this.move.dir === 'U' && rel !== 'OUTSIDE')
                    this.highlight_sq(obj);
                else if (this.move.dir === rel || rel === 'O')
                    this.highlight_sq(obj);
            } else if (this.get_stack(obj).length === 0) {
                this.highlight_sq(obj);
            }
        } else {
            this.unhighlight_sq();
        }
    },
    sendmove: function (e) {
        if (!this.server || this.scratch)
            return;
        server.send("Game#" + this.gameno + " " + e);
    },
    getfromstack: function (cap, iswhite) {
        //  scan through the pieces for the first appropriate one
        for (i = this.piece_objects.length-1; i >= 0; i--) {
            var obj = this.piece_objects[i];
            // not on a square, and matches color, and matches type
            if (!obj.onsquare &&
                    (obj.iswhitepiece === iswhite) &&
                    (cap === obj.iscapstone) ) {
                return obj;
            }
        }
        return null;
    },
    //move the server sends
    serverPmove: function (file, rank, caporwall) {
        var oldpos = -1;
        if(board.moveshown!=board.movecount) {
          oldpos = board.moveshown;
        }

        dontanimate = true;
        fastforward();
        var obj = this.getfromstack((caporwall === 'C'), this.is_white_piece_to_move());

        if (!obj) {
            console.log("something is wrong");
            return;
        }

        if (caporwall === 'W') {
            this.standup(obj);
        }

        var hlt = this.get_board_obj(file.charCodeAt(0) - 'A'.charCodeAt(0), rank - 1);
        this.pushPieceOntoSquare(hlt, obj);

        this.notatePmove(file + rank, caporwall);
        this.incmovecnt();

        if(oldpos !== -1)
          board.showmove(oldpos);

        dontanimate = false;
    },
    //Move move the server sends
    serverMmove: function (f1, r1, f2, r2, nums) {
        var oldpos = -1;
        if(board.moveshown!=board.movecount) {
          oldpos = board.moveshown;
        }

        dontanimate = true;
        fastforward();
        var s1 = this.get_board_obj(f1.charCodeAt(0) - 'A'.charCodeAt(0), r1 - 1);
        var fi = 0, ri = 0;
        if (f1 === f2)
            ri = r2 > r1 ? 1 : -1;
        if (r1 === r2)
            fi = f2 > f1 ? 1 : -1;

        var tot = 0;
        for (i = 0; i < nums.length; i++)
            tot += nums[i];

        var tstk = [];
        var stk = this.get_stack(s1);
        for (i = 0; i < tot; i++) {
            tstk.push(stk.pop());
        }
        for (i = 0; i < nums.length; i++) {
            var sq = this.get_board_obj(s1.file + (i + 1) * fi, s1.rank + (i + 1) * ri);
            for (j = 0; j < nums[i]; j++) {
                this.pushPieceOntoSquare(sq, tstk.pop());
            }
        }
        this.notateMmove(f1.charCodeAt(0) - 'A'.charCodeAt(0), Number(r1) - 1,
                f2.charCodeAt(0) - 'A'.charCodeAt(0), Number(r2) - 1, nums);
        this.incmovecnt();

        if(oldpos !== -1)
          board.showmove(oldpos);

        dontanimate = false;
    },
    gameover: function (premsg) {
        premsg = (typeof premsg === 'undefined') ? "" : premsg + " ";
        console.log('gameover ' + this.result);
        this.notate(this.result);
        alert("info", premsg + "Game over!! " + this.result);
        this.scratch = true;
        this.isPlayEnded = true;
    },
    newgame: function (sz, col) {
        this.clear();
        this.create(sz, col, false, false);
        this.initEmpty();
    },
    findwhowon: function () {
        var whitec = 0, blackc = 0;
        for (i = 0; i < this.size; i++) {
            for (j = 0; j < this.size; j++) {
                var stk = this.sq[i][j];
                if (stk.length === 0)
                    continue;
                var top = stk[stk.length - 1];
                if (top.isstanding && !top.iscapstone)
                    continue;
                if (top.iswhitepiece)
                    whitec++;
                else
                    blackc++;
            }
        }
        if (whitec === blackc)
            this.result = "1/2-1/2";
        else if (whitec > blackc)
            this.result = "F-0";
        else
            this.result = "0-F";
    },
    checkroadwin: function () {
        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                var cur_st = this.sq[i][j];
                cur_st.graph = -1;
                if (cur_st.length === 0)
                    continue;

                var ctop = cur_st[cur_st.length - 1];
                if (ctop.isstanding && !ctop.iscapstone)
                    continue;

                cur_st.graph = (i + j * this.size).toString();

                if (i - 1 >= 0) {
                    var left_st = this.sq[i - 1][j];
                    if (left_st.length !== 0) {
                        var ltop = left_st[left_st.length - 1];
                        if (!(ltop.isstanding && !ltop.iscapstone)) {
                            if (ctop.iswhitepiece === ltop.iswhitepiece) {
                                for (var r = 0; r < this.size; r++) {
                                    for (var c = 0; c < this.size; c++) {
                                        if (this.sq[r][c].graph === cur_st.graph) {
                                            this.sq[r][c].graph = left_st.graph;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (j - 1 >= 0) {
                    var top_st = this.sq[i][j - 1];
                    if (top_st.length !== 0) {
                        var ttop = top_st[top_st.length - 1];
                        if (!(ttop.isstanding && !ttop.iscapstone)) {
                            if (ctop.iswhitepiece === ttop.iswhitepiece) {
                                for (var r = 0; r < this.size; r++) {
                                    for (var c = 0; c < this.size; c++) {
                                        if (this.sq[r][c].graph === cur_st.graph) {
                                            this.sq[r][c].graph = top_st.graph;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        var whitewin = false;
        var blackwin = false;
        //            console.log("--------");
        //            for(var i=0;i<this.size;i++){
        //                var st="";
        //                for(var j=0;j<this.size;j++){
        //                    st+="("+this.sq[i][j].graph+") ";
        //                }
        //                console.log(st);
        //            }
        //            console.log("=======");
        for (var tr = 0; tr < this.size; tr++) {
            var tsq = this.sq[tr][0];
            var no = tsq.graph;
            if (no === -1)
                continue;
            for (var br = 0; br < this.size; br++) {
                var brno = this.sq[br][this.size - 1].graph;
                if (no === brno) {
                    if (tsq[tsq.length - 1].iswhitepiece)
                        whitewin = true;
                    else
                        blackwin = true;
                }
            }
        }
        for (var tr = 0; tr < this.size; tr++) {
            var tsq = this.sq[0][tr];
            var no = tsq.graph;
            if (no === -1)
                continue;
            for (var br = 0; br < this.size; br++) {
                var brno = this.sq[this.size - 1][br].graph;
                if (no === brno) {
                    if (tsq[tsq.length - 1].iswhitepiece)
                        whitewin = true;
                    else
                        blackwin = true;
                }
            }
        }
        if (whitewin && blackwin)
            this.result = (this.movecount%2 == 0)?"R-0":"0-R";
        else if (whitewin)
            this.result = "R-0";
        else if (blackwin)
            this.result = "0-R";

        if (whitewin || blackwin) {
          this.gameover();
          return true;
        }
        return false;
    },
    checksquaresover: function () {
        for (i = 0; i < this.size; i++)
            for (j = 0; j < this.size; j++)
                if (this.sq[i][j].length === 0)
                    return false;

        this.findwhowon();
        this.gameover("All spaces covered.");
        return true;
    },
    reverseboard: function () {
        this.boardside = (this.boardside === "white") ? "black" : "white";
        if (localStorage.getItem('auto_rotate')!=='false')
        {
          camera.position.z = -camera.position.z;
          camera.position.x = -camera.position.x;
        }
    },
    setmovedir: function () {
        var s1 = this.move.start;
        var s2 = this.move.squares[this.move.squares.length - 1];
        if (s1.file === s2.file && s1.rank === s2.rank)
            return;

        if (s1.file === s2.file) {
            if (s2.rank > s1.rank)
                this.move.dir = 'N';
            else
                this.move.dir = 'S';
        } else {
            if (s2.file > s1.file)
                this.move.dir = 'E';
            else
                this.move.dir = 'W';
        }
    },
    notate: function (txt) {
        var res=false;
        if(txt==='R-0'||txt==='0-R'||txt==='F-0'||txt==='0-F'||txt==='1-0'||txt==='0-1'||txt==='1/2-1/2') {
            var ol = document.getElementById("moveslist");
            var row = ol.insertRow();
            var cell0 = row.insertCell(0);
            cell0.innerHTML = '';

            var cell1 = row.insertCell(1);
            var cell2 = row.insertCell(2);

            if (txt==='R-0' || txt==='F-0' || txt==='1-0') {
                cell1.innerHTML = txt;
                cell2.innerHTML = '--';
            } else if (txt==='0-R' || txt==='0-F' || txt==='0-1') {
                cell1.innerHTML = '--';
                cell2.innerHTML = txt;
            } else if (txt==='1/2-1/2') {
                cell1.innerHTML = '1/2 - ';
                cell2.innerHTML = '1/2';
            }

            $('#notationbar').scrollTop(10000);
            return;
        }

        if (txt === 'load') {
            // If movecount is odd, then this initial position goes
            // in the left column and the next move will go in the right column.
            // If movecount is even, then the left column will be empty, and
            // this initial position goes in the right column,
            // and the next move will go in the left column of the next row
            if (this.movecount % 2 === 1) {
                var row = this.insertNewNotationRow(Math.floor(this.movecount / 2 + 1));
                var cell1 = row.cells[1];
                cell1.innerHTML = '<a href="#" onclick="board.showmove('+(this.movecount)+');"><span class="curmove moveno'+(this.movecount-1)+'">' + txt + '</span></a>';
            } else {
                var row = this.insertNewNotationRow(Math.floor(this.movecount / 2 + 1) - 1);
                var cell1 = row.cells[1];
                cell1.innerHTML = '<span>--</span>';
                var cell2 = row.cells[2];
                cell2.innerHTML = '<a href="#" onclick="board.showmove('+(this.movecount)+');"><span class="curmove moveno'+(this.movecount-1)+'">' + txt + '</span></a>';
            }
            return;
        }

        // if the move count is non-zero and is an odd# then the code
        // assumes there must be a row in the moveslist table that
        // we can add a new cell to.
        if (this.movecount !== 0 && this.movecount % 2 === 1) {
            var row = this.getCurrentNotationRow();
            var cell2 = row.cells[2];
            cell2.innerHTML = '<a href="#" onclick="board.showmove('+(this.movecount+1)+');"><span class=moveno'+this.movecount+'>'+txt+'</span></a>';
        } else {
            var row = this.insertNewNotationRow(Math.floor(this.movecount / 2 + 1));
            // get the left cell of the new row
            var cell1 = row.cells[1];
            cell1.innerHTML = '<a href="#" onclick="board.showmove('+(this.movecount+1)+');"><span class=moveno'+this.movecount+'>'+txt+'</span></a>';
        }
        $('#notationbar').scrollTop(10000);
    },
    getCurrentNotationRow: function () {
        var om = document.getElementById("moveslist");
        return om.rows[om.rows.length - 1];
    },
    insertNewNotationRow: function (rowNum) {
        var ol = document.getElementById("moveslist");
        // make a new row
        var row = ol.insertRow();
        // insert the numbering cell
        var cell0 = row.insertCell(0);
        cell0.innerHTML = rowNum + '.';

        // insert the left and right cell
        row.insertCell(1);
        row.insertCell(2);
        return row;
    },
    notatePmove: function (sqname, pos) {
        if (pos === 'W')
            pos = 'S';
        else if (pos === 'C')
            pos = 'C';
        else
            pos = '';
        this.notate(pos + sqname.toLowerCase());
    },
    //all params are nums
    notateMmove: function (stf, str, endf, endr, nos) {
        var dir = '';
        if (stf === endf)
            dir = (endr < str) ? '-' : '+';
        else
            dir = (endf < stf) ? '<' : '>';
        var tot = 0;
        var lst = '';
        for (var i = 0; i < nos.length; i++) {
            tot += Number(nos[i]);
            lst = lst + (nos[i] + '').trim();
        }
        if (tot === 1) {
            var s1 = this.get_board_obj(stf, str);
            if (this.get_stack(s1).length === 0) {
                tot = '';
                lst = '';
            } else if (tot === Number(lst))
                lst = '';
        } else if (tot === Number(lst))
            lst = '';
        var move = tot + this.squarename(stf, str).toLowerCase()
                + dir + '' + lst;
        this.notate(move);
    },
    generateMove: function () {
        var st = this.squarename(this.move.start.file, this.move.start.rank);
        var end = this.squarename(this.move.end.file, this.move.end.rank);
        var lst = [];
        var prev = null;

        for (i = 0, c = 0; i < this.move.squares.length; i++) {
            var obj = this.move.squares[i];
            if (obj === this.move.start)
                continue;

            if (obj === prev)
                lst[c - 1] = lst[c - 1] + 1;
            else {
                prev = obj;
                lst[c] = 1;
                c++;
            }
        }
        if (st !== end) {
            console.log("Move ", this.movecount, st, end, lst);
            var nos = "";
            for (i = 0; i < lst.length; i++)
                nos += lst[i] + " ";
            this.sendmove("M " + st + " " + end + " " + nos.trim());
            this.notateMmove(this.move.start.file, this.move.start.rank,
                    this.move.end.file, this.move.end.rank, nos);
            if (this.scratch) {
                this.checkroadwin();
                this.checksquaresover();
            }
            this.incmovecnt();
        }
        this.move = {start: null, end: null, dir: 'U', squares: []};
    },
    pushPieceOntoSquare: function (sq, pc) {
        var st = this.get_stack(sq);
        var top = this.top_of_stack(sq);
        if (top && top.isstanding && !top.iscapstone && pc.iscapstone)
            this.rotate(top);

        pc.position.x = sq.position.x;

        if (pc.isstanding) {
          if(pc.iscapstone)
            pc.position.y = sq_height/2 + capstone_height/2 + piece_height*st.length;
          else
            pc.position.y = sq_height/2 + piece_size/2 + piece_height * st.length;
        } else
            pc.position.y = sq_height + st.length * piece_height;

        pc.position.z = sq.position.z;
        pc.onsquare = sq;
        st.push(pc);
    },
    rotate: function (piece) {
        if (piece.iscapstone)
            return;
        if (piece.isstanding)
            this.flatten(piece);
        else
            this.standup(piece);
    },
    flatten: function (piece) {
        if (!piece.isstanding)
            return;
        piece.position.y -= piece_size / 2 - piece_height / 2;
        if (diagonal_walls)
            piece.rotateZ(Math.PI / 4);
        piece.rotateX(Math.PI / 2);
        piece.isstanding = false;
    },
    standup: function (piece) {
        if (piece.isstanding)
            return;
        piece.position.y += piece_size / 2 - piece_height / 2;
        piece.rotateX(-Math.PI / 2);
        if (diagonal_walls)
            piece.rotateZ(-Math.PI / 4);
        piece.isstanding = true;
    },
    rightclick: function () {
        if (this.selected && Math.floor(this.movecount / 2) !== 0) {
            this.rotate(this.selected);
        } else {
            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects(scene.children);
            if (intersects.length > 0) {
                var obj = intersects[0].object;
                var sq = obj;
                if (!obj.isboard)
                    sq = obj.onsquare;
                var stk = this.get_stack(sq);
                if (stk.length === 0)
                    return;
                for (var i = 0; i < scene.children.length; i++) {
                    var obj = scene.children[i];
                    if (obj.isboard || !obj.onsquare)
                        continue;
                    obj.visible = false;
                }
                for (var i = 0; i < stk.length; i++) {
                    stk[i].visible = true;
                }
                this.totalhighlighted = sq;
            }
        }
    },
    remove_total_highlight: function () {
        if (this.totalhighlighted !== null) {
            for (var i = 0; i < scene.children.length; i++) {
                var obj = scene.children[i];
                if (obj.isboard || !obj.onsquare)
                    continue;
                obj.visible = true;
            }
            this.totalhighlighted = null;
        }
    },
    rightup: function () {
        console.log('right up');
        this.remove_total_highlight();
    },
    //bring pieces to original positions
    resetpieces: function() {
        for (var i = this.piece_objects.length - 1; i >= 0; i--) {
            scene.remove(this.piece_objects[i]);
        }

        this.whitepiecesleft = this.tottiles + this.totcaps;
        this.blackpiecesleft = this.tottiles + this.totcaps;

        this.piece_objects = [];
        this.highlighted = null;
        this.selected = null;
        this.selectedStack = null;
        this.move = {start: null, end: null, dir: 'U', squares: []};

        for (var i = 0; i < this.size; i++) {
            for (var j = 0; j < this.size; j++) {
                this.sq[i][j].length = 0;
            }
        }
        this.addpieces();
    },
    resetBoardStacks: function () {
        for (var i = 0; i < this.size; i++) {
            this.sq[i] = [];
            for (var j = 0; j < this.size; j++) {
                this.sq[i][j] = [];
            }
        }

        this.addboard();
        this.addpieces();
    },
    showmove: function(no) {
      if(this.movecount <= this.movestart || no>this.movecount || no<this.movestart || this.moveshown === no)
          return;

      var prevdontanim = dontanimate;
      dontanimate = true;

      console.log('showmove '+no);
      this.moveshown = no;
      this.resetpieces();
      this.apply_board_pos(this.moveshown);
      $('.curmove:first').removeClass('curmove');
      $('.moveno'+(no-1)+':first').addClass('curmove');

      dontanimate = prevdontanim;
    },
    undo: function() {
        // we can't undo before the place we started from
        if(this.movecount <= this.movestart)
            return;

        // This resetpieces() is to make sure there aren't any pieces
        // in mid-move, in case the user clicked a piece to place it, but
        // then clicked undo.
      this.resetpieces();
      this.movecount--;
      this.apply_board_pos(this.movecount);
      this.board_history.pop();
      this.moveshown = this.movecount;

      $('#player-me').toggleClass('selectplayer');
      $('#player-opp').toggleClass('selectplayer');

      if (this.scratch) {
          if (this.mycolor === "white")
              this.mycolor = "black";
          else
              this.mycolor = "white";
      }
      this.ismymove = this.checkifmymove();

      //fix notation
      var ml = document.getElementById("moveslist");
      var lr = ml.rows[ml.rows.length - 1];

      // first check if we are undoing the last move that finished
      // the game, if we have to do something a bit special
      var txt1 = lr.cells[1].innerHTML.trim();
      var txt2 = lr.cells[2].innerHTML.trim();
      if(txt1==='R-0'||txt1==='F-0'||txt1==='1-0'||txt1==='1/2'||txt2==='0-F'||txt2==='0-R'||txt2==='0-1') {
        ml.deleteRow(ml.rows.length - 1);
        lr = ml.rows[ml.rows.length - 1];
        this.isPlayEnded = false;
      }

      if(this.movecount % 2 == 0) {
          ml.deleteRow(ml.rows.length - 1);
      } else {
          lr.cells[2].innerHTML="";
      }

      $('.curmove:first').removeClass('curmove');
      $('.moveno'+(this.movecount-1)+':first').addClass('curmove');
    },
    //remove all scene objects, reset player names, stop time, etc
    clear: function () {
        this.isPlayEnded = false;
        for (var i = scene.children.length - 1; i >= 0; i--) {
            scene.remove(scene.children[i]);
        }
        var tbl = document.getElementById("moveslist");
        while (tbl.rows.length > 0)
            tbl.deleteRow(0);
        document.getElementById("draw").src = "images/offer-hand.png";
        stopTime();

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

        //i'm always black after clearing
        $('#player-me-name').addClass('player2-name');
        $('#player-opp-name').addClass('player1-name');

        $('#player-me-time').addClass('player2-time');
        $('#player-opp-time').addClass('player1-time');

        $('#player-me-img').removeClass('white-player-color');
        $('#player-opp-img').addClass('white-player-color');

        $('#player-opp').addClass('selectplayer');

        $('.player1-name:first').html('You');
        $('.player2-name:first').html('You');
        $('.player1-time:first').html('0:00');
        $('.player2-time:first').html('0:00');

        $('#gameoveralert').modal('hide');
    },
    sqrel: function (sq1, sq2) {
        var f1 = sq1.file;
        var r1 = sq1.rank;
        var f2 = sq2.file;
        var r2 = sq2.rank;
        if (f1 === f2 && r1 === r2)
            return 'O';

        if (f1 === f2) {
            if (r2 === r1 + 1)
                return 'N';
            else if (r1 === r2 + 1)
                return 'S';
        } else if (r1 === r2) {
            if (f2 === f1 + 1)
                return 'E';
            else if (f1 === f2 + 1)
                return 'W';
        }
        return 'OUTSIDE';
    },
    checkifmymove: function () {
        if (this.scratch)
            return true;
        if (this.observing)
            return false;
        var tomove = (this.movecount % 2 === 0) ? "white" : "black";
        //console.log('tomove = ', tomove, this.mycolor, tomove===this.mycolor);
        return tomove === this.mycolor;
    },
    is_white_piece_to_move: function () {
        // white always goes first, so must pick up a black piece
        if (this.movecount === 0)
            return false;
        // black always goes second, so must pick up a white piece
        if (this.movecount === 1)
            return true;
        // after that, if we've made an even number of moves, then it is
        // white's turn, and she must pick up a white piece
        isEven = this.movecount % 2 === 0;
        return isEven;
    },
    select: function (obj) {
        obj.position.y += stack_selection_height;
        this.selected = obj;
    },
    unselect: function () {
        if (this.selected) {
            this.selected.position.y -= stack_selection_height;
            this.selected = null;
        }
    },
    selectStack: function (stk) {
        //this.selectedStack = stk;
        this.selectedStack = [];
        for (i = 0; stk.length > 0 && i < this.size; i++) {
            obj = stk.pop();
            obj.position.y += stack_selection_height;
            this.selectedStack.push(obj);
        }
    },
    unselectStackElem: function (obj) {
        obj.position.y -= stack_selection_height;
    },
    unselectStack: function () {
        var stk = this.selectedStack.reverse();
        var lastsq = this.move.squares[this.move.squares.length - 1];
        //push unselected stack elems onto last moved square
        for (i = 0; i < stk.length; i++) {
            this.unselectStackElem(stk[i]);
            this.pushPieceOntoSquare(lastsq, stk[i]);
            this.move.squares.push(lastsq);
        }
        this.selectedStack = null;
    },
    highlight_sq: function (sq) {
        this.unhighlight_sq(this.highlighted);
        this.highlighted = sq;

        highlighter.position.x = sq.position.x;
        highlighter.position.y = sq_height / 2;
        highlighter.position.z = sq.position.z;
        scene.add(highlighter);
    },
    unhighlight_sq: function () {
        if (this.highlighted) {
            //this.highlighted.position.y -= 10;
            this.highlighted = null;
            scene.remove(highlighter);
        }
    },
    get_stack: function (sq) {
        return this.sq[sq.file][sq.rank];
    },
    top_of_stack: function (sq) {
        var st = this.get_stack(sq);
        if (st.length === 0)
            return null;
        return st[st.length - 1];
    },
    is_top_mine: function (sq) {
        var ts = this.top_of_stack(sq);
        if (!ts)
            return true;
        if (ts.iswhitepiece && this.mycolor === "white")
            return true;
        if (!ts.iswhitepiece && this.mycolor !== "white")
            return true;
        return false;
    },
    move_stack_over: function (sq, stk) {
        if (stk.length === 0)
            return;
        var top = this.top_of_stack(sq);
        if (!top)
            top = sq;

        var ts = stk[stk.length - 1];
        if (ts.onsquare === sq)
            return;

        var diffy = ts.position.y - top.position.y;

        for (i = 0; i < stk.length; i++) {
            stk[i].position.x = sq.position.x;
            stk[i].position.z = sq.position.z;
            stk[i].position.y += stack_selection_height - diffy;
            stk[i].onsquare = sq;
        }
    },

    loadptn: function (ptn) {
        if (!this.scratch && !this.observing) {
            alert('warning', 'PTN cannot be loaded while in the middle of a game');
            return;
        }
        var parsed = parsePTN(ptn);
        if (!parsed) {
            alert('warning', 'invalid PTN');
            return;
        }
        var size = parseInt(parsed.tags.Size, 10);
        if (!(size >= 3 && size <= 8)) {
            alert('warning', 'invalid PTN: invalid size');
            return;
        }
        this.clear();
        this.create(size, 'white', true, false);
        this.initEmpty();
        $('.player1-name:first').html(parsed.tags.Player1);
        $('.player2-name:first').html(parsed.tags.Player2);
        if (parsed.tags.Clock !== undefined) {
            $('.player1-time:first').html(parsed.tags.Clock);
            $('.player2-time:first').html(parsed.tags.Clock);
        }

        for (var ply = 0; ply < parsed.moves.length; ply++) {
            var move = parsed.moves[ply];
            var match;
            if ((match = /^([SFC]?)([a-h])([0-8])$/.exec(move)) !== null) {
                var piece = match[1];
                var file  = match[2].charCodeAt(0) - 'a'.charCodeAt(0);
                var rank  = parseInt(match[3]) - 1;
                var obj = this.getfromstack((piece === 'C'), this.is_white_piece_to_move());
                if (!obj) {
                    console.log("bad PTN: too many pieces");
                    return;
                }
                if (piece === 'S') {
                    this.standup(obj);
                }
                var hlt = this.get_board_obj(file, rank);
                this.pushPieceOntoSquare(hlt, obj);
            } else if ((match = /^([1-9]?)([a-h])([0-8])([><+-])(\d*)$/.exec(move)) !== null) {
                var count = match[1];
                var file  = match[2].charCodeAt(0) - 'a'.charCodeAt(0);
                var rank  = parseInt(match[3]) - 1;
                var dir   = match[4]
                var drops = match[5];

                if (drops === '') {
                    if (count == '')
                        drops = [1];
                    else
                        drops = [count];
                } else {
                    drops = drops.split('');
                }
                var tot = 0;
                var i, j;
                for (i = 0; i < drops.length; i++)
                    tot += parseInt(drops[i]);

                var df = 0, dr = 0;
                if (dir == '<') {
                    df = -1;
                } else if (dir == '>') {
                    df = 1;
                } else if (dir == '-') {
                    dr = -1;
                } else if (dir == '+') {
                    dr = 1;
                }

                var s1 = this.get_board_obj(file, rank);
                var stk = this.get_stack(s1);
                var tstk = [];

                for (i = 0; i < tot; i++)
                    tstk.push(stk.pop());

                for (i = 0; i < drops.length; i++) {
                    var sq = this.get_board_obj(s1.file + (i + 1) * df,
                                                s1.rank + (i + 1) * dr);

                    for (j = 0; j < parseInt(drops[i]); j++) {
                        this.pushPieceOntoSquare(sq, tstk.pop());
                    }
                }
            } else {
                console.log("unparseable: " + move);
                continue;
            }

            this.notate(move);
            this.incmovecnt();
        }
        if (parsed.tags.Result !== undefined) {
            this.result = parsed.tags.Result
            this.gameover();
        } else {
            this.result = '';
        }
    },

    // This function loads any valid TPS
    // It also will allow some liberties with the notation:
    //   * if you don't complete a row it assumes the cells are empty
    //   * the initial TPS tagname is optional
    //   * the player & move elements are optional
    loadtps: function (tps) {
        var playerTurn;
        var moveNumber;

        // simple RegEx for a basic TPS notation,
        // but doesn't specify the details of the actual layout
        var tpsRE = /\[(TPS\s*)?\"?\s*([,x12345678SC\/]+)(\s+([\d+]))?(\s+(\d+|-))?\s*\"?\s*\]/;
        var result = tpsRE.exec(tps);
        if (!result) {
            alert('warning', 'Invalid TPS');
            return;
        } else {
            boardLayout = result[2];

            playerToMove = parseInt(result[4]);
            if (!playerToMove) {
                playerToMove = 1;
            } else if (playerToMove != WHITE_PLAYER && playerToMove != BLACK_PLAYER) {
                alert('warning', 'Invalid TPS - player turn must be 1 or 2 - not ' + playerTurn);
                return;
            }

            moveNumber = parseInt(result[6]);
            if (!moveNumber) {
                moveNumber = 1;
            } else if (moveNumber < 1) {
                alert('warning', 'Invalid TPS - move number must be positive integer');
                return;
            }
        }

        // row descriptions are separated by slash
        var rowDescriptors = boardLayout.split("/");
        var rowCnt = rowDescriptors.length;
        if ( rowCnt < 3 || rowCnt > 8 ) {
            alert('warning', 'Invalid TPS - must be 3 to 8 rows');
            return;
        }

        this.clear();
        // a board loaded from TPS is treated as a scratch game
        this.create(rowCnt, this.determineColor(playerToMove), true, false);

        this.initFromTPS(rowDescriptors);
        if (this.checkroadwin())
            return;
        if (this.checksquaresover())
            return;

        var assumedMoveCount = this.moveCountCalc(moveNumber, moveNumber, playerToMove);

        var infoMsg = "";
        var playMsg = "";

        // We want to make some sense of the moveCount...
        var p1Cnt = this.count_pieces_on_board(WHITE_PLAYER);
        var p2Cnt = this.count_pieces_on_board(BLACK_PLAYER);
        if (p1Cnt == 0 && p2Cnt == 0) {
            // nothing played yet
            this.initCounters(0);
            this.mycolor = "white";
            playMsg = "White should start the game by placing a black piece.";
        } else if (p1Cnt == 1 && p2Cnt == 0) {
            // someone has placed a lone white piece
            alert('danger','Invalid TPS - player 1 must place a black piece first.');
            this.clear();
            this.initEmpty();
            return;
        } else if (p2Cnt == 1 && p1Cnt == 0) {
            // white has placed a black piece
            this.initCounters(1);
            this.mycolor = "black";
            if (playerToMove === WHITE_PLAYER) {
                infoMsg = "TPS has wrong player turn.";
            }
            playMsg = "It is black's turn to place the first white piece";
        } else {
            // There is at least one of each piece on the board.
            // The move count must be at least as high as 2 times
            // the number of pieces that one player has on the board
            var minMoves = this.moveCountCalc(p1Cnt, p2Cnt, playerToMove);
            if (assumedMoveCount < minMoves) {
                assumedMoveCount = minMoves;
                infoMsg = "Initializing move number to correpond with the number of pieces on the board.";
            }
            playMsg = "It is " + this.mycolor + "'s turn to play.";
            this.initCounters(assumedMoveCount);
        }

        // player-opp is white, player-me is black. Seems like those
        // names are backward, we'll just roll with it.
        document.getElementById("player-opp").className = (this.mycolor === "white" ? "selectplayer" : "");
        document.getElementById("player-me").className = (this.mycolor === "black" ? "selectplayer" : "");

        this.whitepiecesleft = this.tottiles + this.totcaps - p1Cnt;
        this.blackpiecesleft = this.tottiles + this.totcaps - p2Cnt;
        if (this.whitepiecesleft <=0 && this.blackpiecesleft <=0) {
            alert('danger','TPS nonsense - all pieces used up by both players');
            this.isPlayEnded = true;
            return;
        }
        if (this.whitepiecesleft <=0) {
            this.result = "F-0";
            this.gameover('All white pieces used.');
            return;
        }
        if (this.blackpiecesleft <=0) {
            this.result = "0-F";
            this.gameover('All black pieces used.');
            return;
        }
        this.notate("load");

        this.showmove(this.moveshown);
        alert('info', infoMsg + " " + playMsg);
    },
    // assumes that the movecount and movestart have been initialized meaningfully
    // and 0,0 is OK
    count_pieces_on_board: function(player) {
        var count = 0;
        var pos = this.board_history[this.movecount - this.movestart];
        for (i=0 ; i < pos.length ; i++) {
            var pieces = pos[i];
            // remember, upper case is white(p1) and lower case is black(p2),
            for (s=0 ; s < pieces.length; s++) {
                if (player === WHITE_PLAYER && pieces[s] === pieces[s].toUpperCase() ||
                    player === BLACK_PLAYER && pieces[s] === pieces[s].toLowerCase()) {
                    count++;
                }
            }
        }
        return count;
    },
    moveCountCalc: function (p1Turns,p2Turns,playerToMove) {
        return Math.max(p1Turns,p2Turns)*2 + (playerToMove===2 ? 1 : 0);
    },
    determineColor: function (playerTurn) {
        return playerTurn === WHITE_PLAYER ? "white" : "black";
    },
    pushInitialEmptyBoard: function (size) {
        var bp = [];
        for (var i = 0; i < size; i++) {
            this.sq[i] = [];
            for (var j = 0; j < size; j++) {
                this.sq[i][j] = [];
                bp.push([]);
            }
        }
        this.board_history.push(bp);
    },
    initFromTPS: function (rowDescriptors) {
        this.resetBoardStacks();

        // in this case the initial board position is from the TPS, we don't
        // know what it was before
        this.layoutFromTPS(rowDescriptors);

        if (this.mycolor !== this.boardside)
            this.reverseboard();

        document.getElementById("player-opp").className = "selectplayer";
        document.getElementById("player-me").className = "";
    },
    layoutFromTPS: function (rowDescriptors) {
        var rowCnt = rowDescriptors.length;
        // rows are described from top to bottom
        var currRow = rowCnt;
        for (var i = 0; i < rowCnt; i++, currRow--) {
            // cell descriptions are separated by comma
            var cellDescriptors = rowDescriptors[i].split(",");

            // a cell is either empty (maybe multiple), or a stack of one or more pieces
            var cellRE = /^((x([12345678]?))|(([12]+)([SC]?)))$/;

            var currCol = 1;
            for (var j = 0; j < cellDescriptors.length; j++) {
                if ( currCol > rowCnt ) {
                    alert('warning', 'Invalid TPS - too many cells in row ' + currRow + '... "' + rowDescriptors[i] + '"');
                    return;
                }

                var cellDescriptor = cellDescriptors[j];
                var cellResult = cellRE.exec(cellDescriptor);
                if (!cellResult) {
                    alert('warning', 'Invalid TPS - cell descriptor in row ' + currRow + '... "' + cellDescriptor + '" in "' + rowDescriptors[i] + '" is nonsense');
                    return;
                }
                if (cellResult[2]) {
                    // then we have one or more empty cells
                    emptyCnt = 1;
                    if ( cellResult[3] ) {
                        emptyCnt = parseInt(cellResult[3]);
                    }
                    currCol += emptyCnt;
                    if ( currCol > rowCnt+1 ) {
                        alert('warning', 'Invalid TPS - too many empty cells at end of row ' + currRow + '... "' + rowDescriptors[i] + '"');
                        return;
                    }
                    continue;
                }

                // We didn't find an empty cell descriptor
                // so it must be a stack descriptor.

                // Get a board object (a square) for the current column and row
                var square = this.get_board_obj(currCol-1, currRow-1);

                var stackDescriptor = cellResult[5];
                var lastStoneType = cellResult[6];
                if (!lastStoneType) {
                    lastStoneType = '';
                }

                for (var k = 0; k < stackDescriptor.length; k++) {
                    var playerNum = stackDescriptor[k];
                    var stoneType = ''; // flat stone
                    if ( k == stackDescriptor.length-1 ) {
                        stoneType = lastStoneType;
                    }

                    var pc = this.getfromstack(stoneType === 'C', playerNum === '1');
                    if (pc === null || typeof pc === 'undefined') {
                        alert('danger', 'Invalid TPS - too many pieces for player ' + playerNum + ' at row ' + currRow + ', "' + rowDescriptors[i] + '"');
                        return;
                    }
                    if (stoneType === 'S') {
                        this.standup(pc);
                    }
                    this.pushPieceOntoSquare(square, pc);
                } // iterate over stack

                currCol++;
            } // iterate over cellDescriptors
        } // iterate over rowDescriptors

        this.save_board_pos();
    }
};
