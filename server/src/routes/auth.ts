import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Signup Route
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const { name, dob, gender, username, password, email, phone } = req.body;

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
    phone
  });

  res.json({ message: "User created", userId: user._id });
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
