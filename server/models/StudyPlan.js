import mongoose from 'mongoose';

const studyItemSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSubject' },
    title: { type: String },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  { _id: false }
);

const studyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    items: { type: [studyItemSchema], default: [] },
  },
  { timestamps: true }
);

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
export default StudyPlan;


