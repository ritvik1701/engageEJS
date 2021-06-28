const peer = new Peer(undefined, {
  host: "peerjsritvik.herokuapp.com",
  secure: true,
  port: 443,
  path: "/",
});
const socket = io.connect("/");
const videos = document.querySelector("#video-grid");
const controls = document.querySelector(".controls");
const muteButton = document.querySelector("#muteButton");
const videoButton = document.querySelector("#videoButton");
const disconnectButton = document.querySelector("#disconnectButton");
const copyRoomInfo = document.querySelector("#copyRoom");

const selfVideo = document.createElement("video");
selfVideo.setAttribute("poster", "assets/userIcon.png");
selfVideo.muted = true;

let roomUsers = {};

const videoConstraints = { audio: true, video: true };
navigator.mediaDevices
  .getUserMedia(videoConstraints)
  .then((mediaStream) => {
    addStreamToVideoObject(selfVideo, mediaStream);

    initializeControls(mediaStream, selfVideo);

    peer.on("call", (call) => {
      console.log("Getting call from PeerID: ", call.peer);
      roomUsers[call.peer] = call;
      call.answer(mediaStream);
      console.log("Answering the call");
      const peerVideo = document.createElement("video");
      call.on("stream", (peerStream) => {
        console.log("Got peer video stream");
        addStreamToVideoObject(peerVideo, peerStream);
      });
      call.on("close", () => {
        console.log("closing call");
        peerVideo.remove();
      });
    });

    socket.on("newConnection", (incomingUserId) => {
      console.log("User with PeerID " + incomingUserId + " joined the room");
      callUserWithPeerID(incomingUserId, mediaStream);
    });
  })
  .catch((e) => {
    console.log("Error in getting user media: ", e);
    alert("Error getting user audio and video");
  });

peer.on("open", (id) => {
  console.log("peer open with id ", id);
  socket.emit("addUserToRoom", peer.id, ROOMID);
});

socket.on("connect", () => {
  console.log("Socket connected with id: ", socket.id);
});

socket.on("leavingCall", (userPeerID) => {
  console.log("recieved leavingCall of peer ", userPeerID);
  if (roomUsers[userPeerID]) {
    console.log("Found video element");
    roomUsers[userPeerID].close();
  } else {
    console.log("Couldn't find element");
  }
});

socket.on("newChat", (data) => {
  console.log(data);
});

const initializeControls = (mediaStream, selfVideo) => {
  // roomLink.innerHTML = ROOMID;
  tippy("#copyRoom", {
    content: "Click to copy room link",
  });
  tippy("#muteButton", {
    content: "Toggle mute",
  });
  tippy("#videoButton", {
    content: "Toggle video",
  });
  tippy("#disconnectButton", {
    content: "Disconnect",
  });
  copyRoomInfo.addEventListener("click", (e) => {
    let roomInfo = document.querySelector("#roomLink");
    roomInfo.value = `https://engagecloneritvik.herokuapp.com/${ROOMID}`;
    roomInfo.select();
    roomInfo.setSelectionRange(0, 99999);
    document.execCommand("copy");
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
};

const addStreamToVideoObject = (videoElement, mediaStream) => {
  videoElement.setAttribute("poster", "assets/userIcon.png");
  videoElement.srcObject = mediaStream;
  console.log("Set source object for video");
  videoElement.addEventListener("loadedmetadata", () => {
    console.log("video loaded, adding to grid");
    videoElement.play();
  });
  videos.append(videoElement);
};

const callUserWithPeerID = (toCallPeerID, currentUserStream) => {
  const call = peer.call(toCallPeerID, currentUserStream);
  const peerVideo = document.createElement("video");
  console.log("calling user with peerID: " + toCallPeerID);
  call.on("stream", (peerStream) => {
    console.log("Got peer video stream");
    addStreamToVideoObject(peerVideo, peerStream);
  });
  call.on("close", () => {
    console.log("closing call");
    peerVideo.remove();
    console.log(roomUsers);
  });

  roomUsers[toCallPeerID] = call;
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
