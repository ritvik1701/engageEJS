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

let liveCaptionUser = undefined;
const mongoose = require("mongoose");
const mongoDB = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@engageclone.4marc.mongodb.net/message-database?retryWrites=true&w=majority`;
mongoose
  .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to db");
  });

const Message = require("./models/messages");

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

  socket.on("addUserToRoom", (userPeerID, roomId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("newConnection", userPeerID);

    socket.on("data", (data) => {
      const chat = new Message({
        roomID: data.roomID,
        userID: data.userID,
        username: data.username,
        content: data.content,
        system: data.system,
      });
      console.log("data recieved: ", data.username);
      chat
        .save()
        .then(() => {
          io.emit("newChat", data);
        })
        .catch((e) => {
          console.log("error while saving to db!", e);
        });
    });

    socket.on("disconnect", () => {
      console.log("user left");
      socket.broadcast.to(roomId).emit("leavingCall", userPeerID);
    });

    socket.on("raiseHand", (peerID) => {
      console.log("Peer " + peerID + " raised hand, emitting");
      socket.broadcast.to(roomId).emit("raiseHand", peerID);
    });

    socket.on("gotLiveCaption", (caption) => {
      socket.broadcast.to(roomId).emit("setLiveCaption", caption);
    });

    socket.on("liveCaptionUser", (peerID) => {
      liveCaptionUser = peerID;
      socket.broadcast.to(roomId).emit("setLiveCaptionUser", peerID);
    });

    socket.on("liveCaptionUserOff", (peerID) => {
      liveCaptionUser = undefined;
      socket.broadcast.to(roomId).emit("unsetLiveCaptionUser", peerID);
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
