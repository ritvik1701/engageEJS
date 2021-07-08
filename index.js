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

const mongoose = require("mongoose");
const mongoDB = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.4marc.mongodb.net/message-database?retryWrites=true&w=majority`;
mongoose
  .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to db");
  });

const Message = require("./models/messages");
let liveCaptionUser = undefined;
let userList = [];

// when at root, give a new random roomID
app.get("/", (req, res) => {
  const roomid = v4();
  console.log("User at home");
  res.render("home", { roomId: roomid });
});

app.get("/:roomID", (req, res) => {
  res.render("room", { roomId: req.params.roomID });
});

app.get("/meet/:roomID", (req, res) => {
  res.render("meeting", { roomId: req.params.roomID });
});

io.on("connection", (socket) => {
  console.log("New socket connection: " + socket.id);

  socket.on("data", (data) => {
    const chat = new Message({
      roomID: data.roomID,
      userID: data.userID,
      username: data.username,
      content: data.content,
      system: data.system,
      inMeeting: data.inMeeting,
    });
    chat
      .save()
      .then(() => {
        console.log("message saved to db");
        io.to(data.roomID).emit("newChat", data);
      })
      .catch((e) => {
        console.log("error while saving to db!", e);
      });
  });

  socket.on("addUserToRoom", (userPeerID, roomID, socketID) => {
    socket.join(roomID);
    socket.broadcast.to(roomID).emit("newConnection", userPeerID);
    Message.find({ roomID: `${roomID}` }, (err, messages) => {
      if (err) {
        console.log("Mongoose error while getting chats: ", err);
      } else {
        io.to(socketID).emit("chatHistory", messages);
      }
    });

    socket.on("disconnect", () => {
      console.log("user left");
      socket.broadcast.to(roomID).emit("leavingCall", userPeerID);
    });

    socket.on("raiseHand", (peerID) => {
      console.log("Peer " + peerID + " raised hand, emitting");
      socket.broadcast.to(roomID).emit("raiseHand", peerID);
    });

    socket.on("gotLiveCaption", (caption) => {
      socket.broadcast.to(roomID).emit("setLiveCaption", caption);
    });

    socket.on("liveCaptionUser", (peerID) => {
      liveCaptionUser = peerID;
      socket.broadcast.to(roomID).emit("setLiveCaptionUser", peerID);
    });

    socket.on("liveCaptionUserOff", (peerID) => {
      liveCaptionUser = undefined;
      socket.broadcast.to(roomID).emit("unsetLiveCaptionUser", peerID);
    });

    socket.on("pressedDisconnectButton", (peerid) => {
      console.log("recieved disconnectButton");
      socket.broadcast.to(roomID).emit("leavingCall", peerid);
    });
  });

  socket.on("joinChatRoom", (roomID, username, userSocket) => {
    socket.join(roomID);
    socket.broadcast.to(roomID).emit("newChatroomConnection", userSocket);
    userList[username] = userSocket;
    console.log("user with socket " + userSocket + " joined room " + roomID);

    Message.find({ roomID: `${roomID}` }, (err, messages) => {
      if (err) {
        console.log("Mongoose error while getting chats: ", err);
      } else {
        io.to(userSocket).emit("chatHistory", messages);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("listening on: " + PORT);
});
