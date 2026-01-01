import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Message from "../models/Message";
import Conversation from "../models/Conversation";
import mongoose from "mongoose";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

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
router.post("/messages", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { conversationId, content, type = "text" } = req.body;

    if (!conversationId || !content) {
      res.status(400).json({ error: "Missing required fields" });
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

    // Create message
    const message = await Message.create({
      conversationId,
      sender: userId,
      content,
      type
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
    const { name, memberIds } = req.body;

    if (!name || !memberIds || memberIds.length < 2) {
      res.status(400).json({ error: "Invalid group data" });
      return;
    }

    // Add creator to members
    const participants = [userId, ...memberIds];

    const conversation = await Conversation.create({
      participants,
      isGroup: true,
      groupName: name
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "name username email avatar isOnline lastSeen");

    res.json(populatedConversation);
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

export default router;
