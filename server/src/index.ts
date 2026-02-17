import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import chatRoutes from "./routes/chats";
import postRoutes from "./routes/posts";
import storyRoutes from "./routes/stories";
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

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/stories", storyRoutes);

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
        type: data.type || "text",
        delivered: false
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

      // For group chats, send to all participants except sender
      if (conversation.isGroup) {
        conversation.participants.forEach((participantId: any) => {
          if (participantId.toString() !== data.from) {
            const recipientSocketId = userSockets.get(participantId.toString());
            if (recipientSocketId) {
              io.to(recipientSocketId).emit("receiveMessage", messageData);
            }
          }
        });
      } else {
        // Emit to recipient if online
        const recipientSocketId = userSockets.get(data.to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receiveMessage", messageData);
          
          // Mark as delivered
          await Message.findByIdAndUpdate(message._id, {
            delivered: true,
            deliveredAt: new Date()
          });
          console.log(`Message sent to recipient ${data.to}`);
        } else {
          console.log(`Recipient ${data.to} is offline, message saved for later`);
        }
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
  socket.on("typing", (data: { conversationId: string; userId: string; isTyping: boolean }) => {
    const conversation = Conversation.findById(data.conversationId).then((conv) => {
      if (conv) {
        // Send typing indicator to all participants except sender
        conv.participants.forEach((participantId: any) => {
          if (participantId.toString() !== data.userId) {
            const recipientSocketId = userSockets.get(participantId.toString());
            if (recipientSocketId) {
              io.to(recipientSocketId).emit("userTyping", {
                conversationId: data.conversationId,
                userId: data.userId,
                isTyping: data.isTyping
              });
            }
          }
        });
      }
    });
  });

  // Mark message as read
  socket.on("markAsRead", async (data: { messageId: string; userId: string }) => {
    try {
      const message = await Message.findById(data.messageId);
      
      if (message) {
        // Check if user already read this message
        const alreadyRead = message.readBy?.some(
          (r: any) => r.user.toString() === data.userId
        );

        if (!alreadyRead) {
          await Message.findByIdAndUpdate(data.messageId, {
            $push: {
              readBy: {
                user: data.userId,
                readAt: new Date()
              }
            }
          });

          // Notify sender and all participants
          const conversation = await Conversation.findById(message.conversationId);
          if (conversation) {
            conversation.participants.forEach((participantId: any) => {
              const socketId = userSockets.get(participantId.toString());
              if (socketId) {
                io.to(socketId).emit("messageRead", {
                  messageId: data.messageId,
                  userId: data.userId,
                  readAt: new Date()
                });
              }
            });
          }
        }
      }
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  });

  // Join group
  socket.on("joinGroup", async (data: { conversationId: string; userId: string }) => {
    socket.join(data.conversationId);
    console.log(`User ${data.userId} joined group ${data.conversationId}`);
  });

  // Leave group
  socket.on("leaveGroup", async (data: { conversationId: string; userId: string }) => {
    socket.leave(data.conversationId);
    console.log(`User ${data.userId} left group ${data.conversationId}`);
  });

  // --- WebRTC Signaling for Video/Audio Calls ---

  // Initiate a call (send offer to recipient)
  socket.on("callUser", (data: {
    from: string;
    to: string;
    offer: RTCSessionDescriptionInit;
    callerName: string;
    callerAvatar?: string;
    callType: "audio" | "video";
  }) => {
    const recipientSocketId = userSockets.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("incomingCall", {
        from: data.from,
        offer: data.offer,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        callType: data.callType,
      });
      console.log(`📞 Call from ${data.from} to ${data.to} (${data.callType})`);
    } else {
      // Recipient is offline
      socket.emit("callUnavailable", { to: data.to, reason: "User is offline" });
    }
  });

  // Accept a call (send answer back to caller)
  socket.on("answerCall", (data: {
    to: string;
    answer: RTCSessionDescriptionInit;
  }) => {
    const callerSocketId = userSockets.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callAnswered", {
        answer: data.answer,
      });
      console.log(`✅ Call answered, sending answer to ${data.to}`);
    }
  });

  // Exchange ICE candidates
  socket.on("iceCandidate", (data: {
    to: string;
    candidate: RTCIceCandidateInit;
  }) => {
    const recipientSocketId = userSockets.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("iceCandidate", {
        candidate: data.candidate,
      });
    }
  });

  // End a call
  socket.on("endCall", (data: { to: string }) => {
    const recipientSocketId = userSockets.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("callEnded");
      console.log(`📵 Call ended with ${data.to}`);
    }
  });

  // Reject a call
  socket.on("rejectCall", (data: { to: string }) => {
    const callerSocketId = userSockets.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callRejected");
      console.log(`❌ Call rejected by user, notifying ${data.to}`);
    }
  });

  socket.on("disconnect", async () => {
    console.log("🔴 Client disconnected:", socket.id);
    // Find user by socket ID and set offline
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        try {
          // Notify any active call peers that this user disconnected
          socket.broadcast.emit("callEnded");

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
