import {createRoomCard} from "../components/room.mjs";
import {roomNames, subscriptionHelper} from "../data.mjs";
import {hideAndShowElement} from "../helpers/classListHelper.mjs";
import {createUser} from "../components/user.mjs";
import {findPlayer, findRoom} from "../helpers/finders.mjs";
import Player from "../components/player.mjs";
import Event from "./event.mjs";

class RoomEvents extends Event{
    constructor(socket) {
        super(socket);
    }
    create=(rooms)=> {
        const roomContainer = document.getElementById('roomsWrapper');
        const createCard=createRoomCard.bind(this,this.socket.emit.bind(this.socket));

        roomNames.splice(0, roomNames.length);
        const allRooms = rooms.map(createCard);
        roomContainer.innerHTML = "";
        roomContainer.append(...allRooms);
    }
    joinDone=(room)=> {
        const playerView=new Player();
        const game = document.getElementById('game-page');
        const rooms = document.getElementById('rooms-page');

        subscriptionHelper.setNotifications('game');
        hideAndShowElement(rooms, game);
        const userContainer = document.querySelector('#game-page .gameUsersWrapper');
        const {name: roomName, online} = room;

        game.querySelector('.gameName').innerText = roomName;
        userContainer.innerHTML = '';

        const users = online.map(user => createUser(user.username));
        userContainer.append(...users);

        const socketOwner = findPlayer(this.username);
        socketOwner.classList.add('you');
        online.forEach(user => playerView.changeStatus(user));
    }

    hide(roomName) {
        findRoom(roomName).classList.add('display-none');
    }

    show(roomName) {
        findRoom(roomName).classList.remove('display-none');
    }

    badUserName() {
        alert('this userName is already in use');
        subscriptionHelper.removeNotifications('room');
        sessionStorage.removeItem("username");
        window.location.replace("/login");
    }

    addNotifications=()=> {
        subscriptionHelper.createGroup('room');

        subscriptionHelper.selectGroup('room').set("BAD_USERNAME", this.badUserName);
        subscriptionHelper.selectGroup('room').set("UPDATE_ROOMS", this.create);
        subscriptionHelper.selectGroup('room').set("JOIN_ROOM_DONE", this.joinDone);
        subscriptionHelper.selectGroup('room').set("HIDE_ROOM", this.hide);
        subscriptionHelper.selectGroup('room').set("SHOW_ROOM", this.show);
    }

}

export default RoomEvents;
