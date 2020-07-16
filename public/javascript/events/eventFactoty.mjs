import RoomEvents from "./roomEvents.mjs";
import GameEvents from "./gameEvents.mjs";
import BotEvents from "./botEvents.mjs";

class EventFactory {
    constructor(type, socket) {
        if (type === "room") {
            return new RoomEvents(socket);
        }
        if (type === "game") {
            return new GameEvents(socket);
        }
        if (type === "bot") {
            return new BotEvents(socket);
        }
    }
}

export default EventFactory;
