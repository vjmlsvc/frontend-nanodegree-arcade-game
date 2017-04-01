var CELL = 16; // width and height of sprite tiles
var MAPWIDTH = 224; // width of the entire screen
var MARGIN = 5; // amount to shrink collisions
var SPEEDRATIO = 4; // affects movement speed of entities

var Entity = function(order, row, type, length, speed) {
    this.species = type.replace(/[0-9]/g,""); // leaves, koi, bird, hole
    this.type = type;
    this.length = length;
    this.speed = speed;
    this.direction = speed >= 0? "right": "left";
    this.frames = 1; // above 1 for animated entities (koi, bird)
    this.sprite = "images/TODO/char-" + type + "-" + this.direction;

    if (this.species === "koi") {
        this.frames = 4;
        this.sprite +="-0";
    } else if (this.species === "bird") {
        this.frames = 2
        this.sprite +="-0";
    }
    this.sprite += ".png";

    this.x = this.direction === "right"?
        MAPWIDTH + this.length * CELL * order:
        -this.length * CELL - this.length * CELL * order;
    this.y = row * CELL;
}

Entity.prototype.update = function(dt) {
    this.x += this.speed * dt;
    // updates entity's x position by its speed modified by delta time
    // which ensures a smooth animation.
    this.leftEnd = this.x;
    this.rightEnd = this.x + this.length * CELL;

    if (this.frames > 1) {
        // if the entity has more than one frame plays them relative to
        // the entity's speed accross the screen. animRate can be set
        // to any positive integer and defines how many pixels entities
        // travel before a new frame is played.
        var animRate = 6;
        var animFrame = Math.abs(Math.floor(this.x / animRate) % this.frames); 
        // sets frame to play based on position of entity on screen.
        if (this.sprite.charAt(-5) !== animFrame) {
            this.sprite = this.sprite.slice(0, -5) + animFrame +
                this.sprite.slice(-4);
            // updates filename to new frame of animation.
        }
    }

    if (this.x < -this.length * CELL) this.x += MAPWIDTH + this.length * CELL;
    // if entity is off screen on left side moves to off screen on right
    if (this.x > MAPWIDTH) this.x -= MAPWIDTH + this.length * CELL;
    // if entity is off screen on right side moves to off screen on left
};

