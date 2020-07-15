import {Server, Socket} from "socket.io";

export interface IServer {
    io:Server,
    socket:Socket
}
