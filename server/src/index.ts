import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import chatRoutes from "./routes/chats";
import User from "./models/User";
import Message from "./models/Message";
import Conversation from "./models/Conversation";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);

// Store socket connections
const userSockets = new Map<string, string>(); // userId -> socketId

// WebSocket setup
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // User goes online
  socket.on("userOnline", async (userId: string) => {
    try {
      userSockets.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      // Notify all users that this user is online
      socket.broadcast.emit("userStatusChange", { userId, isOnline: true });
      console.log(`User ${userId} is online`);
    } catch (err) {
      console.error("Error setting user online:", err);
    }
  });

  // User goes offline
  socket.on("userOffline", async (userId: string) => {
    try {
      userSockets.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      socket.broadcast.emit("userStatusChange", { userId, isOnline: false });
      console.log(`User ${userId} is offline`);
    } catch (err) {
      console.error("Error setting user offline:", err);
    }
  });

  // Send message
  socket.on("sendMessage", async (data: {
    from: string;
    to: string;
    content: string;
    conversationId?: string;
    type?: string;
    timestamp?: Date;
  }) => {
    try {
      console.log("Message received:", data);
      
      // Find or create conversation
      let conversation;
      if (data.conversationId) {
        conversation = await Conversation.findById(data.conversationId);
      }
      
      if (!conversation) {
        conversation = await Conversation.findOne({
          isGroup: false,
          participants: { $all: [data.from, data.to], $size: 2 }
        });
      }

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [data.from, data.to],
          isGroup: false
        });
      }

      // Create message
      const message = await Message.create({
        conversationId: conversation._id,
        sender: data.from,
        content: data.content,
        type: data.type || "text"
      });

      // Update conversation
      conversation.lastMessage = message._id as any;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name username avatar");

      const messageData = {
        ...populatedMessage!.toObject(),
        conversationId: conversation._id.toString(),
        from: data.from,
        to: data.to,
      };

      // Emit to recipient if online
      const recipientSocketId = userSockets.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveMessage", messageData);
        console.log(`Message sent to recipient ${data.to}`);
      } else {
        console.log(`Recipient ${data.to} is offline, message saved for later`);
      }

      // Emit back to sender for confirmation
      socket.emit("messageSent", messageData);
      console.log(`Message confirmation sent to sender ${data.from}`);
    } catch (err) {
      console.error("Error sending message:", err);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  // Typing indicator
  socket.on("typing", (data: { to: string; isTyping: boolean }) => {
    const recipientSocketId = userSockets.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("userTyping", {
        userId: data.to,
        isTyping: data.isTyping
      });
    }
  });

  // Mark message as read
  socket.on("markAsRead", async (data: { messageId: string; userId: string }) => {
    try {
      const message = await Message.findByIdAndUpdate(
        data.messageId,
        { read: true, readAt: new Date() },
        { new: true }
      );

      if (message) {
        // Notify sender
        const senderSocketId = userSockets.get(message.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageRead", { messageId: data.messageId });
        }
      }
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  });

  socket.on("disconnect", async () => {
    console.log("🔴 Client disconnected:", socket.id);
    // Find user by socket ID and set offline
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        try {
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
          socket.broadcast.emit("userStatusChange", { userId, isOnline: false });
          userSockets.delete(userId);
        } catch (err) {
          console.error("Error on disconnect:", err);
        }
        break;
      }
    }
  });
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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
