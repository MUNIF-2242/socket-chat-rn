const express = require("express");
const app = express();
const http = require("http").Server(app);
const cors = require("cors");
const socketIO = require("socket.io")(http, {
  cors: {
    origin: "http://192.168.0.102:3000/",
  },
});

const PORT = 4000;

function createUniqueId() {
  return Math.random().toString(20).substring(2, 10);
}

let chatgroups = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

socketIO.on("connection", (socket) => {
  console.log(`${socket.id} user is just connected`);

  socket.on("error", (error) => {
    console.error("Socket Error:", error);
  });

  socket.on("getAllGroups", () => {
    socket.emit("groupList", chatgroups);
  });

  socket.on("createNewGroup", (currentGroupName) => {
    //console.log(currentGroupName);
    chatgroups.unshift({
      id: chatgroups.length + 1,
      currentGroupName,
      messages: [],
    });
    socketIO.emit("groupList", chatgroups);
    //console.log(chatgroups);
  });

  socket.on("findGroup", (id) => {
    const filteredGroup = chatgroups.filter((item) => item.id === id);
    socket.emit("foundGroup", filteredGroup[0].messages);
  });

  socket.on("newChatMessage", (data) => {
    const { currentChatMesage, groupIdentifier, currentUser, timeData } = data;
    const filteredGroup = chatgroups.filter(
      (item) => item.id === groupIdentifier
    );
    const newMessage = {
      id: createUniqueId(),
      text: currentChatMesage,
      currentUser,
      time: `${timeData.hr}:${timeData.mins}`,
    };

    socket
      .to(filteredGroup[0].currentGroupName)
      .emit("groupMessage", newMessage);
    filteredGroup[0].messages.push(newMessage);
    socketIO.emit("groupList", chatgroups);
    socketIO.emit("foundGroup", filteredGroup[0].messages);
  });
});

app.get("/api", (req, res) => {
  res.json(chatgroups);
});

http.listen(PORT, () => {
  console.log(`Server is listeing on ${PORT}`);
});
