import Event from "./event.mjs";
import {subscriptionHelper} from "../data.mjs";
import Game from "../components/game.mjs";
import Player from "../components/player.mjs";
import {hideAndShowElement} from "../helpers/classListHelper.mjs";

class GameEvents extends Event{
    constructor(socket) {
        super(socket);
        this.playerView=new Player();
        this.gameView=new Game(socket, this.username);
    }

    preGameTimer=(timer)=> {
        const timerElement = document.querySelector('#game-page .bigTimer');
        const notReadyButton = document.getElementsByClassName('readyButton')[1];

        if (!notReadyButton.classList.contains('display-none')) {
            hideAndShowElement(notReadyButton, timerElement);
        }

        timerElement.innerText = timer.toString();

        if (Number(timer) === 0) {
            this.gameView.start();
        }
    }

    gameTimer=(timer)=> {
        const smallTimer = document.querySelector('#game-page .smallTimer');

        smallTimer.innerText = `${timer} second${timer > 1 ? 's' : ''} left`;
    }

    addNotifications=()=> {
        subscriptionHelper.createGroup('game');

        subscriptionHelper.selectGroup('game').set('PLAYER_STATUS_UPDATE', this.playerView.changeStatus);
        subscriptionHelper.selectGroup('game').set('PLAYER_LEFT', this.playerView.deletePlayer);
        subscriptionHelper.selectGroup('game').set('PLAYER_JOINED', this.playerView.addPlayer);
        subscriptionHelper.selectGroup('game').set('PRE_GAME_TIMER', this.preGameTimer);
        subscriptionHelper.selectGroup('game').set('GET_RANDOM_TEXT_NUMBER', this.gameView.getText);
        subscriptionHelper.selectGroup('game').set('GAME_TIMER', this.gameTimer);
        subscriptionHelper.selectGroup('game').set('PLAYER_PROGRESS_UPDATE', this.gameView.updateBars);
        subscriptionHelper.selectGroup('game').set('GAME_FINISHED', this.gameView.finish);
    }
}

export default GameEvents;
