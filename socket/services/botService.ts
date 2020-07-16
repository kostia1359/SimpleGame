import {IServer} from "../../types/server";
import {botData} from "../../botData";
import {rooms} from "../data";
import {INotification} from "../../types/notification";

class BotService {
    private server: IServer;
    constructor(server:IServer) {
        this.server=server;
    }

    receiveNotification(notification:INotification){
        const event=notification.event;
        switch (event) {
            case 'JOIN_ROOM_DONE':
                this.sayHello(notification.sendData);
                break;
            case 'PRE_GAME_TIMER':
                if(notification.data===0){
                    this.announcePlayers(notification.roomName!,notification.sendData);
                }
                break;

        }
    }

    sayHello=(sendCb:Function)=>{
        sendCb('COMMENT', botData.greetings);
    }

    announcePlayers=(roomName:string, sendCb:Function)=>{
        // const roomName=getCurrentRoomId(this.server.socket)!;
        const comment=rooms.get(roomName)!.map(user=>user.username)
            .map(username=>`${username} на ${botData.userCars[this.getRandomInt(botData.userCars.length)]}`)
            .join(', ').concat(' стартовали');

        sendCb('COMMENT', comment);
    }

    private getRandomInt(max: number): number {
        return Math.floor(Math.random() * Math.floor(max));
    }

}

export default BotService;
