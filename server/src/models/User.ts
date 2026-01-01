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
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model("User", userSchema);