Entity.prototype.render = function() {
    // draws current entity
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

var player = {
    x: 112, // initial position
    y: 32, // initial position
    sprite: "images/char-player-down.png", // starting sprite
    lastMovement: Date.now(), // used for timing random turning
    shift: 0, // used for simulating riding on a platform when needed
    facing: 4, // initial facing direction
    TURNDELAY: 2500,
    SPRITES: [
        "images/char-player-up.png",
        "images/char-player-upright.png",
        "images/char-player-right.png",
        "images/char-player-downright.png",
        "images/char-player-down.png",
        "images/char-player-downleft.png",
        "images/char-player-left.png",
        "images/char-player-upleft.png"
    ],
    update: function(dt) {
        if (Date.now() - this.lastMovement > this.TURNDELAY) {
        // checks that TURNDELAY (in miliseconds) has elapsed since the
        // last time the player character has randomly turned. changes
        // facing by -1, 0, or 1, ensuring that it remains from 0 to 7.
            this.facing += (Math.floor(Math.random() * 3) - 1);
            // adds between -1 and 1 to this.facing
            if (this.facing < 0) this.facing += 8;
            if (this.facing > 7) this.facing -= 8;
            // wraps around if this.facing is under 0 or over 8
            this.sprite = this.SPRITES[this.facing];
            // assigns new sprite based on new facing direction
            this.lastMovement = Date.now();
            // resets time since last change
        }
        switch (this.y) {
        // checks for specific row to continuously shift the character
        // when standing in those rows. gives the illusion on standing
        // on leaves or koi. the row is the number after "CELL *"
        // and the movement speed is the number after "this.shift =".
            case CELL * 9:
                this.shift = SPEEDRATIO * 6;
                break;
            case CELL * 10:
                this.shift = SPEEDRATIO * -4;
                break;
            case CELL * 11:
                this.shift = SPEEDRATIO * -7;
                break;
            case CELL * 12:
                this.shift = SPEEDRATIO * 5;
                break;
            case CELL * 13:
                this.shift = SPEEDRATIO * -5;
                break;
            default:
                this.shift = 0;
                break;

        }
        this.x += this.shift * dt;
        this.checkCollisions();
    },
    checkCollisions: function() {
        this.leftEnd = this.x;
        this.rightEnd = this.x + CELL;
        if (this.x < -1 || this.x > MAPWIDTH - CELL + 1 ) endGame(0);
        var isDead = false;
        if (this.y >= 3 * CELL && this.y <= 7 * CELL) {
            for (var i = 0; i < allEntities.length; i++) {
                if (allEntities[i].y === this.y) {
                    if (this.leftEnd < allEntities[i].rightEnd - MARGIN &&
                        this.rightEnd > allEntities[i].leftEnd + MARGIN) {
                        isDead = true;
                    }
                }
            }
        } else if (this.y >= 9 * CELL && this.y <= 14 * CELL) {
            isDead = true;
            for (var i = 0; i < allEntities.length; i++) {
                if (allEntities[i].y === this.y) {
                    if (this.leftEnd >= allEntities[i].leftEnd - MARGIN &&
                        this.rightEnd <= allEntities[i].rightEnd + MARGIN) {
                        if (this.y === 14 * CELL) endGame(i);
                        isDead = false;
                    }
                }
            }
        }
        isDead = false; //TODO
        if (isDead) endGame(0);
    },
    render: function() {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    },
    newDirection: function(direction) {
        this.sprite = this.SPRITES[direction];
        this.facing = direction;
    },
    handleInput: function(direction) {
        switch (direction) {
            case "up":
                if (this.y > 32 ) {
                    this.y -= CELL;
                    this.newDirection(0);
                    this.lastMovement = Date.now();
                }
                break;
            case "right":
                if (this.x < 193) {
                    this.x += CELL;
                    this.newDirection(2);
                    this.lastMovement = Date.now();
                }
                break;
            case "down":
                if (this.y < 224 ) {
                    this.y += CELL;
                    this.newDirection(4);
                    this.lastMovement = Date.now();
                }
                break;
            case "left":
                if (this.x > 15) {
                    this.x -= CELL;
                    this.newDirection(6);
                    this.lastMovement = Date.now();
                }
                break;
            default:
                break;
        }
    }
}

// Now instantiate your objects.
// Place all entity objects in an array called allEntities
// Place the player object in a variable called player

var allEntities = [];
var entities = [
    [4, [3, "bird1", 1, -4 * SPEEDRATIO]],
    [4, [4, "bird2", 1, 4 * SPEEDRATIO]],
    [4, [5, "bird3", 1, -4 * SPEEDRATIO]],
    [4, [6, "bird4", 1, 7 * SPEEDRATIO]],
    [3, [7, "bird5", 2, -5 * SPEEDRATIO]],

    [3, [9, "koi3", 2, 6 * SPEEDRATIO]],
    [3, [10, "leaves3", 3, -4 * SPEEDRATIO]],
    [2, [11, "leaves6", 6, -7 * SPEEDRATIO]],
    [4, [12, "koi1", 2, 5 * SPEEDRATIO]],
    [3, [13, "leaves4", 4, -5 * SPEEDRATIO]],
    [5, [14, "bird2", 1, 0]]
];
/* OLDPOOP
var -enemies = [
    [3, "", 2, -4 * speedModifier, "bird1"],
    [3, "", 1, -4 * speedModifier, "bird1"],
    [3, "", 0, -4 * speedModifier, "bird1"],
    [3, "", -1, -4 * speedModifier, "bird1"],

    [4, "", 2, 4 * speedModifier, "bird2"],
    [4, "", 1, 4 * speedModifier, "bird2"],
    [4, "", 0, 4 * speedModifier, "bird2"],
    [4, "", -1, 4 * speedModifier, "bird2"],

    [5, "", 2, -4 * speedModifier, "bird3"],
    [5, "", 1, -4 * speedModifier, "bird3"],
    [5, "", 0, -4 * speedModifier, "bird3"],
    [5, "", -1, -4 * speedModifier, "bird3"],

    [6, "", 2, 7 * speedModifier, "bird4"],
    [6, "", 1, 7 * speedModifier, "bird4"],
    [6, "", 0, 7 * speedModifier, "bird4"],
    [6, "", -1, 7 * speedModifier, "bird4"],

    [7, "short", 1, -5 * speedModifier, "bird5"],
    [7, "short", 0, -5 * speedModifier, "bird5"],
    [7, "short", -1, -5 * speedModifier, "bird5"],

// ##### BREAK #####

    [9, "medium", 1, 6 * speedModifier, "koi"],
    [9, "medium", 0, 6 * speedModifier, "koi"],
    [9, "medium", -1, 6 * speedModifier, "koi"],

    [10, "medium", 1, -4 * speedModifier, "leaves"],
    [10, "medium", 0, -4 * speedModifier, "leaves"],
    [10, "medium", -1, -4 * speedModifier, "leaves"],

    [11, "longer", 1, -7 * speedModifier, "leaves"],
    [11, "longer", 0, -7 * speedModifier, "leaves"],

    [12, "short", 2, 5 * speedModifier, "koi"],
    [12, "short", 1, 5 * speedModifier, "koi"],
    [12, "short", 0, 5 * speedModifier, "koi"],
    [12, "short", -1, 5 * speedModifier, "koi"],

    [13, "long", 1, -5 * speedModifier, "leaves"],
    [13, "long", 0, -5 * speedModifier, "leaves"],
    [13, "long", -1, -5 * speedModifier, "leaves"]
];
function spawnEnemies() {
    for (var i = 0; i < enemies.length; i++) {
        allEnemies.push(new Enemy(...enemies[i]));
    }
};*/

function endGame(result) {
// resets all variables affecting the player's position.
    if (allEntities[result].sprite === "images/TODO/char-bird2-right-1.png") {
        allEntities[result].sprite = "images/TODO/char-bird3-right-1.png";
    }

    player.x = 112;
    player.y = 32;
    player.sprite = "images/char-player-down.png";
    player.lastMovement = Date.now();
    player.shift = 0;
    player.facing = 4;
}

(function spawnEntities() {
// instantiates entities described in the entities array into
// allEntities. adds a random gap between members of the same row by
// utilizing the gap variable. the minimal gap is 16 pixels from the
// left edge of the.
    var gap = 0;
    var i;
    for (i = 0; i < entities.length - 1; i++) {
        for (var j = 0; j < entities[i][0]; j++) {
            // sets gap to random number (1-3) to be used for spacing
            gap += Math.floor(Math.random() * 3) + 1;
            allEntities.push(new Entity(j + gap, ...entities[i][1]));
        }
    } for (var j = 0; j < entities[i][0]; j++) {
        allEntities.push(new Entity(3*j + 1.5, ...entities[i][1]));
    }
}());

// This listens for key presses and sends the keys to your
// player.handleInput() method. You don't need to modify this.
document.addEventListener("keydown", function(e) {
    var allowedKeys = {
        37: "left",
        38: "up",
        39: "right",
        40: "down"
    };

    player.handleInput(allowedKeys[e.keyCode]);
});