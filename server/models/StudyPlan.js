import mongoose from 'mongoose';

const studyItemSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSubject',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: function() {
        return 'Study Session';
      },
    },
    start: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          return value instanceof Date && !isNaN(value);
        },
        message: 'Start date must be a valid date',
      },
    },
    end: {
      type: Date,
      required: true,
      validate: {
        validator: function(value) {
          if (!(value instanceof Date && !isNaN(value))) return false;
          if (this.start && value instanceof Date && !isNaN(this.start.getTime())) {
            return value > this.start;
          }
          return true; // If start is not set yet, validation will pass
        },
        message: 'End date must be a valid date and after start date',
      },
    },
  },
  { _id: true } // Enable _id for individual item tracking
);

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [studyItemSchema],
      default: [],
      validate: {
        validator: function(items) {
          return items.length <= 1000; // Reasonable limit
        },
        message: 'Study plan cannot have more than 1000 items',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
studyPlanSchema.index({ userId: 1, createdAt: -1 });
studyPlanSchema.index({ userId: 1, 'items.subjectId': 1 });
studyPlanSchema.index({ 'items.start': 1, 'items.end': 1 });

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
export default StudyPlan;


