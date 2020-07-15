import {rooms, timers} from "../data";
import * as config from "../config";
import {convertRoomsToArray} from "../helpers/roomHelpers";

class RoomViewService {
    constructor() {
    }
     private static hideRooms(emitFunction:Function):void {
        rooms.forEach((users,roomName)=>{
            if(users.length===config.MAXIMUM_USERS_FOR_ONE_ROOM){
                emitFunction('HIDE_ROOM', roomName);
            }
        })

        timers.forEach((timer, roomName)=>{
            emitFunction('HIDE_ROOM', roomName);
        })
    }

    static update(emitFunction:Function){
        emitFunction('UPDATE_ROOMS', convertRoomsToArray(rooms));
        this.hideRooms(emitFunction);
    }

}

export default RoomViewService;
