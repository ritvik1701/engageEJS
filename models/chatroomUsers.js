const mongoose = require("mongoose");
const chatroomUserSchema = new mongoose.Schema({
  roomID: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
});

const ChatroomUser = mongoose.model("chatroomUser", chatroomUserSchema);
module.exports = ChatroomUser;
