import {IServer} from "../../types/server";
import BotService from "../services/botService";

interface IRoomNotification {
    notifyAll:Function,
    notifyExceptSender:Function
}


class EmitHelper {
    private readonly server: IServer;
    constructor(Server:IServer) {
        this.server=Server;
    }

    notifyAll(event:string,data:any):void{
        this.server.io.emit(event,data);
        const sendData=(event:string,data:any)=>{
            this.server.io.emit(event,data);
        }
        BotService.receiveNotification({
            sendData,
            data,
            event
        })
    }

    notifyOwner(event:string,data?:any):void{
        this.server.socket.emit(event, data);
        const sendData=(event:string,data:any)=>{
            this.server.socket.emit(event, data);
        }
        BotService.receiveNotification({
            sendData,
            data,
            event
        })
    }

    selectRoom(roomName:string):IRoomNotification{
        const server=this.server;
        return {notifyAll,notifyExceptSender};
        function notifyExceptSender(event:string,data?:any) {
            server.socket.to(roomName).emit(event,data);
            const sendData=(event:string,data:any)=>{
                server.socket.to(roomName).emit(event,data);
            }
            BotService.receiveNotification({
                sendData,
                data,
                roomName,
                event
            })
        }
        function notifyAll(event:string,data?:any) {
            server.io.in(roomName).emit(event,data);
            const sendData=(event:string,data:any)=>{
                server.io.in(roomName).emit(event,data);
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
