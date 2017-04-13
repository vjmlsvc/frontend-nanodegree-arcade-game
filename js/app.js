var CELL = 16;          // size of unit (ex. width/height of sprite)
var COLS = 14;          // horizontal CELLs on screen
var ROWS = 16;          // vertical CELLs on screen
var PATH = "images/";   // file path for sprites
var SAFE = 8;           // safe area in the middle of the map
var GOAL = 14;          // final row where players are trying to get

var MARGIN = 0.25;  // collision tolerance; higher is more forgiving
var LIVES = 5;      // number of attempts a player gets per playthrough
var TIME = 40000;   // duration of round in miliseconds
var RATE = 0.25;    // factor for all entity movement rates

var DIGITS = 5;     // number of digits to use for score display
var FPS = 6;        // frames per second for animated entities

var player = {
    TURNINTERVAL: 2500, // time in ms before character turns when idle
    HOPTIME: 40,        // player hop duration in miliseconds
    HOPFRAMES: 4,       // player hop frame count
    isHopping: false,
    SPRITES: [
        PATH + "player-up.png",
        PATH + "player-upright.png",
        PATH + "player-right.png",
        PATH + "player-downright.png",
        PATH + "player-down.png",
        PATH + "player-downleft.png",
        PATH + "player-left.png",
        PATH + "player-upleft.png"
    ]
};


// handles hopping behaviour, idling behaviour, and drifting on rows
// with moving platforms. also calls checkCollisions to check whether
// the player is still alive
player.update = function(dt) {
    // sets HOPINTERVAL used for hopping animation (this is the time
    // for one frame of the interpolated movement between two places)
    this.HOPINTERVAL = this.HOPTIME / this.HOPFRAMES;

    // moves the player's character between starting position and
    // deltaX, deltaY over HOPFRAMES steps
    if (this.isHopping) {
        if (this.moveStart + this.HOPINTERVAL < Date.now()) {
            this.x += this.deltaX / this.HOPFRAMES;
            this.y += this.deltaY / this.HOPFRAMES;
            this.moveStart += this.HOPINTERVAL;
        }
        // once at destination, ends the isHopping state
        if (this.moveStart >= this.moveEnd) this.isHopping = false;
    } else {
        // if Y position is lowest this run, increment steps so as to
        // award appropriate points
        if (this.y > this.maxY) {
            this.maxY = this.y;
            interface.steps++;
        }
    }

    // checks that TURNINTERVAL (in miliseconds) has elapsed since last
    // time player character has turned. changes facing by -1, 0, or 1,
    // ensuring that it remains from 0 to 7.
    if (this.idle + this.TURNINTERVAL < Date.now()) {
        // adds between -1 and 1 to facing
        this.facing += (Math.floor(Math.random() * 3) - 1);
        // wraps around if facing is under 0 or over 7
        if (this.facing < 0) this.facing += 8;
        if (this.facing > 7) this.facing -= 8;
        // assigns new sprite based on new facing direction
        this.sprite = this.SPRITES[this.facing];
        // resets time since last change
        this.idle = Date.now();
    }
    // if player is on drifting row (between median and end) adjusts
    // position accordingly
    if (this.y > SAFE && this.y < GOAL) {
        this.x += rowSpeeds[this.y] * RATE * dt || 0;
    }
    this.checkCollisions();
};


player.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x * CELL, this.y * CELL);
};


// checks all collisions provided the player isn't currently hopping.
// calls endGame with reason if player.isDead.
player.checkCollisions = function() {
    var reason;
    var playerLeftEdge = this.x + MARGIN;
    var playerRightEdge = this.x + 1 - MARGIN;
    var entityLeftEdge;
    var entityRightEdge;
    var isDead = false;

    if (this.isHopping === false) {
        // collision checking for birds: player must not touch them
        if (this.y <= SAFE) {
            for (var i = 0; i < allEntities.length; i++) {
                if (allEntities[i].y === this.y) {
                    entityLeftEdge = allEntities[i].x;
                    entityRightEdge = allEntities[i].x + allEntities[i].width;
                    if (playerLeftEdge < entityRightEdge &&
                        playerRightEdge > entityLeftEdge) {
                        isDead = true;
                    }
                }
            }
        // collision handling for koi/leaves: player must be on them
        } else {
            isDead = true;
            for (var j = 0; j < allEntities.length; j++) {
                if (allEntities[j].y === this.y) {
                    entityLeftEdge = allEntities[j].x;
                    entityRightEdge = allEntities[j].x + allEntities[j].width;
                    if (playerLeftEdge > entityLeftEdge &&
                        playerRightEdge < entityRightEdge) {
                        isDead = false;
                        // collision checking for last row: player may
                        // only land on open holes
                        if (this.y === GOAL) {
                            if (allEntities[j].sprite == PATH + "hole.png") {
                                allEntities[j].sprite = PATH + "filled.png";
                            } else isDead = true;
                        }
                    }
                }
            }
        }
    }

    // checking for going off edge of screen then setting reason and
    // decrementing lives
    if (playerLeftEdge < 0 || playerRightEdge > COLS) {
        isDead = true;
        interface.lives--;
        reason = "you went off screen";
    }
    // setting reason for round end on last row and decrementing lives
    // if appropriate
    if (this.y === GOAL) {
        if (isDead) {
            interface.lives--;
            reason = "you missed the mark";
        } else {
            isDead = true;
            // increasing number of finishes for winning round
            interface.finishes++;
            // giving appropriate time bonus for winning round
            interface.timeBonus += Math.floor(interface.time / 1000);
            reason = "you won the round";
        }
    } else if (isDead) {
        // all other deaths are from missing platform
        interface.lives--;
        // sets reason based on row
        reason = this.y <= SAFE? "you were eaten": "you drowned";
    }

    // if player.isDead trigger endGame with reason
    if (isDead) endGame(reason);
};


