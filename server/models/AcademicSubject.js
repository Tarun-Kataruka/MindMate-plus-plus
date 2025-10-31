import mongoose from 'mongoose';

const academicSubjectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const AcademicSubject = mongoose.model('AcademicSubject', academicSubjectSchema);
export default AcademicSubject;


