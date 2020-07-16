import {IServer} from "../../types/server";
import EmitHelper from "../helpers/emitHelper";

class BaseService {
    protected server: IServer;
    protected emitHelper: EmitHelper;
    protected username: string;

    constructor(Server: IServer) {
        this.server = Server;
        this.emitHelper = new EmitHelper(Server);
        this.username = Server.socket.handshake.query.username;
    }
}

export default BaseService;
