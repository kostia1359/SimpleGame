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
        this.jokeDelay = 5500;

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
                    const room = botRooms.get(notification.roomName!)!;
                    this.announcePlayers(notification.roomName!, notification.sendData);
                    room.startRace = Date.now();

                    const jokeTimer: NodeJS.Timeout = setInterval(() => {
                        this.tellJoke(notification.sendData, notification.roomName!);
                    }, this.jokeDelay);
                    room.timers.push(jokeTimer);

                    const regularTimer:NodeJS.Timeout=setInterval(()=>{
                        this.regularUpdate(notification.sendData, notification.roomName!);
                    },this.regularNotificationTimeout)
                    room.timers.push(regularTimer);
                }
                break;
            case 'GET_RANDOM_TEXT_NUMBER':
                botRooms.set(notification.roomName!, {
                    textLength: texts[notification.data].length,
                    lastEventTime: Date.now(),
                    timers: []
                })
                break;
            case 'PLAYER_PROGRESS_UPDATE':
                const length = botRooms.get(notification.roomName!)!.textLength;
                const activeUsers: IUser[] = notification.data
                    .filter((user: IUser) =>
                        Date.now() - user.lastSymbolDate < this.epsilon
                    )
                    .sort((userA: IUser, userB: IUser) => userA.lastSymbolDate - userB.lastSymbolDate);

                const potentialWinners = activeUsers
                    .filter(user => length - user.progress === this.symbolsBeforeFinishNotification);

                if (potentialWinners.length !== 0) {
                    this.notifyAboutPotentialWinners(notification.sendData, potentialWinners[0]);
                }

                const winners = activeUsers
                    .filter(user => length - user.progress === 0)

                if (winners.length !== 0) {
                    this.winnerNotification(notification.sendData, winners[0]);
                }

                if (winners.length !== 0 || potentialWinners.length !== 0) {
                    this.updateLastEventTime(notification.roomName!);
                }
                break;
            case 'GAME_FINISHED':
                const timers = botRooms.get(notification.roomName!)!.timers;
                timers.forEach(timer => clearInterval(timer));
                this.endGame(notification.sendData, notification.data, notification.roomName!);
        }
    }

    endGame = (sendCb: Function, users: IUser[], roomName: string) => {
        const winners: IUser[] = this.getWinners(users);

        const commentary = [];
        const room = botRooms.get(roomName)!;
        for (let i = 0; i < 3 && i < winners.length; ++i) {
            const user = winners[i];
            if (user.progress >= 0) {
                commentary.push(`игрок ${user.username} занял ${i + 1} место так и не закончив гонку`);
            } else {
                const time = user.lastSymbolDate - room.startRace!;
                commentary.push(`игрок ${user.username} занял ${i + 1} место и потратил ${Math.floor(time / 1000)} секунд`);
            }
        }
        sendCb('COMMENT', commentary.join(','));
    }

    regularUpdate = (sendCb: Function, roomName: string) => {
        this.updateLastEventTime(roomName);
        const users = rooms.get(roomName)!;
        const winners = this.getWinners(users);

        const notFinished: IUser[] = winners
            .filter(user => user.progress > 0)
            .sort((user1, user2) => user2.progress - user1.progress);
        const commentary = [];
        for (let i = 0; i < winners.length; ++i) {
            commentary.push(`${winners[i].username} сейчас на ${i + 1} месте`);
        }
        if (notFinished.length > 1) {
            commentary.push(`между ${notFinished[0].username} и ${notFinished[1].username} сейчас ${Math.abs(notFinished[0].progress - notFinished[1].progress)}`);
        }

        sendCb('COMMENT', commentary.join(','));
    }

    private getWinners = (users: IUser[]): IUser[] => {
        const winners: IUser[] = [];
        users.filter(user => user.progress < 0)
            .sort((user1, user2) => user2.progress - user1.progress)
            .forEach(user => winners.push(user));

        users.filter(user => user.progress >= 0)
            .sort((user1, user2) => user2.progress - user1.progress)
            .forEach(user => winners.push(user));

        return winners;
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

    winnerNotification = (sendCb: Function, user: IUser) => {
        const comment = `${user.username} закончил гонку`;

        sendCb('COMMENT', comment);

    }

    updateLastEventTime(roomName: string) {
        const room = botRooms.get(roomName)!;
        room.lastEventTime = Date.now();
    }

    tellJoke = (sendCb: Function, roomName: string) => {
        const lastEventTime = botRooms.get(roomName)!.lastEventTime;
        if (Date.now() - lastEventTime < this.jokeDelay) return;
        const joke = this.getRandomInt(botData.jokes.length);

        sendCb('COMMENT', botData.jokes[joke]);
    }

    private getRandomInt(max: number): number {
        return Math.floor(Math.random() * Math.floor(max));
    }

}

export default new BotService();
