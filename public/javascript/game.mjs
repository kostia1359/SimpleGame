import {createElement} from "./helpers/domHelper.mjs";
import {showModal} from "./helpers/modal.mjs";

const username = sessionStorage.getItem("username");

if (!username) {
    window.location.replace("/login");
}

const socket = io("", {query: {username}});

let text;
let keyboardHandler;


const roomNames = [];//changing while updating
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
socketGameEvents.set('PRE_GAME_TIMER', bigTimer);
socketGameEvents.set('GET_RANDOM_TEXT_NUMBER', getText);
socketGameEvents.set('GAME_TIMER', smallTimer);
socketGameEvents.set('PLAYER_PROGRESS_UPDATE', updateBars);
socketGameEvents.set('GAME_FINISHED', finishGame);


const createRoom = () => {
    const roomName = prompt('input room name:');

    if (roomNames.indexOf(roomName) !== -1) {
        alert('you can not create room with existing name');
        return
    }

    socket.emit('JOIN_ROOM', roomName)
}

function createRooms(rooms) {
    roomNames.splice(0, roomNames.length);
    const allRooms = rooms.map(createRoomCard);
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

function createRoomCard(room) {
    const activeUsersAmount = room.online.length;
    const roomName = room.name;
    roomNames.push(roomName);

    const roomElement = createElement({
        tagName: 'div',
        className: 'room'
    });

    const roomUsers = createElement({
        tagName: 'div',
        className: 'roomUsers'
    });

    const roomNameElement = createElement({
        tagName: 'div',
        className: 'roomName'
    });

    const joinButton = createElement({
        tagName: 'button',
        className: 'joinButton'
    });

    const userString = activeUsersAmount > 1 ? 'users' : 'user';
    roomUsers.innerText = `${activeUsersAmount} ${userString} connected`;
    roomNameElement.innerText = roomName;

    joinButton.addEventListener('click', () => {
        socket.emit('JOIN_ROOM', roomName);
    })
    joinButton.innerText = "Join";

    roomElement.append(roomUsers, roomNameElement, joinButton);
    return roomElement;
}

function createUser(userName) {

    const userElement = createElement({
        tagName: 'div',
        className: 'gameUser'
    })

    const userNameElement = createElement({
        tagName: 'div',
        className: 'userName'
    });
    userNameElement.innerText = userName;

    const userScale = createElement({
        tagName: 'div',
        className: 'userScale'
    })

    const userSuccessIndicator = createElement({
        tagName: 'div',
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

function findPlayer(userName) {
    const players = Array.from(document.querySelectorAll('#game-page .gameUser .userName'));

    return players.filter(player => player.innerText === userName)[0];
}

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

function bigTimer(timer) {
    const timerElement = document.querySelector('#game-page .bigTimer');
    const notReadyButton = document.getElementsByClassName('readyButton')[1];

    if (!notReadyButton.classList.contains('display-none')) {
        hideAndShowElement(notReadyButton, timerElement);
    }

    timerElement.innerText = timer.toString();

    if (Number(timer) === 0) {
        startGame();
    }
}

function getText(textNumber) {
    fetch(`http://localhost:3003/game/texts/${textNumber}`).then(res => res.json()).then(res => {
        text = res.text;
    })
}

function addGameEventListeners() {
    let textPosition = 0;

    const textElement = document.getElementsByClassName('text')[0];

    const unCompletedTextElement = document.getElementsByClassName('unCompletedText')[0]
    const completedTextElement = textElement.getElementsByClassName('completedText')[0]
    const decoratedTextElement = textElement.getElementsByClassName('decoratedText')[0]

    decoratedTextElement.innerText = text[0];
    unCompletedTextElement.innerText = text.slice(1);

    keyboardHandler = function (keyEvent) {
        if (keyEvent.repeat) return;
        if (keyEvent.key.toLowerCase() === text[textPosition].toLowerCase()) {
            console.log(keyEvent.key);
            socket.emit('SUCCESSFUL_LETTER')
            let typedLetter = decoratedTextElement.innerText === '\xa0' ? ' ' : decoratedTextElement.innerText;
            decoratedTextElement.innerText = text[textPosition + 1] === ' ' ? '\xa0' : text[textPosition + 1];

            if (decoratedTextElement.innerText === 'undefined' || decoratedTextElement.innerText === undefined) {
                decoratedTextElement.innerText = ' ';
            }

            completedTextElement.innerText += typedLetter;
            textPosition++;
            if (text[textPosition + 1] === ' ') {
                unCompletedTextElement.innerText = '\xa0' + text.slice(textPosition + 1);
            } else {
                unCompletedTextElement.innerText = text.slice(textPosition + 1);
            }

        }
    }

    document.addEventListener('keydown', keyboardHandler);

}

function startGame() {
    addGameEventListeners();

    const bigTimerElement = document.querySelector('#game-page .bigTimer');
    bigTimerElement.classList.add('display-none');

    const smallTimer = document.querySelector('#game-page .smallTimer');
    smallTimer.classList.remove('display-none');

    const textElement = document.getElementsByClassName('text')[0];
    textElement.classList.remove('display-none');
}

function smallTimer(timer) {
    const smallTimer = document.querySelector('#game-page .smallTimer');

    smallTimer.innerText = `${timer} second${timer > 1 ? 's' : ''} left`;
}

function updateBars(users) {
    users.forEach(user => {
        const userScale = findPlayer(user.username).parentNode.getElementsByClassName('successIndicator')[0];

        const part = Math.floor((user.progress / text.length) * 100);

        if (part === 0) {
            userScale.style.background = '#c7fc00';

        }
        if (part === 100) {
            userScale.style.background = 'green';
            if (user.username === username) {
                socket.emit('PLAYER_FINISHED');
            }
        }
        userScale.style.width = `${part >= 0 ? part : 100}%`;
    })
}

function badUserName() {
    alert('this userName is already in use');
    removeSocketSubscriptions(socketRoomEvents);
    sessionStorage.removeItem("username");
    window.location.replace("/login");
}

function finishGame(users) {
    document.removeEventListener('keydown', keyboardHandler);

    showWinner();

    function showWinner() {
        const ol = createElement({tagName: 'ol'});

        users.filter(user => user.progress < 0)
            .sort((user1, user2) => user2.progress - user1.progress)
            .forEach(createUser);

        users.filter(user => user.progress >= 0)
            .sort((user1, user2) => user2.progress - user1.progress)
            .forEach(createUser);

        showModal({
            title: "Congratulation",
            bodyElement: ol,
            onClose: showButton
        })

        function showButton() {
            const returnButton = document.querySelector('#game-page .returnButton');
            returnButton.classList.remove('display-none');

            const smallTimer = document.querySelector('#game-page .smallTimer');
            smallTimer.classList.add('display-none');

            const textElement = document.getElementsByClassName('text')[0];
            textElement.classList.add('display-none');

            const completedTextElement = textElement.getElementsByClassName('completedText')[0]
            completedTextElement.innerText = '';

            const readyButton = document.querySelector('#game-page .readyButton');
            readyButton.classList.remove('display-none');
        }

        function createUser(user) {
            const li = createElement({tagName: 'li'});
            li.innerText = user.username;
            ol.append(li);
        }
    }
}

function findRoom(roomName) {
    const rooms = Array.from(roomContainer.querySelectorAll('.room .roomName'));

    for (let room of rooms) {
        const name = room.innerText;

        if (roomName === name) return room.parentNode;
    }
}

function hideRoom(roomName) {
    findRoom(roomName).classList.add('display-none');
}

function showRoom(roomName) {
    findRoom(roomName).classList.remove('display-none');
}

