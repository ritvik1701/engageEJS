const newRoomBtn = document.querySelector("#newRoomBtn");
const joinRoomBtn = document.querySelector("#joinRoomBtn");
const username = document.querySelector("#username");

newRoomBtn.addEventListener("click", (e) => {
  if (username.value !== "")
    location.href = `${ROOMID}?username=${username.value}`;
  else alert("Enter username!");
});

joinRoomBtn.addEventListener("click", (e) => {
  if (username.value !== "") {
    let roomId = prompt(
      "Please enter the room invite code:",
      "Enter code here"
    );
    location.href = `${roomId}?username=${username.value}`;
  } else alert("Enter username!");
});
