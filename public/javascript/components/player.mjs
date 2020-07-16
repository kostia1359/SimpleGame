import {findPlayer} from "../helpers/finders.mjs";
import {createUser} from "./user.mjs";

class Player {
    constructor() {
        this.userContainer = document.querySelector('#game-page .gameUsersWrapper');
    }

    changeStatus(user) {
        const {username: userName, isReady} = user;
        const player = findPlayer(userName);

        if (isReady) {
            player.classList.add('ready');
        } else {
            player.classList.remove('ready');
        }
    }

    deletePlayer(userName) {
        const player = findPlayer(userName);

        player.parentNode.parentNode.removeChild(player.parentNode);
    }

    addPlayer = (userName) => {
        this.userContainer.append(createUser(userName));
    }
}

export default Player;
