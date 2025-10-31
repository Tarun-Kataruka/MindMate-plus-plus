import mongoose from 'mongoose';

const academicNoteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSubject', index: true, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    filePath: { type: String, required: true },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

const AcademicNote = mongoose.model('AcademicNote', academicNoteSchema);
export default AcademicNote;


