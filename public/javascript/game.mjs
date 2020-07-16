import Main from "./components/main.mjs";

const username = sessionStorage.getItem("username");

if (!username) {
    window.location.replace("/login");
}

const socket = io("", {query: {username}});

const main=new Main(socket);

main.prepareMainPage();

