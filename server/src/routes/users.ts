import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

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

// Get contacts (all users except current user)
router.get("/contacts", async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId;
  const users = await User.find(
    { _id: { $ne: userId } },
    "username name email avatar isOnline lastSeen _id"
  );
  res.json(users);
});

// Search users
router.get("/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      res.json([]);
      return;
    }

    const users = await User.find(
      {
        _id: { $ne: userId },
        $or: [
          { name: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } }
        ]
      },
      "username name email avatar isOnline lastSeen _id"
    ).limit(10);

    res.json(users);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// Get single user
router.get("/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).userId;
    const { userId } = req.params;
    
    // Validate userId parameter
    if (!userId || userId === 'undefined' || userId === 'null') {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    
    const user = await User.findById(
      userId,
      "username name email avatar bio website isOnline lastSeen followersCount followingCount postsCount isPrivate _id"
    ).lean();
    
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if current user follows this user
    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser?.following?.includes(req.params.userId as any) || false;
    const isFollower = currentUser?.followers?.includes(req.params.userId as any) || false;

    res.json({ ...user, isFollowing, isFollower });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Update profile
router.patch("/profile", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, username, bio, website, avatar, isPrivate } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (avatar) updateData.avatar = avatar;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true })
      .select("username name email avatar bio website isOnline lastSeen followersCount followingCount postsCount isPrivate");

    res.json(user);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Follow user
router.post("/:userId/follow", async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).userId;
    const { userId } = req.params;

    if (currentUserId === userId) {
      res.status(400).json({ error: "Cannot follow yourself" });
      return;
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if already following
    if (currentUser?.following?.includes(userId as any)) {
      res.status(400).json({ error: "Already following" });
      return;
    }

    // Add to following and followers
    await User.findByIdAndUpdate(currentUserId, {
      $push: { following: userId },
      $inc: { followingCount: 1 }
    });

    await User.findByIdAndUpdate(userId, {
      $push: { followers: currentUserId },
      $inc: { followersCount: 1 }
    });

    res.json({ message: "Followed successfully" });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// Unfollow user
router.delete("/:userId/follow", async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).userId;
    const { userId } = req.params;

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: userId },
      $inc: { followingCount: -1 }
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { followers: currentUserId },
      $inc: { followersCount: -1 }
    });

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// Get followers
router.get("/:userId/followers", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("followers", "name username avatar followersCount");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user.followers);
  } catch (err) {
    console.error("Get followers error:", err);
    res.status(500).json({ error: "Failed to get followers" });
  }
});

// Get following
router.get("/:userId/following", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("following", "name username avatar followersCount");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user.following);
  } catch (err) {
    console.error("Get following error:", err);
    res.status(500).json({ error: "Failed to get following" });
  }
});

export default router;
