import {rooms, timers} from "../data";
import {IServer} from "../../types/server";
import userService from "./userService";
import BaseService from "./baseService";
import RoomViewService from "./roomViewService";
import GameService from "./gameService";

enum RoomConditions {
    deleteRoom="deleteRoom",
    startGame="startGame",
    finishGame="finishGame",
    nothingToDo="nothingToDo"
}

class RoomsService extends BaseService{
    private gameService: GameService;
    constructor(Server:IServer) {
        super(Server);
        this.gameService=new GameService(Server);
    }

    deleteUser(roomName:string, userName:string){
        const users=rooms.get(roomName);
        const index=userService.findIndex(userName,roomName);

        if(index===-1) throw Error('-1');

        users!.splice(index,1);
    };

    leave(roomName:string):void {
        this.deleteUser(roomName,this.username);

        this.server.socket.leave(roomName);
        const condition=this.detectCondition(roomName);
        switch (condition) {
            case RoomConditions.deleteRoom:
                if(timers.has(roomName)){
                    this.deleteTimer(roomName);
                }
                rooms.delete(roomName);
                break;
            case RoomConditions.startGame:
                this.gameService.startGame(roomName);
                break;
            case RoomConditions.finishGame:
                this.gameService.finishGame(roomName);
                break;
        }

        RoomViewService.update(this.emitHelper.notifyAll.bind(this.emitHelper));
    }

    private detectCondition(roomName:string):RoomConditions{
        if(rooms.get(roomName)!.length===0){
            return RoomConditions.deleteRoom;
        }else {
            if (!timers.has(roomName)&&this.gameService.areAllPlayersReady(roomName)) {
                return RoomConditions.startGame
            }else{
                if(this.gameService.isGameFinished(rooms.get(roomName)!)){
                    return RoomConditions.finishGame;
                }
            }
        }
        return RoomConditions.nothingToDo;
    }

    private deleteTimer(roomName:string):void{
        const timer=timers.get(roomName);
        clearInterval(timer!);
        timers.delete(roomName);
    }

}

export default RoomsService;
