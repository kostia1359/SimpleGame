import {IServer} from "../../types/server";
import BotService from "../services/botService";
import {INotification} from "../../types/notification";

interface IRoomNotification {
    notifyAll:Function,
    notifyExceptSender:Function
}


class EmitHelper {
    private readonly server: IServer;
    private readonly botService: BotService;
    constructor(Server:IServer) {
        this.server=Server;
        this.botService=new BotService(Server);
    }

    notifyAll=(event:string,data:any):void=>{
        this.server.io.emit(event,data);
        this.botService.receiveNotification({
            sendData:this.server.io.emit.bind(this.server.io),
            data,
            event
        })
    }

    notifyOwner=(event:string,data?:any):void=>{
        this.server.socket.emit(event, data);
        this.botService.receiveNotification({
            sendData:this.server.socket.emit.bind(this.server.socket),
            data,
            event
        })
    }

    selectRoom=(roomName:string):IRoomNotification=>{
        const botService=this.botService;
        const server=this.server;
        return {notifyAll,notifyExceptSender};
        function notifyExceptSender(event:string,data?:any) {
            server.socket.to(roomName).emit(event,data);
            botService.receiveNotification({
                sendData:server.socket.to(roomName).emit.bind(server.socket.to(roomName)),
                data,
                roomName,
                event
            })
        }
        function notifyAll(event:string,data?:any) {
            server.io.in(roomName).emit(event,data);
            botService.receiveNotification({
                sendData:server.io.in(roomName).emit.bind(server.io.in(roomName)),
                data,
                roomName,
                event
            })
        }
    }
}

export default EmitHelper;
