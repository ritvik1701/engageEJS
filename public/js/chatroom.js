import { addChatMessage } from "./modules/addChatHandler.js";

const joinRoom = document.querySelector("#joinRoom");
const leaveRoom = document.querySelector("#leaveRoom");
const chatInput = document.querySelector("#chatInput");
const sendButton = document.querySelector("#sendButton");
const chatContent = document.querySelector("#chatContent");
const userList = document.querySelector("#userList");
const memberCount = document.querySelector("#memberCount");
const copyMeet = document.querySelector("#copyMeet");
const copyTextField = document.querySelector("#copyTextField");

const socket = io.connect("/");

let roomUsers = [];
let userLength = 0;

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

socket.on("userList", (users) => {
  console.log("userlist recieved", users);
  userLength = users.length;
  memberCount.innerHTML = userLength;
  console.log(userLength);
  if (userList.childNodes.length > 0) {
    userList.removeChild(userList.childNodes[0]);
  }
  const list = document.createElement("div");
  list.classList.add("list");
  users.forEach((user) => {
    const userHTML = document.createElement("div");
    userHTML.classList.add("userHTML");
    const username = document.createElement("p");
    username.classList.add("memberName");
    username.innerHTML = user.username;
    userHTML.appendChild(username);
    list.appendChild(userHTML);
    console.log("user appended");
  });
  userList.appendChild(list);
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

copyMeet.addEventListener("click", (e) => {
  const el = document.createElement("textarea");
  el.value = ROOMID;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  ohSnap("Copied to clipboard!", {
    color: "green",
    duration: "1500",
  });
});
