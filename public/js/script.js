const peer = new Peer();
const socket = io.connect("/");
const videos = document.querySelector("#video-grid");
const controls = document.querySelector(".controls");

const selfVideo = document.createElement("video");
selfVideo.muted = true;

let roomUsers = {};

// let userStream = null;

const videoConstraints = { audio: true, video: true };
navigator.mediaDevices
  .getUserMedia(videoConstraints)
  .then((mediaStream) => {
    addStreamToVideoObject(selfVideo, mediaStream);
    // userStream = mediaStream;

    const audioButton = document.createElement("button");
    audioButton.addEventListener("click", (e) => {
      toggleAudio(mediaStream);
    });
    const muteIcon = document.createElement("i");
    muteIcon.classList.add("fas", "fa-microphone-slash", "fa-lg");
    audioButton.append(muteIcon);

    const videoButton = document.createElement("button");
    videoButton.addEventListener("click", (e) => {
      toggleVideo(mediaStream, selfVideo);
    });
    const videoIcon = document.createElement("i");
    videoIcon.classList.add("fas", "fa-video-slash", "fa-lg");
    videoButton.append(videoIcon);

    controls.append(audioButton);
    controls.append(videoButton);

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

const addStreamToVideoObject = (videoElement, mediaStream) => {
  videoElement.srcObject = mediaStream;
  console.log("Set source object for video");
  videoElement.addEventListener("loadedmetadata", () => {
    console.log("video loadad, adding to grid");
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
  video.setAttribute("poster", "assets/userIcon.png");
};

const toggleAudio = (mediaStream) => {
  mediaStream.getAudioTracks()[0].enabled =
    !mediaStream.getAudioTracks()[0].enabled;
};

// const testVideo = document.createElement("video");
// testVideo.setAttribute("poster", "assets/userIcon.jpg");
// videos.append(testVideo);
