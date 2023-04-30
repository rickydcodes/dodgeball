const io = window.io;
let socket = io.connect();

const boyInput = document.querySelector("#boyInput");
const girlInput = document.querySelector("#girlInput");
const nameInput = document.querySelector("#nameInput");
const joinButton = document.querySelector("#joinButton");

const playerList = document.querySelector("#playerList");
const joinPanel = document.querySelector("#joinPanel");
const playingArea = document.querySelector("#playingArea");

const chatPanel = document.querySelector("#chatPanel");
const chatHolder = document.querySelector("#chatHolder");
const messageInput = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendMessage");

let name;
let interval;
let cooldown = false;

nameInput.addEventListener("keydown", (e) => {
  if (e.key == "Enter") {
    joinGame();
  }
});
joinButton.addEventListener("click", joinGame);
messageInput.addEventListener("keydown", (e) => {
  if (e.key == "Enter") {
    sendMessage();
  }
})
sendButton.addEventListener("click", sendMessage);

function sendMessage() {
  let message = messageInput.value;
  if (message != "" && name != undefined) {
    let request = new XMLHttpRequest();
    request.open("POST", "/sendMessage");
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send(`name=${name}&message=${message}`);
    messageInput.value = "";
  }
}

function joinGame() {
  let gender = boyInput.checked ? "boy" : "girl";
  let name = nameInput.value;
  if (gender == "boy" || gender == "girl" && name.length) {
    let request = new XMLHttpRequest();
    request.open("POST", "/joinGame");
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.addEventListener("load", joinResponse);
    request.send(`name=${name}&gender=${gender}`);
  }
}

function joinResponse() {
  if (this.response == "OK") {
    document.addEventListener("keydown", handleKeydown);

    joinPanel.innerHTML = "Use the arrow keys to move, and the space bar to throw a ball.";
    joinPanel.classList.add("instructions");
    chatPanel.style.display = "inline-block";

    name = nameInput.value;

    interval = setInterval(pingServer, 1000);
  } else {
    alert(this.response);
  }
}

function pingServer() {
  let request = new XMLHttpRequest();
  request.open("POST", "/ping");
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  request.send(`name=${name}`);
}

function handleKeydown(e) {
  if (e.keyCode == 32 && !cooldown) {
    throwBall();
  }

  if (e.key == "ArrowUp") {
    move("up");
  }
  if (e.key == "ArrowDown") {
    move("down");
  }
  if (e.key == "ArrowLeft") {
    move("left");
  }
  if (e.key == "ArrowRight") {
    move("right");
  }
}

function throwBall() {
  cooldown = true;
  let request = new XMLHttpRequest();
  request.open("POST", "/throwBall");
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  request.send(`name=${name}`);
  setTimeout(() => cooldown = false, 50);
}

function move(dir) {
  let playerDiv = document.querySelector(`#${name}`);
  if (playerDiv != undefined) {
    if (dir == "left" && playerDiv.offsetLeft - 36 < 0) {
      return;
    } else if (dir == "right" && playerDiv.offsetLeft + 47 > playingArea.offsetWidth) {
      return;
    } else if (dir == "up" && playerDiv.offsetTop - 48 < 0) {
      return;
    } else if (dir == "down" && playerDiv.offsetTop + 55 > playingArea.offsetHeight) {
      return;
    }
  }
  let request = new XMLHttpRequest();
  request.open("POST", `/move`);
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  request.send(`name=${name}&direction=${dir}`);
}

function updatePlayingArea(players) {
  playingArea.innerHTML = "";
  for (let player in players) {
    createPlayer(players[player]);
  }
}

function updatePlayerlist(players) {
  playerList.innerHTML = "";
  for (let player in players) {
    createPlayerRow(players[player]);
  }
}

function createPlayerRow(player) {
  let playerRow = document.createElement("div");
  playerRow.classList.add("playerRow");
  if (player.name == name) {
    playerRow.classList.add("me");
  }
  playerList.appendChild(playerRow);

  let playerRowName = document.createElement("div");
  playerRowName.classList.add("playerRowName");
  playerRowName.innerHTML = player.name;
  playerRow.appendChild(playerRowName);

  let playerRowPoints = document.createElement("div");
  playerRowPoints.classList.add("playerRowPoints");
  playerRowPoints.innerHTML = player.points;
  playerRow.appendChild(playerRowPoints);
}

function createPlayer(player) {
  let playerDiv = document.createElement("div");
  playerDiv.classList.add("player", player.gender, player.direction);
  playerDiv.style.left = `${player.position.x}px`;
  playerDiv.style.top = `${player.position.y}px`;
  playerDiv.id = player.name;

  let playerNameDiv = document.createElement("div");
  playerNameDiv.classList.add("playerName");
  playerNameDiv.innerHTML = player.name;

  if (player.name == name) {
    playerNameDiv.classList.add("me");
  }

  let offset = ((playerDiv.offsetWidth - playerNameDiv.offsetWidth) / 2);
  playerNameDiv.style.left = `${player.position.x + 5 + offset}px`;
  playerNameDiv.style.top = `${player.position.y + 46}px`;

  playingArea.appendChild(playerNameDiv);
  playingArea.appendChild(playerDiv);
}

function showBalls(balls) {
  for (let ball in balls) {
    showBall(balls[ball], ball);
  }
}

function showBall(ball, ballName) {
  if (ball.x != undefined) {
    let ballDiv = document.createElement("div");
    ballDiv.classList.add("ball");
    ballDiv.id = ballName;
    ballDiv.style.left = `${ball.x}px`;
    ballDiv.style.top = `${ball.y}px`;
    playingArea.appendChild(ballDiv);
  }
}

function showMessages(messages) {
  chatHolder.innerHTML = "";
  for (let msg of messages) {
    let chatMessageDiv = document.createElement("div");
    chatMessageDiv.classList.add("chatMessageDiv");
    if (msg.player == name) {
      chatMessageDiv.innerHTML = `<span class="me">${msg.player}</span>: ${msg.message}`;
    } else {
      chatMessageDiv.innerHTML = `<span>${msg.player}</span>: ${msg.message}`;
    }
    chatHolder.appendChild(chatMessageDiv);
  }
}

socket.on("updatePlayers", data => {
  if (data.players != {}) {
    updatePlayingArea(data.players);
    updatePlayerlist(data.players);
    showBalls(data.balls);
  } else {
    clearInterval(pingServer);
  }
});

socket.on("updateMessages", showMessages);