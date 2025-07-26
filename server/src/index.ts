import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";

dotenv.config();
const app = express();
const server = http.createServer(app); // ← use HTTP server for socket
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // update with frontend domain later
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// WebSocket setup
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("sendMessage", (data) => {
    console.log("Message received:", data);
    io.emit("receiveMessage", data); // broadcast to all clients
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// DB and Server start
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("✅ MongoDB connected");
    const port = process.env.PORT || 4000;
    server.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
