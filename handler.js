let players = {};
let balls = {};
let messages = [];

let movementSpeedX = 36;
let movementSpeedY = 48;
let boundsWidth = 648;
let boundsHeight = 384;

module.exports.checkPings = function() {
    for (let player in players) {
        let time = new Date() - players[player].lastPing;
        if (time > 5000) {
            delete players[player];
        }
    }
}

module.exports.ping = function(name) {
    if (players[name] != undefined) {
        players[name].lastPing = new Date();
        return "OK";
    } else {
        return "Player does not exist";
    }
}

module.exports.joinGame = function(name, gender) {
    if (players[name] != undefined) {
        return "User already exists. Cannot join the game.";
    }

    if (gender != "boy" && gender != "girl") {
        return "Please select either a boy or a girl.";
    }

    let movementX = Math.floor(boundsWidth / movementSpeedX);
    let movementY = Math.floor(boundsHeight / movementSpeedY);
    let randomX = (Math.floor(Math.random() * movementX)) * movementSpeedX;
    let randomY = (Math.floor(Math.random() * movementY)) * movementSpeedY;

    players[name] = {
        name: name,
        gender: gender,
        position: {
            x: randomX,
            y: randomY
        },
        direction: "down",
        lastPing: new Date(),
        points: 0,
        chatCooldown: false
    };

    return "OK";
};

module.exports.move = function(name, direction) {
    let player = players[name];
  
    if (player != undefined) {
      if (direction != undefined) {
        player.direction = direction;
        if (direction == "left") {
            if (players[name].position.x - movementSpeedX >= 0) {
                players[name].position.x -= movementSpeedX;
                return "OK";
            }
        } else if (direction == "right") {
            if (players[name].position.x + 7 + movementSpeedX <= boundsWidth) {
                players[name].position.x += movementSpeedX;
                return "OK";
            }
        } else if (direction == "up") {
            if (players[name].position.y - movementSpeedY >= 0) {
                players[name].position.y -= movementSpeedY;
                return "OK";
            }
        } else if (direction == "down") {
            if (players[name].position.y + 46 + movementSpeedY <= boundsHeight) {
                players[name].position.y += movementSpeedY;
                return "OK";
            }
        }
      } else {
            return "Invalid direction.";
        }
        return "Cannot move: hitting border";
    } else {
        return "User does not exist";
    }
};

module.exports.throwBall = function(name) {
    let player = players[name];
  
    if (player != undefined) {
        if (balls[name] == undefined) {
            let interval;
            let intervalSpeed = 15;
            let clearBall = (check) => {
                balls[name] = {};
                setTimeout(() => delete balls[name], 300);
                clearInterval(interval);
            };

            if (player.direction == "up") {
                balls[name] = {
                    x: player.position.x,
                    y: player.position.y - movementSpeedY
                };
                interval = setInterval(function() {
                    let check = collidingWithPlayer(balls[name].x, balls[name].y, "y");
                    if (balls[name].y - movementSpeedY >= 0 && !check) {
                        balls[name].y -= movementSpeedY;
                    } else if (check) {
                        player.points++;
                        clearBall();
                    } else {
                        clearBall();
                    }
                }, intervalSpeed);
            } else if (player.direction == "down") {
                balls[name] = {
                    x: player.position.x,
                    y: player.position.y + movementSpeedY
                };
                interval = setInterval(function() {
                    let check = collidingWithPlayer(balls[name].x, balls[name].y, "y");
                    if (balls[name].y + movementSpeedY <= boundsHeight && !check) {
                        balls[name].y += movementSpeedY;
                    } else if (check) {
                        player.points++;
                        clearBall();
                    } else {
                        clearBall();
                    }
                }, intervalSpeed);
            } else if (player.direction == "left") {
                balls[name] = {
                    x: player.position.x - movementSpeedX,
                    y: player.position.y
                };
                interval = setInterval(function() {
                    let check = collidingWithPlayer(balls[name].x, balls[name].y, "x");
                    if (balls[name].x - movementSpeedX >= 0 && !check) {
                        balls[name].x -= movementSpeedX;
                    } else if (check) {
                        player.points++;
                        clearBall();
                    } else {
                        clearBall();
                    }
                }, intervalSpeed);
            } else if (player.direction == "right") {
                balls[name] = {
                    x: player.position.x + movementSpeedX,
                    y: player.position.y
                };
                interval = setInterval(function() {
                    let check = collidingWithPlayer(balls[name].x, balls[name].y, "x");
                    if (balls[name].x + movementSpeedX <= boundsWidth && !check) {
                        balls[name].x += movementSpeedX;
                    } else if (check) {
                        player.points++;
                        clearBall();
                    } else {
                        clearBall();
                    }
                }, intervalSpeed);
            }

            return "OK";
        } else {
            return "Ball already being thrown";
        }
    } else {
        return "User does not exist";
    }
}

module.exports.sendMessage = function(name, message) {
    let player = players[name];

    if (player != undefined) {
        if (message != "" && message != undefined) {
          if (!player.chatCooldown) {
            messages.push({
                player: name,
                message: message
            });
            player.chatCooldown = true;
            setTimeout(() => player.chatCooldown = false, 1000);
            return "OK";
          } else {
             return "Chat cooldown";
          }
        } else {
            return "Invalid message";
        }
    } else {
        return "User does not exist.";
    }
}

module.exports.ioHandler = function(socket) {
    setInterval(() => socket.emit("updatePlayers", {
        players: players,
        balls: balls
    }), 50);
    setInterval(() => socket.emit("updateMessages", messages), 250);
}

function collidingWithPlayer(ballX, ballY, mode) {
    for (let player in players) {
        let playerX = players[player].position.x;
        let playerY = players[player].position.y;      
        if ((ballX == playerX && mode == "x") || (ballY == playerY && mode == "y")) {
           return player;
        }
    }
    return false;
}