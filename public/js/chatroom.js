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
    addChatMessage(message);
  });
});

socket.on("newChat", (data) => {
  addChatMessage(data);
});

joinRoom.addEventListener("click", (e) => {
  console.log("clicked");
  window.location.replace(`meet/${ROOMID}`);
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

const addChatMessage = (data) => {
  const content = data.content;
  const user = data.username;
  const system = data.system;
  const inMeeting = data.inMeeting;
  const message = document.createElement("div");
  message.classList.add("message");
  const para = document.createElement("p");
  para.innerHTML = content;
  if (!system) {
    const header = document.createElement("h5");
    header.innerHTML = user;
    message.appendChild(header);
  } else {
    message.classList.add("system");
  }

  if (!inMeeting) {
    para.innerHTML = "OUTSIDE MEETING " + para.innerHTML;
  } else {
    para.innerHTML = "IN MEETING " + para.innerHTML;
  }
  message.appendChild(para);

  chatContent.appendChild(message);
  chatContent.scrollTop = chatContent.scrollHeight;
};
