import * as config from "./config";
import {IServer} from "../types/server";
import {Server, Socket} from "socket.io";
import {usernames, rooms} from "./data";
import userService from "./services/userService";
import EmitHelper from "./helpers/emitHelper";
import RoomViewService from "./services/roomViewService";
import RoomsService from "./services/roomService";
import PlayerEventsService from "./services/playerEventsService";
import {getCurrentRoomId} from "./helpers/roomHelpers";

export default (io: Server) => {
    io.on('connection', (socket: Socket) => {
        const Server: IServer = {
            io,
            socket
        };

        const roomsService = new RoomsService(Server)
        const emitHelper = new EmitHelper(Server);
        const playerEventsService = new PlayerEventsService(Server);

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
            roomsService.addUser(roomName);

            emitHelper.notifyOwner('JOIN_ROOM_DONE', {name: roomName, online: rooms.get(roomName)});

            RoomViewService.update(emitHelper.notifyAll.bind(emitHelper));

            emitHelper.selectRoom(roomName).notifyExceptSender('PLAYER_JOINED', username);

            if (rooms.get(roomName)!.length === config.MAXIMUM_USERS_FOR_ONE_ROOM) {
                emitHelper.notifyAll('HIDE_ROOM', roomName)
            }
        })

        socket.on('LEAVE_ROOM', (): void => {
            const roomName = getCurrentRoomId(socket)!;

            emitHelper.selectRoom(roomName).notifyExceptSender('PLAYER_LEFT', username);

            if (rooms.get(roomName)!.length === config.MAXIMUM_USERS_FOR_ONE_ROOM - 1) {
                emitHelper.notifyAll('SHOW_ROOM', roomName)
            }

            roomsService.leave(roomName);
        })

        socket.on('PLAYER_READY', playerEventsService.readyStatus)

        socket.on('PLAYER_NOT_READY', playerEventsService.notReadyStatus)

        socket.on('SUCCESSFUL_LETTER', playerEventsService.successfulInput)

        socket.on('PLAYER_FINISHED', playerEventsService.finishedStatus);

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

    });


};

