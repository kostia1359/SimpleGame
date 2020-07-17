import {IUser} from "../types/user";

interface roomData {
    timers: NodeJS.Timeout[],
    textLength: number,
    lastEventTime: number,
    startRace?: number
}

export const usernames: string[] = [];
export const rooms: Map<string, IUser[]> = new Map();
export const timers: Map<string, NodeJS.Timeout> = new Map();
export const botRooms: Map<string, roomData> = new Map();
