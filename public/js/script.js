const peer = new Peer();
const socket = io("http://localhost:5000");
const videoGrid = document.querySelector("#video-grid");

const selfVideo = document.createElement("video");
selfVideo.muted = true;

let roomUsers = {};

const videoConstraints = { audio: true, video: true };
navigator.mediaDevices
  .getUserMedia(videoConstraints)
  .then((mediaStream) => {
    addStreamToVideoObject(selfVideo, mediaStream);

    peer.on("call", (call) => {
      console.log("Getting call from PeerID: ", call.peer);
      roomUsers[call.peer] = call;
      call.answer(mediaStream);
      const peerVideo = document.createElement("video");
      call.on("stream", (peerStream) => {
        addStreamToVideoObject(peerVideo, peerStream);
      });
      call.on("close", () => {
        console.log("closing call media stream");
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
  videoElement.addEventListener("loadedmetadata", () => {
    console.log("video loadad, adding to grid");
    videoElement.play();
  });
  videoGrid.append(videoElement);
};

const callUserWithPeerID = (toCallPeerID, currentUserStream) => {
  const call = peer.call(toCallPeerID, currentUserStream);
  const peerVideo = document.createElement("video");

  call.on("stream", (peerStream) => {
    addStreamToVideoObject(peerVideo, peerStream);
  });
  call.on("close", () => {
    console.log("closing call");
    peerVideo.remove();
    console.log(roomUsers);
  });

  roomUsers[toCallPeerID] = call;
};
