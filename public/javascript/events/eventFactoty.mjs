import RoomEvents from "./roomEvents.mjs";
import GameEvents from "./gameEvents.mjs";

class EventFactory {
    constructor(type, socket) {
        if(type==="room"){
            return new RoomEvents(socket);
        }
        if(type==="game"){
            return new GameEvents(socket);
        }
    }
}

export default EventFactory;