// handles moving of player changing facing and sprite, resetting idle
// and setting isHopping and destination
player.move = function(direction) {
    this.facing = direction;
    this.sprite = this.SPRITES[this.facing];
    this.idle = Date.now();

    if (direction === 2 || direction === 6) {   // horizontal movement
        this.deltaX = direction === 2? 1: -1;
        this.deltaY = 0;
    } else {                                    // vertical movement
        this.deltaY = direction === 4? 1: -1;
        this.deltaX = 0;
    }
    this.isHopping = true;
    this.moveStart = Date.now();
    this.moveEnd = this.moveStart + this.HOPTIME;
};


// handles unless player.isHopping. for legal move calls player.move
// with new direction
player.handleInput = function(direction) {
    var isAllowed = false;
    if (!this.isHopping) {
        switch (direction) {
            case 0:     // up
                if (this.y > 2) isAllowed = true;
                break;
            case 2:     // right
                if (this.x < 12 + MARGIN) isAllowed = true;
                break;
            case 4:     // down
                if (this.y < GOAL) isAllowed = true;
                break;
            case 6:     // left
                if (this.x > 1 - MARGIN) isAllowed = true;
                break;
            default:
                break;
        }
        if (isAllowed) this.move(direction);
    }
};


// resets player and interface.time to start of round state
player.setup = function() {
    interface.time = TIME;
    this.x = 7;
    this.y = 2;
    this.maxY = this.y;
    this.facing = 4;
    this.sprite = this.SPRITES[this.facing];
    this.idle = Date.now();
};


// constructor for creating entities and random animation seed
function Entity(row, col, type, frames, width) {
    this.y = row;
    this.x = col;
    this.type = type;
    this.frames = frames;
    this.speed = rowSpeeds[row] * RATE;
    this.width = width;
    this.seed = Math.floor(Math.random() * 20);
    this.direction = this.speed > 0? "-right": "-left"; 
    // if entity is animated (bird or koi) sets its filepath with
    // direction and starting frame
    this.sprite = this.frames === 0? PATH + this.type + ".png":
        PATH + this.type + this.direction + "-0.png";
}


// moves entity across screen, then wraps around once off screen
Entity.prototype.update = function(dt) {
    this.x += this.speed * dt;
    if (this.x > COLS) {
        this.x -= COLS + this.width;
    }
    if (this.x < -this.width) {
        this.x += COLS + this.width;
    }

    // for animated entity cycles through frames at FPS offset by seed
    if (this.frames > 0) {
        var frame = "-" +
            Math.floor(Date.now() * FPS / 1000 + this.seed) % this.frames;
        this.sprite = PATH + this.type + this.direction + frame + ".png";
    }
};


Entity.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x * CELL, this.y * CELL);
};


var allEntities;
var rowSpeeds = [];
var entities = [
    {
        count: 4,
        row: 3,
        type: "bird1",
        frames: 4,
        width: 1,
        speed: -4
    },
    {
        count: 4,
        row: 4,
        type: "bird2",
        frames: 4,
        width: 1,
        speed: 4
    },
    {
        count: 4,
        row: 5,
        type: "bird3",
        frames: 4,
        width: 1,
        speed: -4
    },
    {
        count: 4,
        row: 6,
        type: "bird4",
        frames: 4,
        width: 1,
        speed: 7
    },
    {
        count: 3,
        row: 7,
        type: "bird5",
        frames: 4,
        width: 2,
        speed: -5
    },
    {
        count: 3,
        row: 9,
        type: "koi2",
        frames: 4,
        width: 2,
        speed: 6
    },
    {
        count: 3,
        row: 10,
        type: "leaves3",
        frames: 0,
        width: 3,
        speed: -4
    },
    {
        count: 2,
        row: 11,
        type: "leaves6",
        frames: 0,
        width: 6,
        speed: -7
    },
    {
        count: 4,
        row: 12,
        type: "koi1",
        frames: 4,
        width: 2,
        speed: 5
    },
    {
        count: 3,
        row: 13,
        type: "leaves4",
        frames: 0,
        width: 4,
        speed: -5
    },
    {
        count: 5,
        row: 14,
        type: "hole",
        frames: 0,
        width: 1,
        speed: 0

    }
];


