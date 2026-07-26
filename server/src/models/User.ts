import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date },
  gender: { type: String },
  username: { type: String, unique: true, sparse: true },
  password: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  bio: { type: String, maxlength: 150 },
  website: { type: String },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  postsCount: { type: Number, default: 0 },
  isPrivate: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model("User", userSchema);
