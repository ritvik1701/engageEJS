const newRoomBtn = document.querySelector("#newRoomBtn");
const username = document.querySelector("#username");

newRoomBtn.addEventListener("click", (e) => {
  location.href = `/${ROOMID}`;
});
