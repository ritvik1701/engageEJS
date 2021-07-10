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

const MESSAGE_DATABASE = "message-database";
const MONGO_PASSWORD = "toor";
const MONGO_USER = "root";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const mongoose = require("mongoose");
const mongoDB = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@cluster0.4marc.mongodb.net/${MESSAGE_DATABASE}?retryWrites=true&w=majority`;
mongoose
  .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to db");
  });

const Message = require("./models/messages");
const ChatroomUser = require("./models/chatroomUsers");
let liveCaptionUser = undefined;
let videoCallUserList = [];

// when at root, give a new random roomID
app.get("/", (req, res) => {
  const roomid = v4();
  console.log("User at home");
  res.render("home", { roomId: roomid });
});

app.get("/:roomID", (req, res) => {
  res.render("room", {
    roomId: req.params.roomID,
    username: req.query.username,
  });
});

app.get("/meet/:roomID", (req, res) => {
  res.render("meeting", {
    roomId: req.params.roomID,
    username: req.query.username,
  });
  console.log(req.query.username);
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
    console.log("user with socket " + userSocket + " joined room " + roomID);

    Message.find({ roomID: `${roomID}` }, (err, messages) => {
      if (err) {
        console.log("Mongoose error while getting chats: ", err);
      } else {
        io.to(userSocket).emit("chatHistory", messages);
      }
    });

    //Get user list, add new user if same user was not already in the room list
    ChatroomUser.find({ roomID: roomID }, (err, users) => {
      if (err) {
        console.log("Error retriving users from room: ", err);
      } else {
        let exists = false;
        users.forEach((user) => {
          if (user.username === username) {
            exists = true;
          }
        });
        if (!exists) {
          let newUser = new ChatroomUser({
            roomID: roomID,
            username: username,
          });
          newUser
            .save()
            .then(() => {
              console.log("new user added to room");
              sendEvent();
            })
            .catch((err) => {
              console.log("error while saving new user to room", err);
            });
        } else {
          sendEvent();
        }
      }
    });

    // emit the user list on new additions
    const sendEvent = () => {
      ChatroomUser.find({ roomID: roomID }, (err, users) => {
        if (err) {
          console.log("Error retriving users from room: ", err);
        } else {
          console.log("emitting list");
          io.to(roomID).emit("userList", users);
        }
      });
    };
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("listening on: " + PORT);
});
