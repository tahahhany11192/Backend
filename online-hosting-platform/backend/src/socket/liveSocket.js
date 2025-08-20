const { Server } = require("socket.io");

class LiveSocket {
  constructor(server) {
    this.io = new Server(server);
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      socket.on("join-session", (sessionId) => {
        socket.join(sessionId);
        console.log(`User ${socket.id} joined session ${sessionId}`);
        this.io.to(sessionId).emit("user-connected", socket.id);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        this.io.emit("user-disconnected", socket.id);
      });

      socket.on("stream", (data) => {
        const { sessionId, stream } = data;
        socket.to(sessionId).emit("stream", { stream, userId: socket.id });
      });
    });
  }
}

module.exports = LiveSocket;