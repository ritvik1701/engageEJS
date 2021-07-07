const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema({
  roomID: {
    type: String,
    required: true,
  },
  userID: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  system: {
    type: Boolean,
    required: true,
  },
});

const Message = mongoose.model("message", messageSchema);
module.exports = Message;
