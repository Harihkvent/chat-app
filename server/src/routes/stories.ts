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

// Create story
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { mediaUrl, mediaType, caption } = req.body;

    const story = await Story.create({
      user: userId,
      mediaUrl,
      mediaType,
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
