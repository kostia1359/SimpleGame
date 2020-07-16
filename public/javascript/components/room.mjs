import {roomNames} from "../data.mjs";
import {createDivElement, createElement} from "../helpers/domHelper.mjs";

export function createRoomCard(emitFunction, room) {
    const activeUsersAmount = room.online.length;
    const roomName = room.name;
    roomNames.push(roomName);

    const roomElement = createDivElement({
        className: 'room'
    })

    const roomUsers = createDivElement({
        className: 'roomUsers'
    });

    const roomNameElement = createDivElement({
        className: 'roomName'
    });

    const joinButton = createElement({
        tagName: 'button',
        className: 'joinButton'
    });

    const userString = activeUsersAmount > 1 ? 'users' : 'user';
    roomUsers.innerText = `${activeUsersAmount} ${userString} connected`;
    roomNameElement.innerText = roomName;

    joinButton.addEventListener('click', () => {
        emitFunction('JOIN_ROOM', roomName);
    })
    joinButton.innerText = "Join";

    roomElement.append(roomUsers, roomNameElement, joinButton);
    return roomElement;
}
