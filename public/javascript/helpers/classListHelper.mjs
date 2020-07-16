export function hideElements(...elementsToHide) {
    elementsToHide.forEach(element=>{
        element.classList.add('display-none');
    })
}

export function showElements(...elementsToShow) {
    elementsToShow.forEach(element=>{
        element.classList.remove('display-none');
    })
}
