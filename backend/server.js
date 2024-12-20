const express = require("express");
const http = require("http");

const app = express();

app.use(express.json());  

const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

const boards = []; 

io.on("connection", (socket) => {

  socket.on("userJoined", (message) => {

    console.log("User joined:", message);

    // message = JSON.parse(message); // Parse the string if necessary
    if (typeof message === "string") {
      try {
        message = JSON.parse(message); // Parse the string if necessary
      } catch (error) {
        console.error("Error parsing message:", error);
        return;
      }
    }

    console.log("roomId:", message.roomId);

    const board = boards.find((board) => board.roomId === message.roomId);

    if (board) {
      const userExists = board.users.find((user) => user.userId === message.userId);
      if (!userExists) {
        board.users.push({
          name: message.name,
          userId: message.userId,
        });
      }
      socket.join(message.roomId);
    } else {
      boards.push({
        roomId: message.roomId,
        users: [
          {
            userId: message.userId,
            name: message.name,
          },
        ],
      });
      socket.join(message.roomId);
      console.log("Socket rooms after join:", socket.rooms); 
    }
  });

  // Handle reDraw event
  socket.on("reDraw", (data) => {
    try {
      const message = typeof data === "string" ? JSON.parse(data) : data;
  
      if (!message.user || !message.user.roomId) {
        console.error("Invalid data structure:", message);
        return;
      }
  
      const board = boards.find((board) => board.roomId === message.user.roomId);
      if (board) {
        console.log("Broadcasting reDraw to room:", board.roomId);
        socket.to(board.roomId).emit("reDraw", message.elements);
      } else {
        console.error("Board not found for roomId:", message.user.roomId);
      }
    } catch (error) {
      console.error("Error processing reDraw event:", error.message);
    }
  });
  
});

server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
