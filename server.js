const express = require("express");
const handler = require("./handler.js");
const socket = require("socket.io");
const app = express();

const listener = app.listen(process.env.PORT || 57478);
const io = new socket.Server(listener);

let players = {};
let balls = {};
let messages = [];

let movementSpeedX = 36;
let movementSpeedY = 48;
let boundsWidth = 648;
let boundsHeight = 384;

app.use(express.static("src"));
app.use(express.urlencoded({
    extended: true
}));

setInterval(handler.checkPings, 3000);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/src/index.html");
});

app.post("/ping", (req, res) => {
    let name = req.body.name;
    res.send(handler.ping(name));
});

app.post("/joinGame", (req, res) => {
    let name = req.body.name;
    let gender = req.body.gender;
    res.send(handler.joinGame(name, gender));
});

app.post("/move", (req, res) => {
    let name = req.body.name;
    let direction = req.body.direction;
    res.send(handler.move(name, direction));
});

app.post("/throwBall", (req, res) => {
    let name = req.body.name;
    res.send(handler.throwBall(name));
});

app.post("/sendMessage", (req, res) => {
    let name = req.body.name;
    let message = req.body.message;
    res.send(handler.sendMessage(name, message));
});

io.on("connection", handler.ioHandler);