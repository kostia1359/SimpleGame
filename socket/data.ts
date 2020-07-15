import {IUser} from "../types/user";

export const usernames:string[]=[];
export const rooms: Map<string, IUser[]> = new Map();
export const timers: Map<string, NodeJS.Timeout>=new Map();
