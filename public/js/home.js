const newRoomBtn = document.querySelector("#newRoomBtn");
const joinRoomBtn = document.querySelector("#joinRoomBtn");
const username = document.querySelector("#username");

// when we click new meeting, make a new chat room and get username
newRoomBtn.addEventListener("click", (e) => {
  if (username.value !== "")
    location.href = `${ROOMID}?username=${username.value}`;
  else alert("Enter username!");
});

// when we want to join a room, issue a promt to get invite code
joinRoomBtn.addEventListener("click", (e) => {
  if (username.value !== "") {
    let roomId = prompt(
      "Please enter the room invite code:",
      "Enter code here"
    );
    location.href = `${roomId}?username=${username.value}`;
  } else alert("Enter username!");
});
