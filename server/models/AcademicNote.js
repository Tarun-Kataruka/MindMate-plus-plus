import mongoose from 'mongoose';

const academicNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSubject',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    size: {
      type: Number,
      min: [0, 'File size cannot be negative'],
    },
    filePath: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
academicNoteSchema.index({ userId: 1, subjectId: 1, createdAt: -1 });

const AcademicNote = mongoose.model('AcademicNote', academicNoteSchema);
export default AcademicNote;


