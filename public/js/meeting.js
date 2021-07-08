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

import {
  requestTranslation,
  stt,
  sttStop,
} from "./modules/speechRecognition.js";

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
const languagesDropdown = document.querySelector("#languages");
const languageSelector = document.querySelector("#languageSelector");
const languageSubmit = document.querySelector("#languageSubmit");
const translateButton = document.querySelector("#translateButton ");
const liveCaptionHeading = document.querySelector("#liveCaptionHeading");

const selfVideo = document.createElement("video");
selfVideo.setAttribute("poster", "assets/userIcon.png");
selfVideo.muted = true;

results.classList.replace("d-block", "d-none");
liveCaptionHeading.classList.replace("d-block", "d-none");
translatedResults.classList.replace("d-block", "d-none");

let roomUsers = {};
let videoDivMap = {};
let totalUsers = 1;
let enableDetection = false;
let handNotif = new Audio("../assets/handRaise.mp3");
let camVideo = undefined;
let screenVideo = undefined;
let isCaptionEnabled = false;
let isTranslateEnabled = false;
let lang = "ko";

// ---------------------- STARTING THE CALL ------------------------
// get the media stream for current user, and then set event listeners on socket and peer
const videoConstraints = { audio: true, video: true };
navigator.mediaDevices
  .getUserMedia(videoConstraints)
  .then((mediaStream) => {
    addStreamToVideoObject(selfVideo, mediaStream, true);
    // console.log(mediaStream.getAudioTracks[0]);
    // set the properties of the controls
    camVideo = mediaStream.getVideoTracks()[0];
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

    screenshareButton.addEventListener("click", (e) => {
      console.log("Screenshare clicked");
      if (screenshareButton.classList.contains("selected")) {
        screenVideo.getVideoTracks().forEach((track) => {
          track.stop();
        });
        Object.keys(roomUsers).forEach((user) => {
          if (roomUsers[user].call) {
            roomUsers[user].call.peerConnection
              .getSenders()[1]
              .replaceTrack(camVideo);
            console.log("Replacing video source");
          }
        });
        mediaStream.removeTrack(mediaStream.getVideoTracks()[0]);
        mediaStream.addTrack(camVideo);
        screenshareButton.classList.remove("selected");
        screenshareButton.classList.add("deselected");
      } else {
        navigator.mediaDevices
          .getDisplayMedia()
          .then((displayMediaStream) => {
            screenVideo = displayMediaStream;
            mediaStream.removeTrack(camVideo);
            mediaStream.addTrack(displayMediaStream.getVideoTracks()[0]);
            Object.keys(roomUsers).forEach((user) => {
              if (roomUsers[user].call) {
                roomUsers[user].call.peerConnection
                  .getSenders()[1]
                  .replaceTrack(displayMediaStream.getVideoTracks()[0])
                  .catch((e) => {
                    console.log("lmao ", e);
                  });
                console.log("Replacing video source");
              }
            });
          })
          .catch((e) => {
            console.log("Screenshare error, ", e);
          });
        screenshareButton.classList.remove("deselected");
        screenshareButton.classList.add("selected");
      }
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
  socket.emit("addUserToRoom", peer.id, ROOMID, socket.id);
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

socket.on("chatHistory", (messages) => {
  messages.forEach((message) => {
    addChatMessage(message);
  });
});

socket.on("setLiveCaption", (caption) => {
  console.log("Got result from stt");
  results.innerHTML += caption.data;
  results.scrollTop = results.scrollHeight;
  if (isTranslateEnabled) {
    requestTranslation(lang, caption.data, translatedResults, socket);
  }
  // translatedResults.innerHTML += translation.translation;
  // translatedResults.scrollTop = translatedResults.scrollHeight;
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
  addChatMessage(data);
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
let detectionCount = 0;

const handDetectionHandler = () => {
  if (enableDetection)
    ohSnap("Enabling gestures...", {
      color: "yellow",
      duration: "1500",
    });
  handTrack.startVideo(selfVideo).then((status) => {
    if (status) {
      console.log("detection starting");
      let interval = setInterval(() => {
        if (detectionStopped || !enableDetection) {
          console.log("clearing interval of detection");
          clearInterval(interval);
          detectionCount = 0;
        } else {
          startDetection();
        }
      }, 1000);
    }
  });
  const startDetection = () => {
    model.detect(selfVideo).then((predictions) => {
      detectionCount += 1;
      if (enableDetection && detectionCount == 1)
        ohSnap("Gestures enabled!", {
          color: "green",
          duration: "1500",
        });
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
      socket.emit("data", {
        roomID: `${ROOMID}`,
        userID: peer.id,
        username: username,
        content: message,
        system: false,
        inMeeting: true,
      });
      chatInput.value = "";
    }
  });
  handButton.addEventListener("click", (e) => {
    ohSnap("Toggling hand raise", { color: "red", duration: "1000" });
    selfRaiseHand();
  });
  gestureButton.addEventListener("click", (e) => {
    if (videoButton.classList.contains("selected")) {
      ohSnap("Enable video to start gesture recognition", {
        color: "yellow",
        duration: "2000",
      });
    } else {
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
    }
  });
  captionButton.addEventListener("click", (e) => {
    console.log("Toggling captions");
    if (captionButton.classList.contains("deselected")) {
      if (isCaptionEnabled) {
        ohSnap("Live captions in use by another member", {
          color: "yellow",
          duration: "2000",
        });
      } else if (muteButton.classList.contains("selected")) {
        ohSnap("Unmute to continue with captions", {
          color: "yellow",
          duration: "2000",
        });
      } else {
        captionButton.classList.remove("deselected");
        captionButton.classList.add("selected");
        liveCaptionHeading.classList.replace("d-none", "d-block");
        results.classList.replace("d-none", "d-block");
        stt(captionButton, socket, peer, results, liveCaptionHeading);
      }
    } else {
      captionButton.classList.remove("selected");
      captionButton.classList.add("deselected");
      liveCaptionHeading.classList.replace("d-block", "d-none");
      results.classList.replace("d-block", "d-none");
      results.innerHTML = "";
      sttStop(socket, peer);
    }
  });

  translateButton.addEventListener("click", (e) => {
    console.log("translate button clicked");
    if (translateButton.classList.contains("deselected")) {
      languageSelector.classList.remove("d-none");
      translateButton.classList.replace("deselected", "selected");
    } else {
      if (!languageSelector.classList.contains("d-none"))
        languageSelector.classList.add("d-none");
      translateButton.classList.replace("selected", "deselected");
      isTranslateEnabled = false;
    }
  });

  languageSubmit.addEventListener("click", (e) => {
    lang = languagesDropdown.value;
    isTranslateEnabled = true;
    translatedResults.classList.remove("d-none");
    languageSelector.classList.add("d-none");
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
      roomID: `${ROOMID}`,
      userID: "System",
      username: "System",
      content: `${USERNAME} raised hand`,
      system: true,
      inMeeting: true,
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
