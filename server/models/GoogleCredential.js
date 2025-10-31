import mongoose from 'mongoose';

const googleCredentialSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

const GoogleCredential = mongoose.model('GoogleCredential', googleCredentialSchema);
export default GoogleCredential;


