export function createElement({ tagName, className, attributes = {} }) {
  const element = document.createElement(tagName);

  if (className) {
    const classNames = className.split(' ').filter(Boolean);
    element.classList.add(...classNames);
  }

  Object.keys(attributes).forEach((key) => element.setAttribute(key, attributes[key]));

  return element;
}

const username = sessionStorage.getItem("username");

if (!username) {
  window.location.replace("/login");
}

const socket = io("", { query: { username } });

const roomNames=[];//changing while updating
const createRoomButton=document.getElementById('createRooms');
const roomContainer=document.getElementById('roomsWrapper');


const createRoom=()=>{
  const roomName=prompt('input room name:');

  if(roomNames.indexOf(roomName)!==-1) {
    alert('you can not create room with existing name');
    return
  }

  socket.emit('JOIN_ROOM', roomName)
  roomContainer.style.display='none';
}

function createRooms(rooms){
  console.log(rooms);

  const allRooms=rooms.map(createRoomCard);
  roomContainer.innerHTML="";
  roomContainer.append(...allRooms);
}

function joinRoomDone(roomName){
  alert(`you are in ${roomName}`)
}

createRoomButton.addEventListener('click',createRoom);
socket.on("UPDATE_ROOMS", createRooms);
socket.on("JOIN_ROOM_DONE", joinRoomDone);

function createRoomCard(room) {
  const {online:activeUsersAmount, name:roomName}=room;
  roomNames.push(roomName);

  const roomElement=createElement({
    tagName:'div',
    className:'room'
  });

  const roomUsers=createElement({
    tagName:'div',
    className:'roomUsers'
  });

  const roomNameElement=createElement({
    tagName:'div',
    className:'roomName'
  });

  const joinButton=createElement({
    tagName:'button',
    className:'joinButton'
  });

  const userString = activeUsersAmount > 1 ? 'users' : 'user';
  roomUsers.innerText=`${activeUsersAmount} ${userString} connected`;
  roomNameElement.innerText=roomName;

  joinButton.addEventListener('click',()=>{
    socket.emit('JOIN_ROOM', roomName);
    roomContainer.style.display='none';
    //redirect to game
  })
  joinButton.innerText="Join";

  roomElement.append(roomUsers, roomNameElement, joinButton);
  console.log(roomElement)
  return roomElement;
}
