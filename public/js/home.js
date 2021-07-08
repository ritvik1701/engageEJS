const newRoomBtn = document.querySelector("#newRoomBtn");
const username = document.querySelector("#username");

const redirect = () => {
  location.href = `meet/${ROOMID}`;
};

newRoomBtn.addEventListener("click", (e) => {
  location.href = `/${ROOMID}`;
});
