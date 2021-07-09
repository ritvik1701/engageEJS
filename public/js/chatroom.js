import { addChatMessage } from "./modules/addChatHandler.js";

const joinRoom = document.querySelector("#joinRoom");
const leaveRoom = document.querySelector("#leaveRoom");
const chatInput = document.querySelector("#chatInput");
const sendButton = document.querySelector("#sendButton");
const chatContent = document.querySelector("#chatContent");

const socket = io.connect("/");

socket.on("connect", () => {
  console.log("Socket connected with id: ", socket.id);
  socket.emit("joinChatRoom", ROOMID, USERNAME, socket.id);
});

socket.on("newChatroomConnection", (userSocket) => {
  console.log("user with socket " + userSocket + " joined");
});

socket.on("chatHistory", (messages) => {
  console.log(messages);
  messages.forEach((message) => {
    addChatMessage(message, chatContent, true);
  });
});

socket.on("newChat", (data) => {
  addChatMessage(data, chatContent, true);
});

joinRoom.addEventListener("click", (e) => {
  console.log("clicked");
  window.location.replace(`meet/${ROOMID}?username=${USERNAME}`);
});

leaveRoom.addEventListener("click", (e) => {
  console.log("clicked leave room");
  window.location.replace("/");
});

sendButton.addEventListener("click", (e) => {
  const message = chatInput.value;
  if (message !== "") {
    const username = USERNAME;
    socket.emit("data", {
      roomID: `${ROOMID}`,
      userID: socket.id,
      username: username,
      content: message,
      system: false,
      inMeeting: false,
    });
    chatInput.value = "";
  }
});
