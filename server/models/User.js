import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    age: { type: Number, min: 13 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
