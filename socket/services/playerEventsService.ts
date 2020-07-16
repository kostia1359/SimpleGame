import BaseService from "./baseService";
import {IServer} from "../../types/server";
import GameService from "./gameService";
import userService from "./userService";
import {rooms} from "../data";
import {getCurrentRoomId} from "../helpers/roomHelpers";

class PlayerEventsService extends BaseService {
    private gameService: GameService;

    constructor(Server: IServer) {
        super(Server);
        this.gameService = new GameService(Server);
    }

    readyStatus = () => {
        const roomName = getCurrentRoomId(this.server.socket)!;

        const player = userService.find(this.username, roomName);
        player.isReady = true;
        this.emitHelper.selectRoom(roomName).notifyExceptSender('PLAYER_STATUS_UPDATE', player);

        this.gameService.startGameIfPossible(roomName);
    }

    notReadyStatus = () => {
        const roomName = getCurrentRoomId(this.server.socket)!;

        const player = userService.find(this.username, roomName);
        player.isReady = false;
        this.emitHelper.selectRoom(roomName).notifyExceptSender('PLAYER_STATUS_UPDATE', player);
    }

    finishedStatus = () => {
        const roomName = getCurrentRoomId(this.server.socket)!;

        const users = rooms.get(roomName)!;
        this.setNextWinner(roomName);

        if (this.gameService.isGameFinished(users)) {
            this.gameService.finishGame(roomName);
        }
    }

    private setNextWinner(roomName: string): void {
        const users = rooms.get(roomName)!;
        const notFinished = users.filter(user => user.progress > -1);

        const currentWinner = userService.find(this.username, roomName);

        currentWinner.progress = notFinished.length - users.length - 1;
    }

    successfulInput = (): void => {
        const roomName = getCurrentRoomId(this.server.socket)!;

        const player = userService.find(this.username, roomName);

        player!.progress++;
        this.emitHelper.selectRoom(roomName).notifyAll('PLAYER_PROGRESS_UPDATE', rooms.get(roomName));
    }
}

export default PlayerEventsService;
