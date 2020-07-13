import * as config from "./config";
import {IRoom} from "../types/room"
import {IUser} from "../types/user";
import {Server, Socket} from "socket.io";
import {texts} from "../data";

const usernames:string[]=[];
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
        let isUsernameValid=false;

        if(usernames.indexOf(username)!==-1){
            socket.emit('BAD_USERNAME');
        }else{
            usernames.push(username);
            isUsernameValid=true;
        }

        socket.emit('UPDATE_ROOMS', generateArray(rooms));

        hideRoomsSelf();

        socket.on('JOIN_ROOM', (roomName: string) => {
            if(rooms.get(roomName)===undefined){
                rooms.set(roomName, [])
            }
            rooms.get(roomName)!.push({username,isReady:false, progress:0});

            socket.join(roomName);

            socket.emit('JOIN_ROOM_DONE', {name:roomName,online:rooms.get(roomName)})
            io.emit('UPDATE_ROOMS', generateArray(rooms));
            hideRooms();
            socket.to(roomName).emit('PLAYER_JOINED', username);

            if(rooms.get(roomName)!.length===config.MAXIMUM_USERS_FOR_ONE_ROOM){
                io.emit('HIDE_ROOM', roomName)
            }
        })

        socket.on('LEAVE_ROOM', (roomName:string):void=>{
            socket.to(roomName).emit('PLAYER_LEFT', username);

            if(rooms.get(roomName)!.length===config.MAXIMUM_USERS_FOR_ONE_ROOM-1){
                io.emit('SHOW_ROOM', roomName)
            }

            leaveFromRoom(roomName);
        })

        socket.on('PLAYER_READY',(roomName:string):void=>{
            const user=findUser(username,roomName);
            user.isReady=true;
            socket.to(roomName).emit('PLAYER_STATUS_UPDATE', user);

            startGameIfPossible(roomName);
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

                if(rooms.get(roomName)!.length!==config.MAXIMUM_USERS_FOR_ONE_ROOM){
                    io.emit('SHOW_ROOM', roomName)
                }
                finishGame(roomName);
            }
        });

        socket.on('disconnect',()=>{
            if(!isUsernameValid) return;
            rooms.forEach((users,roomName)=>{
                if(findUserIndex(username, roomName)!==-1){
                    socket.to(roomName).emit('PLAYER_LEFT', username);
                    leaveFromRoom(roomName);
                }
            })

            usernames.splice(usernames.indexOf(username),1);
        })
        function leaveFromRoom(roomName:string):void {
            deleteUserFromRoom(roomName,username);

            socket.leave(roomName);
            if(rooms.get(roomName)!.length===0){
                if(timers.has(roomName)){
                    const timer=timers.get(roomName);
                    clearInterval(timer!);
                    timers.delete(roomName);
                }
                rooms.delete(roomName);
            }else if(!timers.has(roomName)){
                startGameIfPossible(roomName);
            }


            io.emit('UPDATE_ROOMS', generateArray(rooms))
            hideRooms();
        }
        function isRoomReady(roomName:string) {
            const unReady=rooms.get(roomName)!.filter(user=>!user.isReady);

            return unReady.length===0;
        }
        function setNextWinner(roomName:string):void {
            const users=rooms.get(roomName)!;
            const notFinished=users.filter(user=>user.progress>-1);

            const currentWinner=findUser(username,roomName);

            currentWinner.progress=notFinished.length-users.length-1;

        }
        function startGameIfPossible(roomName:string):void{
            if(isRoomReady(roomName)){
                let bigTimer=config.SECONDS_TIMER_BEFORE_START_GAME;
                let gameTimer=config.SECONDS_FOR_GAME;

                io.emit('HIDE_ROOM', roomName)
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

                                if(rooms.get(roomName)!.length!==config.MAXIMUM_USERS_FOR_ONE_ROOM){
                                    io.emit('SHOW_ROOM', roomName)
                                }

                                finishGame(roomName);
                                timers.delete(roomName);
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

        }
        function finishGame(roomName:string):void {
            rooms.get(roomName)!.forEach(user=>{
                user.isReady=false;
                user.progress=0;

                io.in(roomName).emit('PLAYER_STATUS_UPDATE', user);
            })
            io.in(roomName).emit('UPDATE_BARS', rooms.get(roomName));
        }
        function hideRoomsSelf():void {
            rooms.forEach((users,roomName)=>{
                if(users.length===config.MAXIMUM_USERS_FOR_ONE_ROOM){
                    socket.emit('HIDE_ROOM', roomName);
                }
            })

            timers.forEach((timer, roomName)=>{
                socket.emit('HIDE_ROOM', roomName);
            })
        }
        function hideRooms():void {
            rooms.forEach((users,roomName)=>{
                if(users.length===config.MAXIMUM_USERS_FOR_ONE_ROOM){
                    io.emit('HIDE_ROOM', roomName);
                }
            })

            timers.forEach((timer, roomName)=>{
                io.emit('HIDE_ROOM', roomName);
            })
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

