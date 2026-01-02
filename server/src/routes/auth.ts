import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Helper to decode Google JWT
interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

function decodeGoogleToken(token: string): GoogleTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
}

// Google OAuth Route
router.post("/google", async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      res.status(400).json({ error: "No credential provided" });
      return;
    }

    // Decode the Google JWT token
    const payload = decodeGoogleToken(credential);
    
    if (!payload) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Create new user
      user = await User.create({
        googleId,
        email,
        name,
        avatar: picture,
        username: email.split('@')[0] + '_' + Date.now(),
        isOnline: true
      });
    } else {
      // Update existing user
      user.googleId = googleId;
      user.avatar = picture || user.avatar;
      user.isOnline = true;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        googleId: user.googleId
      }
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Signup Route
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, dob, gender, username, password, email, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password || !username) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      res.status(400).json({ error: "Username or Email already exists" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      dob,
      gender,
      username,
      password: hashed,
      email,
      phone,
      isOnline: true
    });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "User created",
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login Route
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    if (!user.password) {
      res.status(400).json({ error: "Please use Google Sign-in for this account" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    user.isOnline = true;
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