entities.setup = function() {
    allEntities = [];
    // spawns entities found in allEntities in appropriate row. adds
    // random gap between subsequent sprites based on amount of
    // available space on given row
    for (var i = 0; i < entities.length; i++) {
        var gaps = [];
        var xPos = [];
        var current;

        // calculates total number of gaps that can be added to each
        // row between sprites by subtracting total width of all
        // sprites from full width + 1 width. ensures sprites are
        // randomly spaced between playthroughs
        var padding = (COLS - entities[i].width * (entities[i].count - 1));

        // initializes gaps array using 0s
        for (var h = 0; h < entities[i].count; h++) {
            gaps[h] = 0;
        }

        // assigns total value in padding randomly to spots in gaps
        for (var j = 0; j < padding; padding--) {
            current = Math.floor(Math.random() * entities[i].count);
            gaps[current]++;
        }

        // adds values in gaps to corresponding entities' position on x
        for (var g = 0; g < gaps.length; g++) {
            // special case for last row
            if (entities[i].row === GOAL) {
                xPos[g] = (COLS + 1) / entities[i].count * g + 0.5;
            } else {
                xPos[g] = gaps[g];
                // adds previous position to all instances except first
                if (g > 0) xPos[g] += xPos[g - 1] + entities[i].width;
            }
        }

        // assigns speed stat to matching row in rowSpeed array
        rowSpeeds[entities[i].row] = entities[i].speed;

        // spawns entities
        for (var k = 0; k < entities[i].count; k++) {
            allEntities.push(new Entity(
                entities[i].row,
                xPos[k],
                entities[i].type,
                entities[i].frames,
                entities[i].width
                )
            );
        }
    }
};


// contains metadata relating to scoring, lives, and UI display
var interface = {
    highScore: "0",
    score: "0",
    timeBonus: 0,
    steps: 0,
    finishes: 0,
    perSec: 10,
    perStep: 10,
    perFinish: 50,
    perRound: 1000,
    time: TIME,
    lives: LIVES
};


// updates time throughout round, and ends game if it runs out. also
// updates high score when score is higher. uses 0-padding to give a
// retro look to the score
interface.update = function(dt) {

    // reduces time remaining in round, ends game if time's up
    this.time -= dt * 1000;
    if (this.time < 0) {
        this.lives--;
        endGame("ran out of time");
    }

    // updates highscore
    if (this.score > this.highScore) this.highScore = this.score;
    var padding = "0".repeat(DIGITS - 1);
    
    // calculates score and displays with padding
    var score = this.timeBonus * this.perSec +
                this.steps * this.perStep +
                this.finishes * this.perFinish +
                Math.floor(this.finishes / 5) * this.perRound;
    score = (padding + score);
    this.score = score.substr(score.length - DIGITS);
};


// places interface pieces onto screen. unicode is used for lives icon,
// rectangle for timer. all positioning is relative to the canvas size,
// so it scales properly
interface.render = function() {
    var SCRWDTH = COLS * CELL;
    var SCRHGHT = ROWS * CELL;
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    ctx.font = Math.floor(0.04 * SCRHGHT) + "pt Consolas";
    
    ctx.fillText("1-UP", 0.05 * SCRWDTH, 0.05 * SCRHGHT);
    ctx.fillText(this.score, 0.03 * SCRWDTH, 0.10 * SCRHGHT);
    ctx.fillText("HIGH-SCORE", 0.333 * SCRWDTH, 0.05 * SCRHGHT);
    ctx.fillText(this.highScore, 0.414 * SCRWDTH, 0.10 * SCRHGHT);

    ctx.fillStyle = "red";
    ctx.fillText("❤".repeat(interface.lives), 0.015 * SCRWDTH,
        0.987 * SCRHGHT);
    ctx.fillRect(0.987 * SCRWDTH, 0.989 * SCRHGHT,
        -(SCRWDTH/2 * interface.time/TIME), -0.04 * SCRHGHT);
    ctx.strokeRect(0.9848 * SCRWDTH, 0.986 * SCRHGHT,
        -SCRWDTH/2, -0.035 * SCRHGHT);
};


// resets all metadata except highscore to starting state
interface.setup = function() {
    this.score = 0;
    this.timeBonus = 0;
    this.steps = 0;
    this.finishes = 0;
    this.lives = LIVES;
};


// handles round ending displaying reason in console
// TODO make this integrated into actual game
function endGame(reason) {
    console.log(reason);

    // if out of lives resets game completely
    if (interface.lives < 0) {
        interface.setup();
        entities.setup();
    }

    // if all 5 finishes reached generates new level
    if (interface.finishes > 0 && interface.finishes % 5 === 0) {
        entities.setup();
    }

    // resets player state
    player.setup();
}


document.addEventListener("keydown", function(e) {
    var allowedKeys = {
        38: 0,  // up
        39: 2,  // right
        40: 4,  // down
        37: 6   // left
    };
    player.handleInput(allowedKeys[e.keyCode]);
});

player.setup();
interface.setup();
entities.setup();
