import mongoose from 'mongoose';

const academicSubjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, 'Subject name must be at least 1 character'],
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries: userId + name (for uniqueness per user)
academicSubjectSchema.index({ userId: 1, name: 1 }, { unique: true });

const AcademicSubject = mongoose.model('AcademicSubject', academicSubjectSchema);
export default AcademicSubject;


