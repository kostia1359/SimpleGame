import * as config from "./config";
import {IRoom} from "../types/room"
import {IUser} from "../types/user";
import {Server, Socket} from "socket.io";

const rooms: Map<string, IUser[]> = new Map();
const generateArray = (roomsMap: Map<string, IUser[]>): IRoom[] => {
    const rooms: IRoom[] = [];
    roomsMap.forEach((value, key) => {
        rooms.push({
            name: key,
            online: value
        })
    })

    return rooms;
}
const findUserIndex=(userName:string, roomName:string):number=>{
    const users=rooms.get(roomName);

    if(users===undefined) return -1;

    for(let i=0;i<users.length;++i){
        let user=users[i];
        if(user.username===userName) return i;
    }

    return -1;
}
const findUser=(username:string,roomName:string):IUser=>{
    const user=rooms.get(roomName)![findUserIndex(username,roomName)];

    return user;
}
const deleteUserFromRoom=(roomName:string, userName:string)=>{
    const users=rooms.get(roomName);
    const index=findUserIndex(userName,roomName);

    if(index===-1) throw Error('-1');

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
            rooms.get(roomName)!.push({username,isReady:false});
            socket.join(roomName);

            socket.emit('JOIN_ROOM_DONE', {name:roomName,online:rooms.get(roomName)})
            io.emit('UPDATE_ROOMS', generateArray(rooms));
            socket.to(roomName).emit('PLAYER_JOINED', username);
        })

        socket.on('LEAVE_ROOM', (roomName:string):void=>{
            socket.to(roomName).emit('PLAYER_LEFT', username);

            leaveFromRoom(roomName);
        })
        socket.on('PLAYER_READY',(roomName:string):void=>{
            const user=findUser(username,roomName);
            user.isReady=true;
            socket.to(roomName).emit('PLAYER_STATUS_UPDATE', user);
        })
        socket.on('PLAYER_NOT_READY',(roomName:string):void=>{
            const user=findUser(username,roomName);
            user.isReady=false;
            socket.to(roomName).emit('PLAYER_STATUS_UPDATE', user);
        })

        socket.on('disconnect',()=>{
            rooms.forEach((users,roomName)=>{
                if(findUserIndex(username, roomName)!==-1){
                    socket.to(roomName).emit('PLAYER_LEFT', username);
                    leaveFromRoom(roomName);
                }
            })
        })
        function leaveFromRoom(roomName:string):void {
            deleteUserFromRoom(roomName,username);

            socket.leave(roomName);
            if(rooms.get(roomName)!.length===0){
                rooms.delete(roomName);
            }

            io.emit('UPDATE_ROOMS', generateArray(rooms))
        }
    });

};

