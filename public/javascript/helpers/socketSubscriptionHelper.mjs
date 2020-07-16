class SocketSubscriptionHelper {
    constructor() {
        this.groups=new Map();
    }
    build(socket){
        this.socket=socket;

    }

    createGroup=(groupName)=>{
        this.groups.set(groupName,new Map());
    }

    selectGroup=(groupName)=>{
        const groupMap=this.groups.get(groupName);
        return{
            set:function (event, cb) {
                groupMap.set(event,cb);
            }
        }
    }

    setNotifications=(groupName)=>{
        this.doGroupAction(groupName,this.socket.on.bind(this.socket));
    }

    removeNotifications=(groupName)=>{
        this.doGroupAction(groupName,this.socket.off.bind(this.socket));
    }

    doGroupAction=(groupName, cb)=>{
        const subscriptionMap=this.groups.get(groupName);

        subscriptionMap.forEach((fn, event) => {
            cb(event, fn);
        })
    }
}

export default SocketSubscriptionHelper;
