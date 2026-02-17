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
// Store active call rooms: roomId -> Set of participant userIds
const callRooms = new Map<string, Set<string>>();

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

  // --- WebRTC Signaling for Video/Audio Calls (1-on-1 and Group) ---

  // Start a call: caller creates a room and invites participants
  socket.on("startCall", (data: {
    roomId: string;
    from: string;
    participants: string[]; // userIds to invite
    callerName: string;
    callerAvatar?: string;
    callType: "audio" | "video";
    groupName?: string;
  }) => {
    // Caller joins the call room
    socket.join(`call:${data.roomId}`);
    callRooms.set(data.roomId, new Set([data.from]));
    console.log(`📞 Call room ${data.roomId} created by ${data.from} (${data.callType})`);

    // Notify each invited participant
    const offlineUsers: string[] = [];
    data.participants.forEach((userId) => {
      const recipientSocketId = userSockets.get(userId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("incomingCall", {
          roomId: data.roomId,
          from: data.from,
          callerName: data.callerName,
          callerAvatar: data.callerAvatar,
          callType: data.callType,
          groupName: data.groupName,
          participants: data.participants,
        });
      } else {
        offlineUsers.push(userId);
      }
    });

    if (offlineUsers.length === data.participants.length) {
      socket.emit("callUnavailable", { roomId: data.roomId, reason: "All participants are offline" });
    }
  });

  // A participant joins the call room
  socket.on("joinCallRoom", (data: {
    roomId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
  }) => {
    socket.join(`call:${data.roomId}`);
    const room = callRooms.get(data.roomId) || new Set();
    room.add(data.userId);
    callRooms.set(data.roomId, room);

    // Notify existing participants that a new peer joined
    socket.to(`call:${data.roomId}`).emit("peerJoined", {
      roomId: data.roomId,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
    });

    // Tell the joining user about existing participants
    const existingPeers = Array.from(room).filter((id) => id !== data.userId);
    socket.emit("existingPeers", { roomId: data.roomId, peers: existingPeers });

    console.log(`✅ User ${data.userId} joined call room ${data.roomId} (${room.size} participants)`);
  });

  // Relay WebRTC offer to a specific peer (mesh: each pair negotiates)
  socket.on("callOffer", (data: {
    roomId: string;
    to: string;
    from: string;
    offer: object;
  }) => {
    const recipientSocketId = userSockets.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("callOffer", {
        roomId: data.roomId,
        from: data.from,
        offer: data.offer,
      });
    }
  });

  // Relay WebRTC answer to a specific peer
  socket.on("callAnswer", (data: {
    roomId: string;
    to: string;
    from: string;
    answer: object;
  }) => {
    const recipientSocketId = userSockets.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("callAnswer", {
        roomId: data.roomId,
        from: data.from,
        answer: data.answer,
      });
    }
  });

  // Relay ICE candidates to a specific peer
  socket.on("iceCandidate", (data: {
    roomId: string;
    to: string;
    from: string;
    candidate: object;
  }) => {
    const recipientSocketId = userSockets.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("iceCandidate", {
        roomId: data.roomId,
        from: data.from,
        candidate: data.candidate,
      });
    }
  });

  // Leave a call room (user hangs up)
  socket.on("leaveCallRoom", (data: { roomId: string; userId: string }) => {
    socket.leave(`call:${data.roomId}`);
    const room = callRooms.get(data.roomId);
    if (room) {
      room.delete(data.userId);
      // Notify remaining peers
      socket.to(`call:${data.roomId}`).emit("peerLeft", {
        roomId: data.roomId,
        userId: data.userId,
      });
      // Clean up empty rooms
      if (room.size === 0) {
        callRooms.delete(data.roomId);
      }
      console.log(`📵 User ${data.userId} left call room ${data.roomId}`);
    }
  });

  // Reject an incoming call
  socket.on("rejectCall", (data: { roomId: string; userId: string; to: string }) => {
    const callerSocketId = userSockets.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callRejected", {
        roomId: data.roomId,
        userId: data.userId,
      });
      console.log(`❌ Call rejected by ${data.userId} in room ${data.roomId}`);
    }
  });

  socket.on("disconnect", async () => {
    console.log("🔴 Client disconnected:", socket.id);
    // Find user by socket ID and set offline
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        try {
          // Remove user from any active call rooms
          for (const [roomId, participants] of callRooms.entries()) {
            if (participants.has(userId)) {
              participants.delete(userId);
              socket.to(`call:${roomId}`).emit("peerLeft", { roomId, userId });
              if (participants.size === 0) {
                callRooms.delete(roomId);
              }
            }
          }

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
