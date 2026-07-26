import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ["image", "video"], default: "image" },
  caption: { type: String },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  viewersCount: { type: Number, default: 0 },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

storySchema.index({ user: 1, expiresAt: 1 });
storySchema.index({ expiresAt: 1 });

// Automatically set expiration to 24 hours
storySchema.pre("save", function(next) {
  if (this.isNew) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

export default mongoose.models.Story || mongoose.model("Story", storySchema);
