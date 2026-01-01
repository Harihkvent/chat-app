import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Middleware to verify token
router.use((req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = decoded.userId;
    next();
  } catch {
    res.status(403).json({ error: "Invalid token" });
  }
});

// Get contacts (all users except current user)
router.get("/contacts", async (req, res) => {
  const userId = (req as any).userId;
  const users = await User.find(
    { _id: { $ne: userId } },
    "username name email avatar isOnline lastSeen _id"
  );
  res.json(users);
});

// Search users
router.get("/search", async (req, res) => {
  try {
    const userId = (req as any).userId;
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      return res.json([]);
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
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(
      req.params.userId,
      "username name email avatar isOnline lastSeen _id"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
