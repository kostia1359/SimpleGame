import {IServer} from "../../types/server";
import {IUser} from "../../types/user";
import {botData} from "../../botData";
import {rooms, botRooms} from "../data";
import {texts} from "../../data";
import {INotification} from "../../types/notification";

class BotService {
    private textLength: number;
    private regularNotificationTimeout: number;
    private symbolsBeforeFinishNotification: number;
    private epsilon: number;
    private jokeDelay: number;

    constructor() {
        this.symbolsBeforeFinishNotification = 3;
        this.regularNotificationTimeout = 30 * 1000;
        this.epsilon = 100;
        this.jokeDelay = 5000;

        this.textLength = 0;
    }

    receiveNotification = (notification: INotification) => {
        const event = notification.event;
        switch (event) {
            case 'JOIN_ROOM_DONE':
                this.sayHello(notification.sendData);
                break;
            case 'PRE_GAME_TIMER':
                if (notification.data === 0) {
                    this.announcePlayers(notification.roomName!, notification.sendData);

                    setInterval(this.tellJoke,this.jokeDelay, notification.sendData, notification.roomName);
                }
                break;
            case 'GET_RANDOM_TEXT_NUMBER':
                botRooms.set(notification.roomName!, {
                    textLength: texts[notification.data].length,
                    lastEventTime: Date.now()
                })
                break;
            case 'PLAYER_PROGRESS_UPDATE':
                const length = botRooms.get(notification.roomName!)!.textLength;
                const users: IUser[] = notification.data
                    .filter((user: IUser) =>
                        length - user.progress === this.symbolsBeforeFinishNotification &&
                        Date.now()-user.lastSymbolDate<this.epsilon
                    )
                    .sort((userA: IUser, userB: IUser) => userA.lastSymbolDate - userB.lastSymbolDate);
                if (users.length !== 0) {
                    this.updateLastEventTime(notification.roomName!);
                    this.notifyAboutPotentialWinners(notification.sendData, users[0]);
                }
                break;
        }
    }

    sayHello = (sendCb: Function) => {
        sendCb('COMMENT', botData.greetings);
    }

    announcePlayers = (roomName: string, sendCb: Function) => {
        const comment = rooms.get(roomName)!.map(user => user.username)
            .map(username => `${username} на ${botData.userCars[this.getRandomInt(botData.userCars.length)]}`)
            .join(', ').concat(' стартовали');

        sendCb('COMMENT', comment);
    }

    notifyAboutPotentialWinners = (sendCb: Function, user: IUser) => {
        const comment = `${user.username} осталось ${this.symbolsBeforeFinishNotification} символов`;

        sendCb('COMMENT', comment);

    }

    updateLastEventTime(roomName: string) {
        const room = botRooms.get(roomName)!;
        room.lastEventTime = Date.now();
    }

    tellJoke = (sendCb: Function, roomName: string) => {
        const lastEventTime = botRooms.get(roomName)!.lastEventTime;
        console.log(Date.now() - lastEventTime < this.jokeDelay);
        if (Date.now() - lastEventTime < this.jokeDelay) return;
        const joke = this.getRandomInt(botData.jokes.length);

        sendCb('COMMENT', botData.jokes[joke]);
    }

    private getRandomInt(max: number): number {
        return Math.floor(Math.random() * Math.floor(max));
    }

}

export default BotService;
