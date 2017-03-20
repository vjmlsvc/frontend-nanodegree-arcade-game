// Enemies our player must avoid
var Enemy = function(row, direction, speed, type) {
    // Variables applied to each of our instances go here, we've
    // provided one for you to get started

    // The image/sprite for our enemies, this uses a helper we've
    // provided to easily load images
    this.sprite = "images/char-" + type + "-" + direction + ".png";
    this.speed = direction === "right"? speed: 0 - speed;
    this.x = direction === "right"? -16: 224;
    this.y = row * 16;
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter which will
    // ensure the game runs at the same speed for all computers.
    this.x += this.speed * dt;
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

var player = {
    x: 112,
    y: 224,
    sprite: "images/char-player-up.png",
    step: 16,
    update: function() {
        
    },
    render: function() {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    },
    newDirection: function(direction) {
        this.sprite = "images/char-player-" + direction + ".png";
    },
    handleInput: function(direction) {
        switch (direction) {
            case "up":
                this.y -= this.step;
                this.newDirection("up");
                break;
            case "down":
                this.y += this.step;
                this.newDirection("down");
                break;
            case "left":
                this.x -= this.step;
                this.newDirection("left");
                break;
            case "right":
                this.x += this.step;
                this.newDirection("right");
                break;
            default:
                break;
        }
    }
}


// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var allEnemies = [];
allEnemies[0] = new Enemy(13, "left", 60, "bird1");
allEnemies[1] = new Enemy(12, "right", 60, "bird2");
allEnemies[2] = new Enemy(11, "left", 60, "bird3");
allEnemies[3] = new Enemy(10, "right", 90, "bird4");
allEnemies[4] = new Enemy(9, "left", 75, "bird5");

// This listens for key presses and sends the keys to your
// player.handleInput() method. You don't need to modify this.
document.addEventListener('keydown', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});