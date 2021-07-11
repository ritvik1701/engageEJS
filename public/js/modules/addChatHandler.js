// method to add data as an HTML element to the DOM

export const addChatMessage = (data, chatContent, isChatroom = false) => {
  const content = data.content;
  let user = data.username;
  const system = data.system;
  const inMeeting = data.inMeeting;
  const message = document.createElement("div");
  const wrapper = document.createElement("div");

  // if we are in the chatroom, and the message is a system notif, don't display it
  if (isChatroom && system) {
    return;
  } else {
    if (user == USERNAME) {
      message.classList.add("selfMessage");
      user = "Me";
    }
    message.classList.add("message");
    const para = document.createElement("p");
    para.innerHTML = content;
    if (!system) {
      const header = document.createElement("h5");
      header.innerHTML = user;
      if (!inMeeting) {
        if (user !== "Me")
          header.innerHTML =
            header.innerHTML + ` <span class="status">Chatroom</span>`;
        else
          header.innerHTML =
            `<span class="status">Chatroom</span> ` + header.innerHTML;
      } else {
        if (user !== "Me")
          header.innerHTML =
            header.innerHTML + ` <span class="status">In-call</span>`;
        else
          header.innerHTML =
            `<span class="status">In-call</span> ` + header.innerHTML;
      }
      message.appendChild(header);
    } else {
      message.classList.add("system");
    }
    message.appendChild(para);
    wrapper.appendChild(message);
    chatContent.appendChild(wrapper);
    chatContent.scrollTop = chatContent.scrollHeight;
  }
};
