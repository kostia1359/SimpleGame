import * as config from "./config";
import {IRoom} from "../types/room"
import {Server, Socket} from "socket.io";

const rooms: Map<string, string[]> = new Map();
const generateArray = (roomsMap: Map<string, string[]>): IRoom[] => {
    const rooms: IRoom[] = [];
    roomsMap.forEach((value, key) => {
        rooms.push({
            name: key,
            online: value.length.toString()
        })
    })

    return rooms;
}
const deleteUserFromRoom=(roomName:string, userName:string)=>{
    const users=rooms.get(roomName);

    const index=users!.indexOf(userName);
    users!.splice(index,1);
};

export default (io: Server) => {
    io.on('connection', (socket: Socket) => {
        const username:string = socket.handshake.query.username;

        socket.emit('UPDATE_ROOMS', generateArray(rooms));

        socket.on('JOIN_ROOM', (roomName: string) => {
            if(rooms.get(roomName)===undefined){
                rooms.set(roomName, [])
            }
            rooms.get(roomName)!.push(username);
            socket.join(roomName);

            socket.emit('JOIN_ROOM_DONE', roomName)
            io.emit('UPDATE_ROOMS', generateArray(rooms))
        })

        socket.on('LEAVE_ROOM', (roomName: string) => {
            deleteUserFromRoom(roomName,username);

            socket.leave(roomName);
            if(rooms.get(roomName)!.length===0){
                rooms.delete(roomName);
            }

            io.emit('UPDATE_ROOMS', generateArray(rooms))
        })

    });
};
