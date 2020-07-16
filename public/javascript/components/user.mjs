import {createDivElement} from "../helpers/domHelper.mjs";

export function createUser(userName) {
    const userElement = createDivElement({
        className: 'gameUser'
    })

    const userNameElement = createDivElement({
        className: 'userName'
    });
    userNameElement.innerText = userName;

    const userScale = createDivElement({
        className: 'userScale'
    })

    const userSuccessIndicator = createDivElement({
        className: 'successIndicator'
    });

    userScale.append(userSuccessIndicator);
    userElement.append(userNameElement, userScale);
    return userElement;
}
