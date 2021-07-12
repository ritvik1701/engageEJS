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

let userLength = 0;

// join chatroom when socket init completes
socket.on("connect", () => {
  console.log("Socket connected with id: ", socket.id);
  socket.emit("joinChatRoom", ROOMID, USERNAME, socket.id);
});

// when new user joins
socket.on("newChatroomConnection", (userSocket) => {
  console.log("user with socket " + userSocket + " joined");
});

//when we get chatHistory for chatroom chat history, add all messages to chat box
socket.on("chatHistory", (messages) => {
  console.log(messages);
  messages.forEach((message) => {
    addChatMessage(message, chatContent, true);
  });
});

// when we get new message, add to chat box
socket.on("newChat", (data) => {
  addChatMessage(data, chatContent, true);
});

// when we get a user list, update the member box by removing old list and making new list with updated members
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

// when we click join video call, redirect to meet url
joinRoom.addEventListener("click", (e) => {
  console.log("clicked");
  window.location.replace(`meet/${ROOMID}?username=${USERNAME}`);
});

// rediect to home page when we click leave chatroom
leaveRoom.addEventListener("click", (e) => {
  console.log("clicked leave room");
  window.location.replace("/");
});

// when we send new message
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

// when we click on copy icon next to room link
copyMeet.addEventListener("click", (e) => {
  const element = document.createElement("textarea");
  element.value = `https://engagecloneritvik.herokuapp.com/${ROOMID}`;
  document.body.appendChild(element);
  element.select();
  document.execCommand("copy");
  document.body.removeChild(element);
  ohSnap("Copied to clipboard!", {
    color: "green",
    duration: "1500",
  });
});
