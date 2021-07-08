export const toggleAudio = (mediaStream, muteButton) => {
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

export const raiseHandHandler = (vid) => {
  if (vid.classList.contains("raised")) {
    vid.classList.replace("raised", "unraised");
  } else {
    vid.classList.replace("unraised", "raised");
  }
};

export const captionsHandler = (vid) => {
  if (vid.classList.contains("ccon")) {
    vid.classList.replace("ccon", "ccoff");
  } else {
    vid.classList.replace("ccoff", "ccon");
  }
};

export const disconnectCall = (socket, peer) => {
  socket.emit("pressedDisconnectButton", peer.id);
  console.log("emitted disconnectButton event");
  window.location.replace(`/${ROOMID}`);
};

export const tippyHandler = () => {
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
  tippy("#handButton", {
    theme: "light",
    content: "Raise hand",
  });
  tippy("#gestureButton", {
    theme: "light",
    content: "Enable gestures",
  });
  tippy("#captionButton", {
    theme: "light",
    content: "Live captioning",
  });
  tippy("#screenshareButton", {
    theme: "light",
    content: "Screen share",
  });
};
