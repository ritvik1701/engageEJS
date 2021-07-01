const peer = new Peer(undefined, {
  host: "peerjsritvik.herokuapp.com",
  secure: true,
  port: 443,
  path: "/",
});
// get all the elements that need modification
const socket = io.connect("/");
const videos = document.querySelector("#video-grid");
const controls = document.querySelector(".controls");
const muteButton = document.querySelector("#muteButton");
const videoButton = document.querySelector("#videoButton");
const disconnectButton = document.querySelector("#disconnectButton");
const copyRoomInfo = document.querySelector("#copyRoom");
const sendButton = document.querySelector("#sendButton");
const chatInput = document.querySelector("#chatInput");
const chatContent = document.querySelector("#chatContent");
const userNumber = document.querySelector("#userNumber");
const handButton = document.querySelector("#handButton");

const selfVideo = document.createElement("video");
selfVideo.setAttribute("poster", "assets/userIcon.png");
selfVideo.muted = true;

let roomUsers = {};
let videoDivMap = {};
let totalUsers = 1;

// get the media stream for current user, and then set event listeners on socket and peer
const videoConstraints = { audio: true, video: true };
navigator.mediaDevices
  .getUserMedia(videoConstraints)
  .then((mediaStream) => {
    addStreamToVideoObject(selfVideo, mediaStream);

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
      roomUsers[call.peer] = { call, peerVideo };
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
});

// upon current user socket init
socket.on("connect", () => {
  console.log("Socket connected with id: ", socket.id);
});

socket.on("raiseHand", (peerID) => {
  console.log("someone raised hand ", roomUsers[peerID].peerVideo);
  let vid = roomUsers[peerID].peerVideo;
  if (vid.classList.contains("raised")) {
    vid.classList.replace("raised", "unraised");
  } else {
    vid.classList.replace("unraised", "raised");
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
  const content = data.message;
  const user = data.username;
  const message = document.createElement("div");
  const para = document.createElement("p");
  para.innerHTML = content;
  const header = document.createElement("h5");
  header.innerHTML = user;

  message.classList.add("message");
  message.appendChild(header);
  message.appendChild(para);

  chatContent.appendChild(message);
  chatContent.scrollTop = chatContent.scrollHeight;
});

const initializeControls = (mediaStream, selfVideo) => {
  // roomLink.innerHTML = ROOMID;

  userNumber.innerHTML = totalUsers;

  tippy("#muteButton", {
    theme: "light",
    content: "Toggle mute",
  });
  tippy("#videoButton", {
    theme: "light",
    content: "Toggle video",
  });
  tippy("#disconnectButton", {
    theme: "light",
    content: "Disconnect",
  });
  copyRoomInfo.addEventListener("click", (e) => {
    let roomInfo = document.querySelector("#roomLink");
    console.log(roomInfo);
    roomInfo.value = `https://engagecloneritvik.herokuapp.com/${ROOMID}`;
    roomInfo.select();
    roomInfo.setSelectionRange(0, 99999);
    document.execCommand("copy");
    console.log(roomInfo.value);
  });
  muteButton.addEventListener("click", (e) => {
    toggleAudio(mediaStream);
  });
  videoButton.addEventListener("click", (e) => {
    toggleVideo(mediaStream, selfVideo);
  });
  disconnectButton.addEventListener("click", (e) => {
    disconnectCall();
  });
  sendButton.addEventListener("click", (e) => {
    const message = chatInput.value;
    if (message !== "") {
      const username = USERNAME;
      socket.emit("data", { username, message });
      chatInput.value = "";
    }
  });
  handButton.addEventListener("click", (e) => {
    console.log("Emitting raiseHand");
    socket.emit("raiseHand", peer.id);
    if (selfVideo.classList.contains("raised")) {
      selfVideo.classList.replace("raised", "unraised");
    } else {
      selfVideo.classList.replace("unraised", "raised");
    }
  });
};

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

  roomUsers[toCallPeerID] = { call, peerVideo };
  totalUsers += 1;
  userNumber.innerHTML = totalUsers;
};

const addStreamToVideoObject = (videoElement, mediaStream) => {
  videoElement.classList.add("unraised");
  videoElement.setAttribute("poster", "assets/userIcon.png");
  videoElement.srcObject = mediaStream;
  console.log("Set source object for video");
  videoElement.addEventListener("loadedmetadata", () => {
    console.log("video loaded, adding to grid");
    // videoElement.classList.add("col");
    videoElement.play();
  });
  const wrapper = document.createElement("div");
  const username = document.createElement("p");
  username.innerHTML = USERNAME;
  wrapper.classList.add("col", "video-wrapper");
  wrapper.appendChild(videoElement);
  wrapper.appendChild(username);
  videoDivMap[videoElement] = wrapper;
  console.log(videoDivMap);
  videos.append(wrapper);
};

const toggleVideo = (mediaStream, video) => {
  mediaStream.getVideoTracks()[0].enabled =
    !mediaStream.getVideoTracks()[0].enabled;
  if (videoButton.classList.contains("selected")) {
    videoButton.classList.remove("selected");
    videoButton.classList.add("deselected");
  } else {
    videoButton.classList.remove("deselected");
    videoButton.classList.add("selected");
  }
};

const toggleAudio = (mediaStream) => {
  mediaStream.getAudioTracks()[0].enabled =
    !mediaStream.getAudioTracks()[0].enabled;
  if (muteButton.classList.contains("selected")) {
    muteButton.classList.remove("selected");
    muteButton.classList.add("deselected");
  } else {
    muteButton.classList.remove("deselected");
    muteButton.classList.add("selected");
  }
};

const disconnectCall = () => {
  socket.emit("pressedDisconnectButton", peer.id);
  console.log("emitted disconnectButton event");
  window.location.replace("/");
};
