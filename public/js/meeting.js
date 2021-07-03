import {
  toggleAudio,
  raiseHandHandler,
  disconnectCall,
  tippyHandler,
} from "./modules/controlHandler.js";

const peer = new Peer(undefined, {
  host: "peerjsritvik.herokuapp.com",
  secure: true,
  port: 443,
  path: "/",
});

import { stt, sttStop } from "./modules/speechRecognition.js";

// get all the elements that need modification
const socket = io.connect("/");
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

const selfVideo = document.createElement("video");
selfVideo.setAttribute("poster", "assets/userIcon.png");
selfVideo.muted = true;

let roomUsers = {};
let videoDivMap = {};
let totalUsers = 1;
let enableDetection = false;
let handNotif = new Audio("../assets/handRaise.mp3");

// ---------------------- STARTING THE CALL ------------------------
// get the media stream for current user, and then set event listeners on socket and peer
const videoConstraints = { audio: true, video: true };
navigator.mediaDevices
  .getUserMedia(videoConstraints)
  .then((mediaStream) => {
    addStreamToVideoObject(selfVideo, mediaStream, true);
    // console.log(mediaStream.getAudioTracks[0]);
    // set the properties of the controls
    initializeControls(mediaStream, selfVideo);

    // when there is incoming call
    peer.on("call", (call) => {
      console.log("Getting call from PeerID: ", call.peer);
      totalUsers += 1;
      userNumber.innerHTML = totalUsers;
      //answer the call
      call.answer(mediaStream);
      console.log("Answering the call");
      const peerVideo = document.createElement("video");
      roomUsers[call.peer] = { call, peerVideo, handRaiseCount: 0 };
      let i = 0;
      //when you get a reply from the peer who called
      call.on("stream", (peerStream) => {
        i += 1;
        console.log(`Got peer stream ${i}`);
        if (i % 2 == 0) addStreamToVideoObject(peerVideo, peerStream);
      });
      //when the callee disconnects the call
      call.on("close", () => {
        console.log("closing call");
        videoDivMap[peerVideo].classList.add("d-none");
        videoDivMap[peerVideo].remove();
        totalUsers -= 1;
        userNumber.innerHTML = totalUsers;
      });
    });

    //when you get a new connection
    socket.on("newConnection", (incomingUserId) => {
      console.log("User with PeerID " + incomingUserId + " joined the room");
      callUserWithPeerID(incomingUserId, mediaStream);
    });
  })
  //when getting user media fails, or any of the above listeners fail
  .catch((e) => {
    console.log("Error in getting user media: ", e);
    alert("Error getting user audio and video");
  });

// upon current user peerID init
peer.on("open", (id) => {
  console.log("peer open with id ", id);
  socket.emit("addUserToRoom", peer.id, ROOMID);
  roomUsers[peer.id] = {
    call: undefined,
    peerVideo: selfVideo,
    handRaiseCount: 0,
  };
});

// ------------------------ SETTING UP SOCKET HANDLERS ---------------------------
// upon current user socket init
socket.on("connect", () => {
  console.log("Socket connected with id: ", socket.id);
});

socket.on("setTranslation", (translation) => {
  results.innerHTML += translation.data;
  translatedResults.innerHTML += translation.translation;
  results.scrollTop = results.scrollHeight;
  translatedResults.scrollTop = translatedResults.scrollHeight;
});

socket.on("raiseHand", (peerID) => {
  console.log("someone raised hand ", roomUsers[peerID].peerVideo);
  raiseHandHandler(roomUsers[peerID].peerVideo);
  roomUsers[peerID].handRaiseCount += 1;
  if (roomUsers[peerID].handRaiseCount % 2 != 0) handNotif.play();
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
  const content = data.message;
  const user = data.username;
  const system = data.system;
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
  message.appendChild(para);

  chatContent.appendChild(message);
  chatContent.scrollTop = chatContent.scrollHeight;
});

// ------------------------ HAND DETECTION LOGIC ----------------------------------
const modelParams = {
  flipHorizontal: true, // flip e.g for video
  imageScaleFactor: 0.7, // reduce input image size .
  maxNumBoxes: 3, // maximum number of boxes to detect
  iouThreshold: 0.5, // ioU threshold for non-max suppression
  scoreThreshold: 0.83, // confidence threshold for predictions.
};

let model;
let detectionStopped = false;
let handRaised = false;

const handDetectionHandler = () => {
  if (enableDetection)
    ohSnap("Enabling gestures...", {
      color: "yellow",
      duration: "1500",
    });
  handTrack.startVideo(selfVideo).then((status) => {
    if (status) {
      console.log("detection starting");
      if (enableDetection)
        ohSnap("Gestures enabled!", {
          color: "green",
          duration: "1500",
        });
      let interval = setInterval(() => {
        if (detectionStopped || !enableDetection) {
          console.log("clearing interval of detection");
          clearInterval(interval);
        } else {
          startDetection();
        }
      }, 1000);
    }
  });
  const startDetection = () => {
    model.detect(selfVideo).then((predictions) => {
      console.log(predictions);
      predictions.forEach((prediction) => {
        if (prediction.label === "open" && !handRaised) {
          handRaised = true;
          selfRaiseHand();
        }
      });
    });
  };
  handTrack.load(modelParams).then((loadedModel) => {
    model = loadedModel;
  });
};

