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

// Get contacts (all users except current user and blocked users)
router.get("/contacts", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const currentUser = await User.findById(userId);
    const blockedByMe = currentUser?.blockedUsers || [];
    
    // Find users who have blocked current user
    const usersWhoBlockedMe = await User.find({ blockedUsers: userId }).select("_id");
    const blockedMeIds = usersWhoBlockedMe.map(u => u._id);

    const excludeIds = [userId, ...blockedByMe, ...blockedMeIds];

    const users = await User.find(
      { _id: { $nin: excludeIds } },
      "username name email avatar isOnline lastSeen _id"
    );
    res.json(users);
  } catch (err) {
    console.error("Contacts error:", err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
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

    const currentUser = await User.findById(userId);
    const blockedByMe = currentUser?.blockedUsers || [];
    const usersWhoBlockedMe = await User.find({ blockedUsers: userId }).select("_id");
    const blockedMeIds = usersWhoBlockedMe.map(u => u._id);

    const excludeIds = [userId, ...blockedByMe, ...blockedMeIds];

    const users = await User.find(
      {
        _id: { $nin: excludeIds },
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

// Get blocked users
router.get("/blocked", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId).populate("blockedUsers", "name username avatar _id");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user.blockedUsers || []);
  } catch (err) {
    console.error("Get blocked users error:", err);
    res.status(500).json({ error: "Failed to fetch blocked users" });
  }
});

// Get saved posts
router.get("/saved-posts", async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).userId;
    const user = await User.findById(currentUserId).populate({
      path: "savedPosts",
      populate: { path: "user", select: "name username avatar" }
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user.savedPosts || []);
  } catch (err) {
    console.error("Get saved posts error:", err);
    res.status(500).json({ error: "Failed to get saved posts" });
  }
});

// Toggle save post
router.post("/posts/:postId/save", async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).userId;
    const { postId } = req.params;

    const user = await User.findById(currentUserId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const savedIndex = user.savedPosts?.indexOf(postId as any) ?? -1;
    const isSaved = savedIndex > -1;

    if (isSaved) {
      user.savedPosts.splice(savedIndex, 1);
    } else {
      if (!user.savedPosts) user.savedPosts = [];
      user.savedPosts.push(postId as any);
    }

    await user.save();
    res.json({ saved: !isSaved, savedPosts: user.savedPosts });
  } catch (err) {
    console.error("Save post error:", err);
    res.status(500).json({ error: "Failed to save post" });
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

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    const isFollowing = currentUser?.following?.some((id: any) => id.toString() === userId) || false;
    const isFollower = currentUser?.followers?.some((id: any) => id.toString() === userId) || false;
    const isBlocked = currentUser?.blockedUsers?.some((id: any) => id.toString() === userId) || false;
    const hasBlocked = targetUser?.blockedUsers?.some((id: any) => id.toString() === currentUserId) || false;

    res.json({ ...user, isFollowing, isFollower, isBlocked, hasBlocked });
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

    // Check if blocked
    if (currentUser?.blockedUsers?.includes(userId as any) || targetUser?.blockedUsers?.includes(currentUserId as any)) {
      res.status(403).json({ error: "Cannot follow a blocked user" });
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

// Block user
router.post("/:userId/block", async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).userId;
    const { userId } = req.params;

    if (currentUserId === userId) {
      res.status(400).json({ error: "Cannot block yourself" });
      return;
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Add to blockedUsers if not already blocked
    if (!currentUser.blockedUsers?.includes(userId as any)) {
      await User.findByIdAndUpdate(currentUserId, {
        $push: { blockedUsers: userId }
      });
    }

    // Automatically remove follow/following relationships in both directions
    if (currentUser.following?.includes(userId as any)) {
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: userId },
        $inc: { followingCount: -1 }
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: currentUserId },
        $inc: { followersCount: -1 }
      });
    }

    if (currentUser.followers?.includes(userId as any)) {
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { followers: userId },
        $inc: { followersCount: -1 }
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { following: currentUserId },
        $inc: { followingCount: -1 }
      });
    }

    res.json({ message: "User blocked successfully" });
  } catch (err) {
    console.error("Block error:", err);
    res.status(500).json({ error: "Failed to block user" });
  }
});

// Unblock user
router.delete("/:userId/block", async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).userId;
    const { userId } = req.params;

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: userId }
    });

    res.json({ message: "User unblocked successfully" });
  } catch (err) {
    console.error("Unblock error:", err);
    res.status(500).json({ error: "Failed to unblock user" });
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
