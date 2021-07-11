import { requestTranslation } from "../modules/speechRecognition.js";
import { addChatMessage } from "../modules/addChatHandler.js";

const videos = document.querySelector("#video-grid");
const muteButton = document.querySelector("#muteButton");
const videoButton = document.querySelector("#videoButton");
const disconnectButton = document.querySelector("#disconnectButton");
const sendButton = document.querySelector("#sendButton");
const chatInput = document.querySelector("#chatInput");
const chatContent = document.querySelector("#chatContent");
const userNumber = document.querySelector("#userNumber");
const handButton = document.querySelector("#handButton");
const gestureButton = document.querySelector("#gestureButton");
const captionButton = document.querySelector("#captionButton");
const screenshareButton = document.querySelector("#screenshareButton");
const results = document.querySelector("#sttResult");
const translatedResults = document.querySelector("#translatedResult");
const languagesDropdown = document.querySelector("#languages");
const languageSelector = document.querySelector("#languageSelector");
const languageSubmit = document.querySelector("#languageSubmit");
const translateButton = document.querySelector("#translateButton ");
const liveCaptionHeading = document.querySelector("#liveCaptionHeading");

let isTranslateEnabled = false;
let lang = "ko";
let handNotif = new Audio("../assets/handRaise.mp3");

export const socketInit = (socket, peer, roomUsers, isCaptionEnabled) => {
  socket.on("connect", () => {
    console.log("Socket connected with id: ", socket.id);
  });

  socket.on("chatHistory", (messages) => {
    messages.forEach((message) => {
      addChatMessage(message, chatContent, true);
    });
  });

  socket.on("setLiveCaption", (caption) => {
    console.log("Got result from stt");
    results.innerHTML += caption.data;
    results.scrollTop = results.scrollHeight;
    if (isTranslateEnabled) {
      requestTranslation(lang, caption.data, translatedResults, socket);
    }
  });

  socket.on("raiseHand", (peerID) => {
    console.log("someone raised hand ", roomUsers[peerID].peerVideo);
    raiseHandHandler(roomUsers[peerID].peerVideo);
    roomUsers[peerID].handRaiseCount += 1;
    if (roomUsers[peerID].handRaiseCount % 2 != 0) handNotif.play();
  });

  socket.on("setLiveCaptionUser", (peerID) => {
    console.log("Setting peer " + peerID + " as live caption");
    roomUsers[peerID].peerVideo.classList.add("ccon");
    isCaptionEnabled = true;
    results.classList.replace("d-none", "d-block");
    liveCaptionHeading.classList.replace("d-none", "d-block");
    captionButton.classList.add("d-none");
    translateButton.classList.remove("d-none");
  });

  socket.on("unsetLiveCaptionUser", (peerID) => {
    roomUsers[peerID].peerVideo.classList.remove("ccon");
    isCaptionEnabled = false;
    results.classList.replace("d-block", "d-none");
    liveCaptionHeading.classList.replace("d-block", "d-none");
    results.innerHTML = "";
    captionButton.classList.remove("d-none");
    translateButton.classList.add("d-none");
    languageSelector.classList.add("d-none");
    if (!translatedResults.classList.contains("d-none")) {
      translatedResults.classList.add("d-none");
      translatedResults.innerHTML = "";
    }
    if (translateButton.classList.contains("selected")) {
      translateButton.classList.replace("selected", "deselected");
    }
  });

  // when a peer leaves the call
  socket.on("leavingCall", (userPeerID) => {
    console.log("recieved leavingCall of peer ", userPeerID);
    if (roomUsers[userPeerID].call) {
      console.log("Found video element");
      roomUsers[userPeerID].call.close();
    } else {
      console.log("Couldn't find element");
    }
  });

  // when the socket gets a new chat
  socket.on("newChat", (data) => {
    addChatMessage(data, chatContent);
  });
};
