import Player from "./player.mjs";
import {roomNames, subscriptionHelper} from "../data.mjs";
import {hideAndShowElement} from "../helpers/classListHelper.mjs";
import EventFactory from "../events/eventFactoty.mjs";

class Main {
    constructor(socket) {
        this.socket=socket;
    }

    createEventListeners=()=> {
        const username=sessionStorage.getItem("username");
        const playerView=new Player();
        const socket=this.socket;

        const returnButton = document.querySelector('#game-page .returnButton');
        returnButton.addEventListener('click', returnButtonEvent);

        function returnButtonEvent() {
            const game = document.getElementById('game-page');
            const rooms = document.getElementById('rooms-page');
            socket.emit("LEAVE_ROOM");

            subscriptionHelper.removeNotifications('game');
            hideAndShowElement(game, rooms);
        }

        const readyButton = document.querySelector('#game-page .readyButton');
        readyButton.addEventListener('click', readyButtonEvent);

        function readyButtonEvent() {
            socket.emit("PLAYER_READY");

            const user = {username, isReady: true}
            playerView.changeStatus(user);
            document.querySelector('.returnButton').classList.add('display-none');
            hideAndShowElement(readyButton, notReadyButton);
        }

        const notReadyButton = document.querySelector('#game-page .readyButton.display-none');
        notReadyButton.addEventListener('click', notReadyButtonEvent);

        function notReadyButtonEvent() {
            socket.emit("PLAYER_NOT_READY");

            const user = {username, isReady: false}
            playerView.changeStatus(user);
            document.querySelector('.returnButton').classList.remove('display-none');
            hideAndShowElement(notReadyButton, readyButton);
        }

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
    }

    addSubscriptions=()=>{
        const roomEvents=new EventFactory('room',this.socket);
        const gameEvents=new EventFactory('game',this.socket);

        subscriptionHelper.build(this.socket);
        roomEvents.addNotifications();
        gameEvents.addNotifications();
    }

    enableInitialNotifications(){
        subscriptionHelper.setNotifications('room');

    }

    prepareMainPage=()=>{
        this.addSubscriptions();
        this.enableInitialNotifications();
        this.createEventListeners();
    }
}

//Facade pattern

export default Main;
