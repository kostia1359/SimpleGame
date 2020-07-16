import {IServer} from "../../types/server";
import BaseService from "./baseService";
import {rooms, timers} from "../data";
import {texts} from "../../data";
import * as config from "../config";
import {IUser} from "../../types/user";

class GameService extends BaseService {
    constructor(server: IServer) {
        super(server);
    }

    areAllPlayersReady(roomName: string) {
        const notReady = rooms.get(roomName)!.filter(user => !user.isReady);

        return notReady.length === 0;
    }

    startGame(roomName: string): void {
        let bigTimer = config.SECONDS_TIMER_BEFORE_START_GAME;
        let gameTimer = config.SECONDS_FOR_GAME;

        this.sendStartGameNotifications(roomName);

        const timerId = setInterval(() => {
            bigTimer--;
            this.emitHelper.selectRoom(roomName).notifyAll('PRE_GAME_TIMER', bigTimer);
            if (bigTimer === 0) {
                this.emitHelper.selectRoom(roomName).notifyAll('GAME_TIMER', gameTimer);
                const gameTimerId: NodeJS.Timeout = setInterval(() => {
                    gameTimer--;
                    this.emitHelper.selectRoom(roomName).notifyAll('GAME_TIMER', gameTimer);
                    if (gameTimer === 0) {
                        this.finishGame(roomName)
                    }
                }, 1000)
                timers.delete(roomName);
                timers.set(roomName, gameTimerId);
                clearInterval(timerId);
            }
        }, 1000);
        timers.set(roomName, timerId)

    }

    private sendStartGameNotifications(roomName: string): void {
        const textsSize = texts.length;

        this.emitHelper.notifyAll('HIDE_ROOM', roomName)
        this.emitHelper.selectRoom(roomName).notifyAll('PRE_GAME_TIMER', config.SECONDS_TIMER_BEFORE_START_GAME);
        this.emitHelper.selectRoom(roomName).notifyAll('GET_RANDOM_TEXT_NUMBER', this.getRandomInt(textsSize));

    }

    private getRandomInt(max: number): number {
        return Math.floor(Math.random() * Math.floor(max));
    }

    startGameIfPossible(roomName: string): void {
        console.log(this.areAllPlayersReady(roomName));
        if (this.areAllPlayersReady(roomName)) {
            this.startGame(roomName);
        }

    }

    finishGame(roomName: string): void {
        const users = rooms.get(roomName)!;
        this.emitHelper.selectRoom(roomName).notifyAll('GAME_FINISHED', users);

        if (rooms.get(roomName)!.length !== config.MAXIMUM_USERS_FOR_ONE_ROOM) {
            this.emitHelper.notifyAll('SHOW_ROOM', roomName)
        }

        this.resetRoomInformation(roomName);

    }

    resetRoomInformation(roomName: string): void {
        this.resetUsersStatus(roomName)
        this.resetTimer(roomName);
    }

    private resetUsersStatus(roomName: string): void {
        rooms.get(roomName)!.forEach(user => {
            user.isReady = false;
            user.progress = 0;

            this.emitHelper.selectRoom(roomName).notifyAll('PLAYER_STATUS_UPDATE', user);
        })
        this.emitHelper.selectRoom(roomName).notifyAll('PLAYER_PROGRESS_UPDATE', rooms.get(roomName));
    }

    private resetTimer(roomName: string): void {
        const timer = timers.get(roomName);

        clearInterval(timer!);
        timers.delete(roomName);
    }

    isGameFinished(users: IUser[]): boolean {
        const notFinished = users.filter(user => user.progress > -1);

        return notFinished.length === 0;
    }

}

export default GameService;
