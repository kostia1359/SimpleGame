class Event {
    constructor(socket) {
        this.socket = socket;
        this.username = sessionStorage.getItem("username");
    }

    addNotifications() {
    }
}

export default Event;
