import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Post from "../models/Post";
import Comment from "../models/Comment";
import User from "../models/User";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, "../../uploads");
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// Get feed (posts from followed users)
router.get("/feed", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    console.log('📰 [SERVER] GET /api/posts/feed - User ID:', userId);
    
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('❌ [SERVER] User not found:', userId);
      res.status(404).json({ error: "User not found" });
      return;
    }

    console.log('   User:', user.username, 'Following:', user.following?.length || 0, 'users');
    const following = user.following || [];
    console.log('   Searching for posts from users:', [...following, userId]);
    
    const feedPosts = await Post.find({
      user: { $in: [...following, userId] }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user", "name username avatar")
      .lean();

    console.log('✅ [SERVER] Found', feedPosts.length, 'posts in feed');
    feedPosts.forEach((post: any, i: number) => {
      console.log(`   Post ${i + 1}:`, post._id, 'by', post.user?.username, 'image:', post.imageUrl?.substring(0, 50));
    });
    
    res.json(feedPosts);
  } catch (error) {
    console.error("❌ [SERVER] Error fetching feed:", error);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
});

// Get posts by user
router.get("/user/:userId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Validate userId parameter
    if (!userId || userId === 'undefined' || userId === 'null') {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    
    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "name username avatar")
      .lean();

    res.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Create post
router.post("/", authenticateToken, upload.single("image"), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { caption, imageUrl, videoUrl, location, tags } = req.body;
    
    console.log('📤 [SERVER] POST /api/posts - Creating new post');
    console.log('   User ID:', userId);
    console.log('   Caption:', caption);
    console.log('   Image URL:', imageUrl);
    console.log('   File uploaded:', req.file ? req.file.filename : 'none');
    console.log('   Body keys:', Object.keys(req.body));

    // Use uploaded file if available, otherwise use imageUrl
    let finalImageUrl = imageUrl;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
      console.log('   Using uploaded file:', finalImageUrl);
    } else if (imageUrl) {
      console.log('   Using provided URL:', imageUrl);
    }

    if (!finalImageUrl) {
      console.error('❌ [SERVER] No image provided');
      res.status(400).json({ error: "Either image file or imageUrl is required" });
      return;
    }

    console.log('   Creating post in database...');
    const post = await Post.create({
      user: userId,
      caption,
      imageUrl: finalImageUrl,
      videoUrl,
      location,
      tags
    });
    console.log('✅ [SERVER] Post created:', post._id);

    // Update user's post count
    await User.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });
    console.log('   User post count incremented');

    const populatedPost = await Post.findById(post._id)
      .populate("user", "name username avatar");
    
    console.log('✅ [SERVER] Returning populated post:', populatedPost?._id);
    console.log('   Post user:', populatedPost?.user);
    console.log('   Post imageUrl:', populatedPost?.imageUrl);

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("❌ [SERVER] Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Like/unlike post
router.post("/:postId/like", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const likeIndex = post.likes.indexOf(userId as any);
    const wasLiked = likeIndex > -1;
    
    if (wasLiked) {
      // Unlike
      post.likes.splice(likeIndex, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Like
      post.likes.push(userId as any);
      post.likesCount += 1;
    }

    await post.save();
    res.json({ liked: !wasLiked, likesCount: post.likesCount });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// Get comments for post
router.get("/:postId/comments", authenticateToken, async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate("user", "name username avatar")
      .lean();

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add comment
router.post("/:postId/comments", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { postId } = req.params;
    const { content } = req.body;

    const comment = await Comment.create({
      post: postId,
      user: userId,
      content
    });

    // Update post's comment count
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name username avatar");

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Delete post
router.delete("/:postId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    if (post.user.toString() !== userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ post: postId });
    await User.findByIdAndUpdate(userId, { $inc: { postsCount: -1 } });

    res.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;
