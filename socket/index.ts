import * as config from "./config";
import {IRoom} from "../types/room"
import {IUser} from "../types/user";
import {Server, Socket} from "socket.io";
import {texts} from "../data";


const rooms: Map<string, IUser[]> = new Map();
const timers: Map<string, NodeJS.Timeout>=new Map();
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
const textsSize=texts.length;

export default (io: Server) => {
    io.on('connection', (socket: Socket) => {
        const username:string = socket.handshake.query.username;

        socket.emit('UPDATE_ROOMS', generateArray(rooms));

        socket.on('JOIN_ROOM', (roomName: string) => {
            if(rooms.get(roomName)===undefined){
                rooms.set(roomName, [])
            }
            rooms.get(roomName)!.push({username,isReady:false, progress:0});
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

            if(isRoomReady(roomName)){
                let bigTimer=config.SECONDS_TIMER_BEFORE_START_GAME;
                let gameTimer=config.SECONDS_FOR_GAME;
                io.in(roomName).emit('BIG_TIMER',bigTimer);
                io.in(roomName).emit('TEXT_NUMBER',getRandomInt(textsSize));

                let gameTimerId:NodeJS.Timeout;
                const timerId=setInterval(()=>{
                    bigTimer--;
                    io.in(roomName).emit('BIG_TIMER',bigTimer);
                    if(bigTimer===0){
                        io.in(roomName).emit('GAME_TIMER',gameTimer);
                        gameTimerId=setInterval(()=>{
                            gameTimer--;
                            io.in(roomName).emit('GAME_TIMER',gameTimer);
                            if(gameTimer===0){
                                io.in(roomName).emit('GAME_FINISHED', rooms.get(roomName));
                                clearInterval(gameTimerId)
                            }
                        },1000)
                        timers.delete(roomName);
                        timers.set(roomName,gameTimerId);
                        clearInterval(timerId);
                    }
                }, 1000);
                timers.set(roomName,timerId)

            }
        })

        socket.on('PLAYER_NOT_READY',(roomName:string):void=>{
            const user=findUser(username,roomName);
            user.isReady=false;
            socket.to(roomName).emit('PLAYER_STATUS_UPDATE', user);
        })

        socket.on('SUCCESSFUL_LETTER',(roomName:string):void=>{
            const user=findUser(username,roomName);

            user!.progress++;
            io.in(roomName).emit('UPDATE_BARS', rooms.get(roomName));
        })

        socket.on('PLAYER_FINISHED', (roomName:string):void=>{
            const users=rooms.get(roomName)!;
            setNextWinner(roomName);

            if(isGameEnd(users)){
                const timer=timers.get(roomName);

                clearInterval(timer!);
                timers.delete(roomName);

                io.in(roomName).emit('GAME_FINISHED', users);
            }
        });

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
                if(timers.has(roomName)){
                    const timer=timers.get(roomName);
                    clearInterval(timer!);
                }
                rooms.delete(roomName);
            }

            io.emit('UPDATE_ROOMS', generateArray(rooms))
        }
        function isRoomReady(roomName:string) {
            const unReady=rooms.get(roomName)!.filter(user=>!user.isReady);

            return unReady.length===0;
        }
        function setNextWinner(roomname:string):void {
            const users=rooms.get(roomname)!;
            const notFinished=users.filter(user=>user.progress>-1);

            const currentWinner=findUser(username,roomname);

            currentWinner.progress=notFinished.length-users.length-1;

        }
    });

    function getRandomInt(max:number):number {
        return Math.floor(Math.random() * Math.floor(max));
    }

    function isGameEnd(users:IUser[]):boolean {
        const notFinished=users.filter(user=>user.progress>-1);

        return notFinished.length===0;
    }


};

