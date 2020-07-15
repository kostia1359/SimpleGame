import {rooms} from "../data";
import {IUser} from "../../types/user";

class UserService {
    constructor() {

    }

    findIndex(userName: string, roomName: string): number {
        const users = rooms.get(roomName);

        if (users === undefined) return -1;

        for (let i = 0; i < users.length; ++i) {
            let user = users[i];
            if (user.username === userName) return i;
        }

        return -1;
    }

    find(username: string, roomName: string): IUser {
        return rooms.get(roomName)![this.findIndex(username, roomName)];
    }

}

export default new UserService();
