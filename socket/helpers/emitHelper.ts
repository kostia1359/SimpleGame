import {IServer} from "../../types/server";
import BotService from "../services/botService";

interface IRoomNotification {
    notifyAll: Function,
    notifyExceptSender: Function
}


class EmitHelper {
    private readonly server: IServer;

    constructor(Server: IServer) {
        this.server = Server;
    }

    notifyAllClear(event: string, data: any): void {
        this.server.io.emit(event, data);
    }

    notifyAll = new Proxy(this.notifyAllClear, {
        apply(target: any, thisArg: any, argArray?: any): any {
            target.apply(thisArg, argArray);
            const sendData = (event: string, data: any) => {
                target.apply(thisArg, [event, data]);
            }
            BotService.receiveNotification({
                sendData,
                data: argArray[1],
                event: argArray[0]
            })
        }
    })

    notifyOwner(event: string, data?: any): void {
        this.server.socket.emit(event, data);
        const sendData = (event: string, data: any) => {
            this.server.socket.emit(event, data);
        }
        BotService.receiveNotification({
            sendData,
            data,
            event
        })
    }

    selectRoom(roomName: string): IRoomNotification {
        const server = this.server;
        return {notifyAll, notifyExceptSender};

        function notifyExceptSender(event: string, data?: any) {
            server.socket.to(roomName).emit(event, data);
            const sendData = (event: string, data: any) => {
                server.socket.to(roomName).emit(event, data);
            }
            BotService.receiveNotification({
                sendData,
                data,
                roomName,
                event
            })
        }

        function notifyAll(event: string, data?: any) {
            server.io.in(roomName).emit(event, data);
            const sendData = (event: string, data: any) => {
                server.io.in(roomName).emit(event, data);
            }
            BotService.receiveNotification({
                sendData,
                data,
                roomName,
                event
            })
        }
    }
}

export default EmitHelper;
