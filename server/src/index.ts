import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import chatRoutes from "./routes/chats";
import postRoutes from "./routes/posts";
import storyRoutes from "./routes/stories";
import User from "./models/User";
import Message from "./models/Message";
import Conversation from "./models/Conversation";
import {
  initRedis,
  setUserSocket,
  getUserSocket,
  deleteUserSocket,
  findUserBySocket,
  addToCallRoom,
  removeFromCallRoom,
  getCallRoomMembers,
  getAllCallRooms,
} from "./store";

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

// Setup Redis adapter for Socket.io when REDIS_URL is available
async function setupRedisAdapter() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return;

  try {
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.ping(), subClient.ping()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log("✅ Socket.io Redis adapter enabled (multi-instance ready)");
  } catch (err) {
    console.warn("⚠️  Redis adapter setup failed, using default adapter:", err);
  }
}

// WebSocket setup
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // User goes online
  socket.on("userOnline", async (userId: string) => {
    try {
      await setUserSocket(userId, socket.id);
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
      await deleteUserSocket(userId);
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
        for (const participantId of conversation.participants) {
          if (participantId.toString() !== data.from) {
            const recipientSocketId = await getUserSocket(participantId.toString());
            if (recipientSocketId) {
              io.to(recipientSocketId).emit("receiveMessage", messageData);
            }
          }
        }
      } else {
        // Emit to recipient if online
        const recipientSocketId = await getUserSocket(data.to);
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
    Conversation.findById(data.conversationId).then(async (conv) => {
      if (conv) {
        // Send typing indicator to all participants except sender
        for (const participantId of conv.participants) {
          if (participantId.toString() !== data.userId) {
            const recipientSocketId = await getUserSocket(participantId.toString());
            if (recipientSocketId) {
              io.to(recipientSocketId).emit("userTyping", {
                conversationId: data.conversationId,
                userId: data.userId,
                isTyping: data.isTyping
              });
            }
          }
        }
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
            for (const participantId of conversation.participants) {
              const socketId = await getUserSocket(participantId.toString());
              if (socketId) {
                io.to(socketId).emit("messageRead", {
                  messageId: data.messageId,
                  userId: data.userId,
                  readAt: new Date()
                });
              }
            }
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
  socket.on("startCall", async (data: {
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
    await addToCallRoom(data.roomId, data.from);
    console.log(`📞 Call room ${data.roomId} created by ${data.from} (${data.callType})`);

    // Notify each invited participant
    const offlineUsers: string[] = [];
    for (const userId of data.participants) {
      const recipientSocketId = await getUserSocket(userId);
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
    }

    if (offlineUsers.length === data.participants.length) {
      socket.emit("callUnavailable", { roomId: data.roomId, reason: "All participants are offline" });
    }
  });

  // A participant joins the call room
  socket.on("joinCallRoom", async (data: {
    roomId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
  }) => {
    socket.join(`call:${data.roomId}`);
    await addToCallRoom(data.roomId, data.userId);

    // Notify existing participants that a new peer joined
    socket.to(`call:${data.roomId}`).emit("peerJoined", {
      roomId: data.roomId,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
    });

    // Tell the joining user about existing participants
    const members = await getCallRoomMembers(data.roomId);
    const existingPeers = members.filter((id) => id !== data.userId);
    socket.emit("existingPeers", { roomId: data.roomId, peers: existingPeers });

    console.log(`✅ User ${data.userId} joined call room ${data.roomId} (${members.length} participants)`);
  });

  // Relay WebRTC offer to a specific peer (mesh: each pair negotiates)
  socket.on("callOffer", async (data: {
    roomId: string;
    to: string;
    from: string;
    fromName: string;
    fromAvatar?: string;
    offer: object;
  }) => {
    const recipientSocketId = await getUserSocket(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("callOffer", {
        roomId: data.roomId,
        from: data.from,
        fromName: data.fromName,
        fromAvatar: data.fromAvatar,
        offer: data.offer,
      });
    }
  });

  // Relay WebRTC answer to a specific peer
  socket.on("callAnswer", async (data: {
    roomId: string;
    to: string;
    from: string;
    fromName: string;
    fromAvatar?: string;
    answer: object;
  }) => {
    const recipientSocketId = await getUserSocket(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("callAnswer", {
        roomId: data.roomId,
        from: data.from,
        fromName: data.fromName,
        fromAvatar: data.fromAvatar,
        answer: data.answer,
      });
    }
  });

  // Relay ICE candidates to a specific peer
  socket.on("iceCandidate", async (data: {
    roomId: string;
    to: string;
    from: string;
    candidate: object;
  }) => {
    const recipientSocketId = await getUserSocket(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("iceCandidate", {
        roomId: data.roomId,
        from: data.from,
        candidate: data.candidate,
      });
    }
  });

  // Leave a call room (user hangs up)
  socket.on("leaveCallRoom", async (data: { roomId: string; userId: string }) => {
    socket.leave(`call:${data.roomId}`);
    const remaining = await removeFromCallRoom(data.roomId, data.userId);
    // Notify remaining peers
    socket.to(`call:${data.roomId}`).emit("peerLeft", {
      roomId: data.roomId,
      userId: data.userId,
    });
    console.log(`📵 User ${data.userId} left call room ${data.roomId} (${remaining} remaining)`);
  });

  // Reject an incoming call
  socket.on("rejectCall", async (data: { roomId: string; userId: string; to: string }) => {
    const callerSocketId = await getUserSocket(data.to);
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
    const userId = await findUserBySocket(socket.id);
    if (userId) {
      try {
        // Remove user from any active call rooms
        const rooms = await getAllCallRooms();
        for (const [roomId, participants] of rooms.entries()) {
          if (participants.has(userId)) {
            await removeFromCallRoom(roomId, userId);
            socket.to(`call:${roomId}`).emit("peerLeft", { roomId, userId });
          }
        }

        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        socket.broadcast.emit("userStatusChange", { userId, isOnline: false });
        await deleteUserSocket(userId);
      } catch (err) {
        console.error("Error on disconnect:", err);
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
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Initialize Redis for shared state + Socket.io adapter
    await initRedis();
    await setupRedisAdapter();

    const port = process.env.PORT || 4000;
    server.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
