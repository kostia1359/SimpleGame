import {createDivElement} from "./helpers/domHelper.mjs";
import {roomNames} from "./data.mjs";
import {createRoomCard} from "./components/room.mjs";
import{findPlayer,findRoom} from "./helpers/finders.mjs";
import Game from "./components/game.mjs";


const username = sessionStorage.getItem("username");

if (!username) {
    window.location.replace("/login");
}

const socket = io("", {query: {username}});

const gameView=new Game(socket, username);

const userContainer = document.querySelector('#game-page .gameUsersWrapper');
const roomContainer = document.getElementById('roomsWrapper');
const rooms = document.getElementById('rooms-page');
const game = document.getElementById('game-page');

const socketRoomEvents = new Map();
socketRoomEvents.set("BAD_USERNAME", badUserName);
socketRoomEvents.set("UPDATE_ROOMS", createRooms);
socketRoomEvents.set("JOIN_ROOM_DONE", joinRoomDone);
socketRoomEvents.set("HIDE_ROOM", hideRoom);
socketRoomEvents.set("SHOW_ROOM", showRoom);

const socketGameEvents = new Map();
socketGameEvents.set('PLAYER_STATUS_UPDATE', changePlayersStatus);
socketGameEvents.set('PLAYER_LEFT', deletePlayer);
socketGameEvents.set('PLAYER_JOINED', addPlayer);
socketGameEvents.set('PRE_GAME_TIMER', runPreGameTimer);
socketGameEvents.set('GET_RANDOM_TEXT_NUMBER', gameView.getText);
socketGameEvents.set('GAME_TIMER', smallTimer);
socketGameEvents.set('PLAYER_PROGRESS_UPDATE', gameView.updateBars);
socketGameEvents.set('GAME_FINISHED', gameView.finish);

function createRooms(rooms) {
    const createCard=createRoomCard.bind(this,socket.emit.bind(socket));

    roomNames.splice(0, roomNames.length);
    const allRooms = rooms.map(createCard);
    roomContainer.innerHTML = "";
    roomContainer.append(...allRooms);
}

function joinRoomDone(room) {
    setSocketSubscriptions(socketGameEvents);
    hideAndShowElement(rooms, game);
    const {name: roomName, online} = room;

    game.querySelector('.gameName').innerText = roomName;
    userContainer.innerHTML = '';

    const users = online.map(user => createUser(user.username));
    userContainer.append(...users);
    const socketOwner = findPlayer(username);
    socketOwner.classList.add('you');
    online.forEach(user => changePlayersStatus(user));
}

setSocketSubscriptions(socketRoomEvents);

function createUser(userName) {

    const userElement = createDivElement({
        className: 'gameUser'
    })

    const userNameElement = createDivElement({
        className: 'userName'
    });
    userNameElement.innerText = userName;

    const userScale = createDivElement({
        className: 'userScale'
    })

    const userSuccessIndicator = createDivElement({
        className: 'successIndicator'
    });

    userScale.append(userSuccessIndicator);
    userElement.append(userNameElement, userScale);
    return userElement;
}

function hideAndShowElement(elementToHide, elementToShow) {
    elementToHide.classList.add('display-none');
    elementToShow.classList.remove('display-none');
}

(function createEventListeners() {
    const returnButton = document.querySelector('#game-page .returnButton');
    returnButton.addEventListener('click', returnButtonEvent);

    const readyButton = document.querySelector('#game-page .readyButton');
    readyButton.addEventListener('click', readyButtonEvent);

    const notReadyButton = document.querySelector('#game-page .readyButton.display-none');
    notReadyButton.addEventListener('click', notReadyButtonEvent);

    const createRoomButton = document.getElementById('createRooms');
    createRoomButton.addEventListener('click', createRoom);
    function createRoom() {
        const roomName = prompt('input room name:');
        if (!roomName) return;

        if (roomNames.indexOf(roomName) !== -1) {
            alert('you can not create room with existing name');
            return
        }

        socket.emit('JOIN_ROOM', roomName)
    }


    function readyButtonEvent() {
        socket.emit("PLAYER_READY");

        const user = {username, isReady: true}
        changePlayersStatus(user);
        document.querySelector('.returnButton').classList.add('display-none');
        hideAndShowElement(readyButton, notReadyButton);
    }

    function notReadyButtonEvent() {
        socket.emit("PLAYER_NOT_READY");

        const user = {username, isReady: false}
        changePlayersStatus(user);
        document.querySelector('.returnButton').classList.remove('display-none');
        hideAndShowElement(notReadyButton, readyButton);
    }

    function returnButtonEvent() {
        socket.emit("LEAVE_ROOM");

        removeSocketSubscriptions(socketGameEvents);
        hideAndShowElement(game, rooms);
    }
})();

function changePlayersStatus(user) {
    const {username: userName, isReady} = user;
    const player = findPlayer(userName);

    if (isReady) {
        player.classList.add('ready');
    } else {
        player.classList.remove('ready');
    }
}

function deletePlayer(userName) {
    const player = findPlayer(userName);

    player.parentNode.parentNode.removeChild(player.parentNode);
}

function setSocketSubscriptions(subscriptionMap) {
    subscriptionMap.forEach((fn, event) => {
        socket.on(event, fn);
    })
}

function removeSocketSubscriptions(subscriptionMap) {
    subscriptionMap.forEach((fn, event) => {
        socket.off(event, fn);
    })
}

function addPlayer(userName) {
    userContainer.append(createUser(userName));
}

function runPreGameTimer(timer) {
    const timerElement = document.querySelector('#game-page .bigTimer');
    const notReadyButton = document.getElementsByClassName('readyButton')[1];

    if (!notReadyButton.classList.contains('display-none')) {
        hideAndShowElement(notReadyButton, timerElement);
    }

    timerElement.innerText = timer.toString();

    if (Number(timer) === 0) {
        gameView.start();
    }
}


function smallTimer(timer) {
    const smallTimer = document.querySelector('#game-page .smallTimer');

    smallTimer.innerText = `${timer} second${timer > 1 ? 's' : ''} left`;
}


function badUserName() {
    alert('this userName is already in use');
    removeSocketSubscriptions(socketRoomEvents);
    sessionStorage.removeItem("username");
    window.location.replace("/login");
}

function hideRoom(roomName) {
    findRoom(roomName).classList.add('display-none');
}

function showRoom(roomName) {
    findRoom(roomName).classList.remove('display-none');
}

