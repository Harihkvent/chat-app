import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isGroup: { type: Boolean, default: false },
  groupName: { type: String },
  groupAvatar: { type: String },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  lastMessageAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

conversationSchema.index({ participants: 1 });

export default mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
