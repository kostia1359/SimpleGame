import {IUser} from "../../types/user";
import {IRoom} from "../../types/room";
import {Socket} from "socket.io"
import {rooms} from "../data";

export const convertRoomsToArray = (roomsMap: Map<string, IUser[]>): IRoom[] => {
    const rooms: IRoom[] = [];
    roomsMap.forEach((value, key) => {
        rooms.push({
            name: key,
            online: value
        })
    })

    return rooms;
}

export const getCurrentRoomId = (socket:Socket) => Object.keys(socket.rooms).find(roomId => rooms.has(roomId));
