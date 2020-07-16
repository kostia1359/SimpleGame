export function hideElements(...elementsToHide) {
    elementsToHide.forEach(element => {
        element.classList.add('display-none');
    })
}

export function showElements(...elementsToShow) {
    elementsToShow.forEach(element => {
        element.classList.remove('display-none');
    })
}

export function hideAndShowElement(elementToHide, elementToShow) {
    elementToHide.classList.add('display-none');
    elementToShow.classList.remove('display-none');
}