// -------------------------- BUTTON INITS ------------------------------
const initializeControls = (mediaStream, selfVideo) => {
  // roomLink.innerHTML = ROOMID;

  userNumber.innerHTML = totalUsers;

  tippyHandler();
  muteButton.addEventListener("click", (e) => {
    toggleAudio(mediaStream, muteButton);
    ohSnap("Toggling mute", { color: "red", duration: "1000" });
  });
  videoButton.addEventListener("click", (e) => {
    ohSnap("Toggling video", { color: "red", duration: "1000" });
    mediaStream.getVideoTracks()[0].enabled =
      !mediaStream.getVideoTracks()[0].enabled;
    if (videoButton.classList.contains("selected")) {
      videoButton.classList.remove("selected");
      videoButton.classList.add("deselected");
      detectionStopped = false;
      handDetectionHandler();
    } else {
      videoButton.classList.remove("deselected");
      videoButton.classList.add("selected");
      handTrack.stopVideo(selfVideo);
      if (model) model.dispose();
      detectionStopped = true;
    }
  });
  disconnectButton.addEventListener("click", (e) => {
    disconnectCall(socket, peer);
  });
  sendButton.addEventListener("click", (e) => {
    const message = chatInput.value;
    if (message !== "") {
      const username = USERNAME;
      socket.emit("data", { username, message, system: false });
      chatInput.value = "";
    }
  });
  handButton.addEventListener("click", (e) => {
    ohSnap("Toggling hand raise", { color: "red", duration: "1000" });
    selfRaiseHand();
  });
  gestureButton.addEventListener("click", (e) => {
    // ohSnap("Toggling gestures", { color: "red", duration: "1000" });
    console.log("Toggling gestures");
    if (gestureButton.classList.contains("selected")) {
      gestureButton.classList.remove("selected");
      gestureButton.classList.add("deselected");
      enableDetection = false;
      ohSnap("Disabling gestures", { color: "red", duration: "1000" });
    } else {
      gestureButton.classList.remove("deselected");
      gestureButton.classList.add("selected");
      enableDetection = true;
      handDetectionHandler();
    }
  });
  captionButton.addEventListener("click", (e) => {
    console.log("Toggling captions");
    if (captionButton.classList.contains("selected")) {
      captionButton.classList.remove("selected");
      captionButton.classList.add("deselected");
      sttStop();
    } else {
      captionButton.classList.remove("deselected");
      captionButton.classList.add("selected");
      stt(captionButton, socket);
    }
  });
};

// ------------------------------ HELPER FUNCTIONS --------------------------------
// when you want to call a user with their peerID
const callUserWithPeerID = (toCallPeerID, currentUserStream) => {
  const call = peer.call(toCallPeerID, currentUserStream);
  const peerVideo = document.createElement("video");
  console.log("calling user with peerID: " + toCallPeerID, call);
  let i = 0;
  call.on("stream", (peerStream) => {
    i += 1;
    console.log(`Got peer stream ${i}`);
    if (i % 2 == 0) {
      addStreamToVideoObject(peerVideo, peerStream);
    }
  });
  call.on("close", () => {
    console.log("closing call");
    videoDivMap[peerVideo].remove();
    totalUsers -= 1;
    userNumber.innerHTML = totalUsers;
  });

  roomUsers[toCallPeerID] = { call, peerVideo, handRaiseCount: 0 };
  totalUsers += 1;
  userNumber.innerHTML = totalUsers;
};

const addStreamToVideoObject = (videoElement, mediaStream, isSelf = false) => {
  videoElement.classList.add("unraised");
  videoElement.setAttribute("poster", "assets/userIcon.png");
  videoElement.srcObject = mediaStream;
  console.log(mediaStream.getAudioTracks());
  console.log("Set source object for video");
  videoElement.addEventListener("loadedmetadata", () => {
    console.log("video loaded, adding to grid");
    videoElement.play();
  });
  const wrapper = document.createElement("div");
  const username = document.createElement("p");
  username.innerHTML = USERNAME;
  wrapper.classList.add("col", "video-wrapper");
  wrapper.appendChild(videoElement);
  wrapper.appendChild(username);
  if (isSelf) {
    wrapper.classList.add("selfVideo", "d-none", "d-md-block");
    username.innerHTML = "You";
  }
  videoDivMap[videoElement] = wrapper;
  console.log(videoDivMap);
  videos.append(wrapper);
};

const selfRaiseHand = () => {
  console.log("Emitting raiseHand");
  socket.emit("raiseHand", peer.id);
  if (selfVideo.classList.contains("raised")) {
    selfVideo.classList.replace("raised", "unraised");
    handRaised = false;
  } else {
    selfVideo.classList.replace("unraised", "raised");
    socket.emit("data", {
      username: "SYSTEM",
      message: `${USERNAME} raised hand`,
      system: true,
    });
    handRaised = true;
  }
  if (handButton.classList.contains("selected")) {
    handButton.classList.remove("selected");
    handButton.classList.add("deselected");
  } else {
    handButton.classList.remove("deselected");
    handButton.classList.add("selected");
  }
};
