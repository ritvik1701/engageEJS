require("dotenv").config();

const path = require("path");
const express = require("express");
const app = express();
const { v4 } = require("uuid");
const server = require("http").createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// when at root, give a new random roomID
app.get("/", (req, res) => {
  const roomid = v4();
  // console.log(`at root of website, redirecting to room ${roomid}`);
  // res.redirect(`/${roomid}`);
  res.render("home", { roomId: roomid });
});

app.get("/:roomID", (req, res) => {
  res.render("room", { roomId: req.params.roomID });
});

io.on("connection", (socket) => {
  console.log("New socket connection: " + socket.id);
  socket.on("data", (data) => {
    io.emit("newChat", data);
  });

  socket.on("addUserToRoom", (userPeerID, roomId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("newConnection", userPeerID);

    socket.on("disconnect", () => {
      console.log("user left");
      socket.broadcast.to(roomId).emit("leavingCall", userPeerID);
    });

    socket.on("pressedDisconnectButton", (peerid) => {
      console.log("recieved disconnectButton");
      socket.broadcast.to(roomId).emit("leavingCall", peerid);
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("listening on: " + PORT);
});
