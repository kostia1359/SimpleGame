export function findPlayer(userName) {
    const players = Array.from(document.querySelectorAll('#game-page .gameUser .userName'));

    return players.filter(player => player.innerText === userName)[0];
}

export function findRoom(roomName) {
    const roomContainer = document.getElementById('roomsWrapper');
    const rooms = Array.from(roomContainer.querySelectorAll('.room .roomName'));

    for (let room of rooms) {
        const name = room.innerText;

        if (roomName === name) return room.parentNode;
    }
}
