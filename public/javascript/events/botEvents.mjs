import Event from "./event.mjs";
import {subscriptionHelper} from "../data.mjs";
class BotEvents extends Event{
    constructor(socket) {
        super(socket);
    }

    addNotifications = () => {
        subscriptionHelper.createGroup('bot');

        subscriptionHelper.selectGroup('bot').set("COMMENT", this.comment);
    }

    comment=(commentary)=>{
        const commentaryElement=document.querySelector('.botInfo p');

        commentaryElement.innerText=commentary;
    }


}

export default BotEvents;
