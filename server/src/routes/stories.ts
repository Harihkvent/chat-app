import express, { Request, Response, NextFunction } from "express";
import Story from "../models/Story";
import User from "../models/User";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Get stories from followed users (and own stories)
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const following = user.following || [];
    
    // Get non-expired stories from followed users and self
    const stories = await Story.find({
      user: { $in: [...following, userId] },
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: -1 })
      .populate("user", "name username avatar")
      .lean();

    // Group stories by user
    const groupedStories = stories.reduce((acc: any, story: any) => {
      const userId = story.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: []
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});

    res.json(Object.values(groupedStories));
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

// Get user's own stories
router.get("/my-stories", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    const stories = await Story.find({
      user: userId,
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: -1 })
      .populate("user", "name username avatar")
      .lean();

    res.json(stories);
  } catch (error) {
    console.error("Error fetching my stories:", error);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

import path from "path";
import fs from "fs";
import multer from "multer";

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Create story
router.post("/", authenticateToken, upload.single("image"), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { mediaUrl, mediaType, caption } = req.body;

    let finalMediaUrl = mediaUrl;
    if (req.file) {
      finalMediaUrl = `/uploads/${req.file.filename}`;
    }

    if (!finalMediaUrl) {
      res.status(400).json({ error: "Media file or mediaUrl is required" });
      return;
    }

    const story = await Story.create({
      user: userId,
      mediaUrl: finalMediaUrl,
      mediaType: mediaType || "image",
      caption
    });

    const populatedStory = await Story.findById(story._id)
      .populate("user", "name username avatar");

    res.status(201).json(populatedStory);
  } catch (error) {
    console.error("Error creating story:", error);
    res.status(500).json({ error: "Failed to create story" });
  }
});

// View story (add viewer)
router.post("/:storyId/view", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }

    // Check if story is expired
    if (story.expiresAt < new Date()) {
      res.status(410).json({ error: "Story has expired" });
      return;
    }

    // Add viewer if not already viewed
    if (!story.viewers.includes(userId as any)) {
      story.viewers.push(userId as any);
      story.viewersCount += 1;
      await story.save();
    }

    res.json({ message: "Story viewed" });
  } catch (error) {
    console.error("Error viewing story:", error);
    res.status(500).json({ error: "Failed to view story" });
  }
});

// Get story viewers
router.get("/:storyId/viewers", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { storyId } = req.params;
    const userId = (req as any).user?.userId;

    const story = await Story.findById(storyId)
      .populate("viewers", "name username avatar");

    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }

    // Only story owner can see viewers
    if (story.user.toString() !== userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    res.json(story.viewers);
  } catch (error) {
    console.error("Error fetching viewers:", error);
    res.status(500).json({ error: "Failed to fetch viewers" });
  }
});

// Delete story
router.delete("/:storyId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }

    if (story.user.toString() !== userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    await Story.findByIdAndDelete(storyId);
    res.json({ message: "Story deleted" });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({ error: "Failed to delete story" });
  }
});

export default router;
