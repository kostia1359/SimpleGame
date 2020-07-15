import {IUser} from "../../types/user";
import {IRoom} from "../../types/room";

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
