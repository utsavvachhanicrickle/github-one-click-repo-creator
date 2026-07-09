import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  repoName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  htmlUrl: {
    type: String,
    required: true
  },
  cloneUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Repository = mongoose.model('Repository', repositorySchema);
