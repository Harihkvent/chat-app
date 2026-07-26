import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import Message from "../models/Message";
import Conversation from "../models/Conversation";
import mongoose from "mongoose";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Configure multer for file uploads
const uploadDir = path.join(__dirname, "../../uploads/chats");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow images, videos, audio, and common document types
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm|mp3|wav|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/') || 
                     file.mimetype.startsWith('video/') || 
                     file.mimetype.startsWith('audio/') ||
                     file.mimetype.startsWith('application/');
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error("File type not supported"));
    }
  }
});

// Middleware to verify token
router.use((req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = decoded.userId;
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
});

// Get all conversations for current user
router.get("/conversations", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate("participants", "name username email avatar isOnline lastSeen")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

// Get or create conversation with a user
router.post("/conversations", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { participantId } = req.body;

    if (!participantId) {
      res.status(400).json({ error: "Participant ID required" });
      return;
    }

    const User = mongoose.model("User");
    const currentUser = await User.findById(userId);
    const targetUser = await User.findById(participantId);

    if (currentUser?.blockedUsers?.includes(participantId) || targetUser?.blockedUsers?.includes(userId)) {
      res.status(403).json({ error: "Cannot start chat with a blocked user" });
      return;
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [userId, participantId], $size: 2 }
    }).populate("participants", "name username email avatar isOnline lastSeen");

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [userId, participantId],
        isGroup: false
      });
      conversation = await conversation.populate("participants", "name username email avatar isOnline lastSeen");
    }

    res.json(conversation);
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Get messages for a conversation
router.get("/messages/:conversationId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { conversationId } = req.params;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const messages = await Message.find({ conversationId })
      .populate("sender", "name username avatar")
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Send a message
router.post("/messages", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { conversationId, content, type = "text" } = req.body;

    if (!conversationId) {
      res.status(400).json({ error: "Conversation ID required" });
      return;
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    let fileUrl = null;
    let messageType = type;
    let messageContent = content || "";

    // Handle file upload
    if (req.file) {
      fileUrl = `/uploads/chats/${req.file.filename}`;
      
      // Determine message type based on file mimetype
      if (req.file.mimetype.startsWith('image/')) {
        messageType = 'image';
        messageContent = messageContent || 'Image';
      } else if (req.file.mimetype.startsWith('video/')) {
        messageType = 'video';
        messageContent = messageContent || 'Video';
      } else if (req.file.mimetype.startsWith('audio/')) {
        messageType = 'audio';
        messageContent = messageContent || 'Audio';
      } else {
        messageType = 'file';
        messageContent = messageContent || req.file.originalname;
      }
    }

    if (!messageContent && !fileUrl) {
      res.status(400).json({ error: "Message content or file required" });
      return;
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: userId,
      content: messageContent,
      type: messageType,
      fileUrl
    });

    // Update conversation
    conversation.lastMessage = message._id as any;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name username avatar");

    res.json(populatedMessage);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Create group chat
router.post("/groups", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, memberIds, description, avatar } = req.body;

    if (!name || !memberIds || memberIds.length < 2) {
      res.status(400).json({ error: "Invalid group data" });
      return;
    }

    // Add creator to members
    const participants = [userId, ...memberIds.filter((id: string) => id !== userId)];

    const conversation = await Conversation.create({
      participants,
      isGroup: true,
      groupName: name,
      groupDescription: description,
      groupAvatar: avatar,
      admins: [userId],
      createdBy: userId
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "name username email avatar isOnline lastSeen")
      .populate("admins", "name username avatar")
      .populate("createdBy", "name username avatar");

    res.json(populatedConversation);
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Add members to group
router.post("/groups/:conversationId/members", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { conversationId } = req.params;
    const { memberIds } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    // Check if user is admin
    if (!conversation.admins.includes(userId as any)) {
      res.status(403).json({ error: "Only admins can add members" });
      return;
    }

    // Add new members
    const newMembers = memberIds.filter(
      (id: string) => !conversation.participants.includes(id as any)
    );
    conversation.participants.push(...newMembers);
    await conversation.save();

    const updated = await Conversation.findById(conversationId)
      .populate("participants", "name username email avatar isOnline lastSeen")
      .populate("admins", "name username avatar");

    res.json(updated);
  } catch (err) {
    console.error("Add members error:", err);
    res.status(500).json({ error: "Failed to add members" });
  }
});

// Remove member from group
router.delete("/groups/:conversationId/members/:memberId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { conversationId, memberId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    // Check if user is admin or removing themselves
    const isAdmin = conversation.admins.includes(userId as any);
    const isSelf = userId === memberId;

    if (!isAdmin && !isSelf) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    // Remove member
    conversation.participants = conversation.participants.filter(
      (id: any) => id.toString() !== memberId
    );
    
    // Remove from admins if applicable
    conversation.admins = conversation.admins.filter(
      (id: any) => id.toString() !== memberId
    );

    await conversation.save();

    const updated = await Conversation.findById(conversationId)
      .populate("participants", "name username email avatar isOnline lastSeen")
      .populate("admins", "name username avatar");

    res.json(updated);
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// Make admin
router.post("/groups/:conversationId/admins/:memberId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { conversationId, memberId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    // Check if user is admin
    if (!conversation.admins.includes(userId as any)) {
      res.status(403).json({ error: "Only admins can promote members" });
      return;
    }

    // Add as admin
    if (!conversation.admins.includes(memberId as any)) {
      conversation.admins.push(memberId as any);
      await conversation.save();
    }

    const updated = await Conversation.findById(conversationId)
      .populate("participants", "name username email avatar isOnline lastSeen")
      .populate("admins", "name username avatar");

    res.json(updated);
  } catch (err) {
    console.error("Make admin error:", err);
    res.status(500).json({ error: "Failed to make admin" });
  }
});

// Update group info
router.patch("/groups/:conversationId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { conversationId } = req.params;
    const { groupName, groupDescription, groupAvatar } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      res.status(404).json({ error: "Group not found" });
      return;
    }

    // Check if user is admin
    if (!conversation.admins.includes(userId as any)) {
      res.status(403).json({ error: "Only admins can update group info" });
      return;
    }

    if (groupName) conversation.groupName = groupName;
    if (groupDescription !== undefined) conversation.groupDescription = groupDescription;
    if (groupAvatar) conversation.groupAvatar = groupAvatar;

    await conversation.save();

    const updated = await Conversation.findById(conversationId)
      .populate("participants", "name username email avatar isOnline lastSeen")
      .populate("admins", "name username avatar");

    res.json(updated);
  } catch (err) {
    console.error("Update group error:", err);
    res.status(500).json({ error: "Failed to update group" });
  }
});

export default router;
