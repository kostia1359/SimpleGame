import {IServer} from "../../types/server";

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
    }

    notifyOwner(event:string,data?:any):void{
        this.server.socket.emit(event, data);
    }

    selectRoom(roomName:string):IRoomNotification{
        const server=this.server;
        return {notifyAll,notifyExceptSender};
        function notifyExceptSender(event:string,data?:any) {
            server.socket.to(roomName).emit(event,data);
        }
        function notifyAll(event:string,data?:any) {
            server.io.in(roomName).emit(event,data);
        }
    }
}

export default EmitHelper;
