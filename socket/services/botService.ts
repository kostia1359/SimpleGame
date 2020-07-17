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
                    const room = botRooms.get(notification.roomName!)!;
                    this.announcePlayers(notification.roomName!, notification.sendData);
                    room.startRace = Date.now();

                    const jokeTimer: NodeJS.Timeout = setInterval(() => {
                        this.tellJoke(notification.sendData, notification.roomName!);
                    }, this.jokeDelay);
                    room.timers.push(jokeTimer);
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
        const winners: IUser[] = [];
        users.filter(user => user.progress < 0)
            .sort((user1, user2) => user2.progress - user1.progress)
            .forEach(user => winners.push(user));

        users.filter(user => user.progress >= 0)
            .sort((user1, user2) => user2.progress - user1.progress)
            .forEach(user => winners.push(user));

        const commentary = [];
        const room = botRooms.get(roomName)!;
        for (let i = 0; i < 3 && i < winners.length; ++i) {
            const user = winners[i];
            const time = user.progress > 0 ? Date.now() - room.startRace! : user.lastSymbolDate - room.startRace!;
            commentary.push(`игрок ${user.username} занял ${i + 1} место и потратил ${Math.floor(time / 1000)} секунд`);
        }
        sendCb('COMMENT', commentary.join(','));
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
