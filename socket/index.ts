import * as config from "./config";
import {IServer} from "../types/server";
import {Server, Socket} from "socket.io";
import {usernames, rooms} from "./data";
import userService from "./services/userService";
import EmitHelper from "./helpers/emitHelper";
import GameService from "./services/gameService";
import RoomViewService from "./services/roomViewService";
import RoomsService from "./services/roomService";

export default (io: Server) => {
    io.on('connection', (socket: Socket) => {
        const Server: IServer = {
            io,
            socket
        };

        const gameService = new GameService(Server);
        const roomsService = new RoomsService(Server)
        const emitHelper = new EmitHelper(Server);

        const username: string = socket.handshake.query.username;
        let isUsernameValid = false;

        if (usernames.indexOf(username) !== -1) {
            emitHelper.notifyOwner('BAD_USERNAME');
        } else {
            usernames.push(username);
            isUsernameValid = true;
        }

        RoomViewService.update(emitHelper.notifyOwner.bind(emitHelper));

        socket.on('JOIN_ROOM', (roomName: string) => {
            if (rooms.get(roomName) === undefined) {
                rooms.set(roomName, [])
            }
            rooms.get(roomName)!.push({username, isReady: false, progress: 0});

            socket.join(roomName);

            emitHelper.notifyOwner('JOIN_ROOM_DONE', {name: roomName, online: rooms.get(roomName)});

            RoomViewService.update(emitHelper.notifyAll.bind(emitHelper));

            emitHelper.selectRoom(roomName).notifyExceptSender('PLAYER_JOINED', username);

            if (rooms.get(roomName)!.length === config.MAXIMUM_USERS_FOR_ONE_ROOM) {
                emitHelper.notifyAll('HIDE_ROOM', roomName)
            }
        })

        socket.on('LEAVE_ROOM', (roomName: string): void => {
            emitHelper.selectRoom(roomName).notifyExceptSender('PLAYER_LEFT', username);

            if (rooms.get(roomName)!.length === config.MAXIMUM_USERS_FOR_ONE_ROOM - 1) {
                emitHelper.notifyAll('SHOW_ROOM', roomName)
            }

            roomsService.leave(roomName);
        })

        socket.on('PLAYER_READY', (roomName: string): void => {
            const user = userService.find(username, roomName);
            user.isReady = true;
            emitHelper.selectRoom(roomName).notifyExceptSender('PLAYER_STATUS_UPDATE', user);

            gameService.startGameIfPossible(roomName);
        })

        socket.on('PLAYER_NOT_READY', (roomName: string): void => {
            const user = userService.find(username, roomName);
            user.isReady = false;
            emitHelper.selectRoom(roomName).notifyExceptSender('PLAYER_STATUS_UPDATE', user);
        })

        socket.on('SUCCESSFUL_LETTER', (roomName: string): void => {
            const user = userService.find(username, roomName);

            user!.progress++;
            emitHelper.selectRoom(roomName).notifyAll('UPDATE_BARS', rooms.get(roomName));
        })

        socket.on('PLAYER_FINISHED', (roomName: string): void => {
            const users = rooms.get(roomName)!;
            setNextWinner(roomName);

            if (gameService.isGameFinished(users)) {
                gameService.finishGame(roomName);
            }
        });

        socket.on('disconnect', () => {
            if (!isUsernameValid) return;
            rooms.forEach((users, roomName) => {
                if (userService.findIndex(username, roomName) !== -1) {
                    emitHelper.selectRoom(roomName).notifyExceptSender('PLAYER_LEFT', username);
                    roomsService.leave(roomName);
                }
            })

            usernames.splice(usernames.indexOf(username), 1);
        })

        function setNextWinner(roomName: string): void {
            const users = rooms.get(roomName)!;
            const notFinished = users.filter(user => user.progress > -1);

            const currentWinner = userService.find(username, roomName);

            currentWinner.progress = notFinished.length - users.length - 1;

        }
    });


};

