window.onload = () => {
    /* variable declarations */

    let showHelp = true; // show controls screen on launch

    let score = 0; // starting score
    const highScore = "tetris_high_score"; // local storage item name for high score
    let combo = 0; // var to keep track of current combo between game ticks        

    const fps = 15; // canvas updates per second
    let frameCount = 0; // tracks total frames processed
    const fallSpeed = 3; // pieces fall 1 tile every (fps/fallSpeed) frames

    let storeSpamPrevent = 0;
    let unstoreSpamPrevent = 0;
    const gridSize = [16, 16]; // [x, y] (the canvas is divided into smaller blocks)
    let currentPiece = {tiles: [], color: "#ffffff", exists: false, pos: [0, 0]};
    let storedPiece = {tiles: [], color: "#ffffff", exists: false};

    let placedTiles = [];
    for (let i = 0; i < gridSize[1]; i++) {
        placedTiles.push([]);
        for (let j = 0; j < gridSize[0]; j++) {
            placedTiles[i].push({color: "#ffffff", exists: false});
        }
    }

    const pieceColors = [
        "#ff0000", // red
        "#00ff00", // green
        "#0000ff", // blue
        "#00bbff", // light blue
        "#00ffff", // cyan
        "#ff4aed", // pink
        "#db831f", // orange
        "#cc1fdb", // dark purple
        "#1fdb7a", // lighter green
        "#ffff00"  // bright yellow
    ];

    // all possible tetris pieces -- see https://strategywiki.org/wiki/Tetris/Pieces
    const pieces = [
        // o
        [//  col1  col2
            [true, true], // row1
            [true, true]  // row2
        ],
        // s
        [
            [false, true, true ],
            [true,  true, false]
        ],
        // z
        [
            [true,  true, false],
            [false, true, true ]
        ],
        // t
        [
            [false, true, false],
            [true,  true, true ]
        ],
        // l
        [
            [false, false, true],
            [true,  true,  true]
        ],
        // j
        [
            [true, false, false],
            [true, true,  true ]
        ],
        // i
        [
            [true, true, true, true]
        ]
    ];


    function drawTile(x, y, color) {
        if (x < 0 || x > gridSize[0] || y < 0 || y > gridSize[1]) return;
        let a = c.width/gridSize[0];
        let b = c.height/gridSize[1];

        ctx.fillStyle = color;
        ctx.fillRect(a*x, b*y, a, b);
    }


    function drawShape(x, y, color, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let tile = 0; tile < shape[row].length; tile++) {
                if (shape[row][tile].exists == undefined) {
                    if (shape[row][tile]) drawTile(x+tile, y+row, color);
                } else {
                    if (shape[row][tile].exists) drawTile(x+tile, y+row, shape[row][tile].color)
                }
            }
        }   
    }


    function rotateClockwise(shape) {
        // create empty array with dimensions rotated 90deg
        let temp = [];
        for (let i = 0; i < shape[0].length; i++) {
            temp.push([]);
            for (let j = 0; j < shape.length; j++) {
                temp[i].push(null);
            }
        }

        // copy arrays values to new array but rotated
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[0].length; j++) {
                temp[j][shape.length-i-1] = shape[i][j];
            }
        }

        return temp;
    }



    /* local storage handling */

    if (!localStorage.getItem(highScore)) { // if no high score is stored
        localStorage.setItem(highScore, 0); // create filler high score
    }

    document.getElementById("reset").addEventListener("click", () => { // reset high score button click event
        localStorage.setItem(highScore, 0); // reset stored high score
    });


    /* main init */

    let c = document.getElementById("canvas");
    let ctx = c.getContext("2d");
    document.addEventListener("keydown", keydown); // create input listener 
    setInterval(gameTick, 1000/fps); // run game tick at x times per second


    /* main game loop */

    function gameTick() { // todo: handle game overs and resets
        // check if high score beaten and update if necessary
        if (score > localStorage.getItem(highScore)) {
            localStorage.setItem(highScore, score); // update high score if necessary
        }

        // update score display
        document.getElementById("score").innerHTML = `Score: ${score}<br>High Score: ${localStorage.getItem(highScore)}`;

        if (showHelp) {
            // create gradient
            let gradient = ctx.createLinearGradient(0,0,c.width,0);
            gradient.addColorStop(0, "#0000ff");
            gradient.addColorStop(1, "#0099ff");
            // fill background with this gradient
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, c.width, c.height);

            // see https://strategywiki.org/wiki/Tetris/Controls
            const controls = [
                "Controls:",
                "",
                "Left - move piece left",
                "Right - move piece right",
                "Down - drop slowly",
                "Z or Up - rotate piece clockwise",
                "X - rotate piece anti-clockwise",
                "C or Space - drop instantly",
                "V - store piece",
                "Esc - pause game and show this screen"
            ];

            const fontSize = 17;
            ctx.fillStyle = "white";
            //ctx.font = `${fontSize}px "Lato",-apple-system,BlinkMacSystemFont,"Segoe UI","Helvetica Neue","Helvetica","Arial",sans-serif`; // same as main html
            ctx.font = `${fontSize}px Consolas, monospace`;

            // draw text
            for (let i = 0; i < controls.length; i++) {
                ctx.fillText(controls[i], 5, (fontSize+2)*(i+1));
            }
            ctx.fillText("Press any key to start playing", 5, c.height-10);

        } else {
            // draw background
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, c.width, c.height);

            // piece generation at start of game or after placing a piece
            if (!currentPiece.exists) {
                currentPiece.tiles = pieces[Math.floor(Math.random() * pieces.length)];
                currentPiece.exists = true;
                currentPiece.color = pieceColors[Math.floor(Math.random() * pieceColors.length)];

                // random rotation
                let spins = Math.floor(Math.random() * 4);
                for (let i = 0; i < spins; i++) {
                    currentPiece.tiles = rotateClockwise(currentPiece.tiles);
                }

                currentPiece.pos = [ Math.round((gridSize[0] - currentPiece.tiles[0].length)/2), 0 ];

                storeSpamPrevent = Math.max(0, storeSpamPrevent-1);
                unstoreSpamPrevent = Math.max(0, unstoreSpamPrevent-1);
            }

            // check for completed lines
            let lineComplete = []; // an array representing each row
            for (let i = 0; i < gridSize[1]; i++) {
                lineComplete.push(true);
            }

            for (let i = 0; i < gridSize[1]; i++) {
                for (let j = 0; j < gridSize[0]; j++) {
                    if (!placedTiles[i][j].exists) lineComplete[i] = false;
                }
            }

            let lineCompleteCount = 0;
            for (let i = 0; i < gridSize[1]; i++) {
                if (lineComplete[i]) { // remove completed lines (bugged)
                    console.log("complete line: " + i);
                    console.log(placedTiles);

                    lineCompleteCount++;

                    placedTiles.splice(i, 1); // remove the completed line
                    placedTiles.unshift([]); // generate new empty line at the top (index 0)
                    for (let j = 0; j < gridSize[0]; j++) {
                        placedTiles[0].push({color: "#ffffff", exists: false});
                    }
                }
            }

            switch (lineCompleteCount) { // do scoring for lines completed this frame
                case 1:
                    score += 100;
                    break;
                case 2:
                    score += 300;
                    break;
                case 3:
                    score += 500;
                    break;
                case 4:
                    score += 800;
                    break;
            }

            // increment or reset combo
            if (lineCompleteCount > 0) { 
                combo += 1;
            } else {
                score += 50 * combo; // give score for combo when it ends
                combo = 0;
            }


            // process gravity
            if (frameCount % Math.round(fps/fallSpeed) == 0) currentPiece.pos[1] += 1;

            // clamp pieces so they cant move off screen
            currentPiece.pos[0] = Math.max(0, currentPiece.pos[0]);
            if(gridSize[0] < currentPiece.pos[0]+currentPiece.tiles[0].length) {
                currentPiece.pos[0] = gridSize[0]-currentPiece.tiles[0].length;
            }
            currentPiece.pos[1] = Math.min(gridSize[1]-currentPiece.tiles.length, currentPiece.pos[1]);


            // detect if currentPiece has any tiles directly below (or the bottom of the grid)
            let mustPlacePiece = false;
            for (let i = 0; i < currentPiece.tiles[0].length; i++) {
                for (let j = 0; j < currentPiece.tiles.length; j++) {
                    if (currentPiece.tiles[j][i]) { // for each filled tile of the current piece
                        if (placedTiles[currentPiece.pos[1]+j+1] !== undefined) { // check if the square below it exists
                            if (placedTiles[currentPiece.pos[1]+j+1][currentPiece.pos[0]+i].exists) mustPlacePiece = true; // if its filled, mustPlacePiece
                        } else { // if the square below doesnt exist, the piece is at the bottom of the grid
                            mustPlacePiece = true; // therefore mustPlacePiece
                        }
                    }
                }
            }

            if (mustPlacePiece) {
                if (currentPiece.pos[1] === 0) { // game over
                    showHelp = true;

                    currentPiece.exists = false;
                    storedPiece.exists = false;

                    for (let i = 0; i < placedTiles.length; i++) {
                        for (let j = 0; j < placedTiles[0].length; j++) {
                            placedTiles[i][j].exists = false;
                        }
                    }

                    score = 0;
                } else { // place pieces
                    currentPiece.exists = false;
                    for (let i = 0; i < currentPiece.tiles.length; i++) {
                        for (let j = 0; j < currentPiece.tiles[0].length; j++) {
                            if (currentPiece.tiles[i][j]) {
                                placedTiles[currentPiece.pos[1]+i][currentPiece.pos[0]+j].color = currentPiece.color;
                                placedTiles[currentPiece.pos[1]+i][currentPiece.pos[0]+j].exists = true;
                            }
                        }
                    }
                }
            }

            // draw currentPiece
            drawShape(currentPiece.pos[0], currentPiece.pos[1], currentPiece.color, currentPiece.tiles);

            // draw placedTiles
            drawShape(0, 0, "white", placedTiles);

            // show stored piece if applicapable
            if (storedPiece.exists) {
                // draw the piece
                drawShape(0, 0, storedPiece.color, storedPiece.tiles);
                // draw rectangle to go behind text
                ctx.fillStyle = "black";
                ctx.fillRect(1,1,40,14);
                // draw text
                ctx.fillStyle = "white";
                ctx.font = "10px Consolas, monospace";
                ctx.fillText("stored:", 1, 11);
            }
        }

        frameCount++;
    }


    /* input handling */

    function keydown(event) {
        // left: 37, up: 38, right: 39, down: 40
        // esc: 27, space: 32
        // z: 90, x: 88, c: 67, v: 86

        if (showHelp) {
            showHelp = false; // dismiss the controls screen if it's active
        } else {
            switch (event.keyCode) {
                case 37: // move left
                    currentPiece.pos[0] -= 1;
                    break;
                case 39: // move right
                    currentPiece.pos[0] += 1;
                    break;
                case 40: // slow drop
                    currentPiece.pos[1] += 1;
                    break;
                case 38: case 90: // rotate clockwise
                    currentPiece.tiles = rotateClockwise(currentPiece.tiles);
                    break;
                case 88: // rotate anticlockwise
                    for (let i = 0; i < 3; i++) {
                        currentPiece.tiles = rotateClockwise(currentPiece.tiles);
                    }
                    break;
                case 67: case 32: // drop instantly
                    break;
                case 86: // store piece
                    if (!storedPiece.exists) {
                        if (storeSpamPrevent == 0) {
                            storedPiece.tiles = currentPiece.tiles;
                            storedPiece.color = currentPiece.color;
                            storedPiece.exists = true;
                            currentPiece.exists = false;
                            unstoreSpamPrevent = 2;
                        }
                    } else if (unstoreSpamPrevent == 0) {
                        currentPiece.tiles = storedPiece.tiles;
                        currentPiece.color = storedPiece.color;
                        storedPiece.exists = false;
                        storeSpamPrevent = 1;
                    }
                    break;
                case 27: // pause and show help
                    showHelp = true;
                    break;
            }
        }    
    }
}
