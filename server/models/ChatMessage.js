import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    mood: { type: String, enum: ['positive', 'neutral', 'negative', 'anxious', 'sad', 'angry', 'stressed', 'tired', 'unknown'], default: 'unknown', index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// TTL index: expire documents 7 days after createdAt
// Note: In MongoDB, TTL index must be created on a field with a BSON date value
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;


