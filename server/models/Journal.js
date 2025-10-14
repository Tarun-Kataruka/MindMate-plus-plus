import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, default: '' },
    summary: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Journal = mongoose.model('Journal', journalSchema);
export default Journal;


