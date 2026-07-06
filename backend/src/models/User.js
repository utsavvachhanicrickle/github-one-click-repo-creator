import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  githubId: {
    type: Number,
    required: true,
    unique: true
  },
  login: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String
  },
  htmlUrl: {
    type: String
  },
  name: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const User = mongoose.model('User', userSchema);
