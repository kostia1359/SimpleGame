import {createElement} from "../helpers/domHelper.mjs";
import {showModal} from "../helpers/modal.mjs";
import {hideElements, showElements} from "../helpers/classListHelper.mjs";
import {findPlayer} from "../helpers/finders.mjs";


class Game {
    constructor(socket, username) {
        this.socket = socket;
        this.username = username;
        this.text = '';
        this.keyboardHandler = undefined;
    }

    getText = (textNumber) => {
        fetch(`http://localhost:3003/game/texts/${textNumber}`).then(res => res.json()).then(res => {
            this.text = res.text;
        })
    }

    start = () => {
        this.addGameEventListeners();

        const bigTimerElement = document.querySelector('#game-page .bigTimer');
        hideElements(bigTimerElement);

        const smallTimer = document.querySelector('#game-page .smallTimer');
        const textElement = document.getElementsByClassName('text')[0];
        showElements(smallTimer, textElement);
    }

    finish = (users) => {
        document.removeEventListener('keydown', this.keyboardHandler);

        showWinner();

        function showWinner() {
            const ol = createElement({tagName: 'ol'});

            users.filter(user => user.progress < 0)
                .sort((user1, user2) => user2.progress - user1.progress)
                .forEach(createWinnerModal);

            users.filter(user => user.progress >= 0)
                .sort((user1, user2) => user2.progress - user1.progress)
                .forEach(createWinnerModal);

            showModal({
                title: "Congratulation",
                bodyElement: ol,
                onClose: resetView
            })

            function resetView() {
                hideGameElements();
                showControlElements();
            }

            function hideGameElements() {
                const smallTimer = document.querySelector('#game-page .smallTimer');
                const textElement = document.getElementsByClassName('text')[0];
                hideElements(smallTimer, textElement);

                const completedTextElement = textElement.getElementsByClassName('completedText')[0]
                completedTextElement.innerText = '';
            }

            function showControlElements() {
                const returnButton = document.querySelector('#game-page .returnButton');
                const readyButton = document.querySelector('#game-page .readyButton');
                showElements(returnButton, readyButton);
            }

            function createWinnerModal(user) {
                const li = createElement({tagName: 'li'});
                li.innerText = user.username;
                ol.append(li);
            }
        }
    }

    addGameEventListeners = () => {
        let textPosition = 0;
        const text = this.text;
        const socket = this.socket

        const textElement = document.getElementsByClassName('text')[0];

        const unCompletedTextElement = document.getElementsByClassName('unCompletedText')[0]
        const completedTextElement = textElement.getElementsByClassName('completedText')[0]
        const decoratedTextElement = textElement.getElementsByClassName('decoratedText')[0]

        decoratedTextElement.innerText = text[0];
        unCompletedTextElement.innerText = text.slice(1);

        this.keyboardHandler = function (keyEvent) {
            if (keyEvent.repeat) return;
            if (keyEvent.key.toLowerCase() === text[textPosition].toLowerCase()) {
                socket.emit('SUCCESSFUL_LETTER')
                fillTypedText();

                function fillTypedText() {
                    const typedLetter = decoratedTextElement.innerText === '\xa0' ? ' ' : decoratedTextElement.innerText;
                    decoratedTextElement.innerText = text[textPosition + 1] === ' ' ? '\xa0' : text[textPosition + 1];

                    if (decoratedTextElement.innerText === 'undefined' || decoratedTextElement.innerText === undefined) {
                        decoratedTextElement.innerText = ' ';
                    }

                    completedTextElement.innerText += typedLetter;
                    textPosition++;
                    if (text[textPosition + 1] === ' ') {
                        unCompletedTextElement.innerText = '\xa0' + text.slice(textPosition + 1);
                    } else {
                        unCompletedTextElement.innerText = text.slice(textPosition + 1);
                    }
                }
            }
        }

        document.addEventListener('keydown', this.keyboardHandler);

    }

    updateBars = (users) => {
        users.forEach(user => {
            const userScale = findPlayer(user.username).parentNode.getElementsByClassName('successIndicator')[0];
            const part = Math.floor((user.progress / this.text.length) * 100);

            fillBars(part);

            if (user.username === this.username && part === 100) {
                this.socket.emit('PLAYER_FINISHED');
            }

            function fillBars(part) {
                if (part === 0) {
                    userScale.style.background = '#c7fc00';
                }

                if (part === 100) {
                    userScale.style.background = 'green';
                }
                userScale.style.width = `${part >= 0 ? part : 100}%`;
            }
        }, this)

    }
}

export default Game;
