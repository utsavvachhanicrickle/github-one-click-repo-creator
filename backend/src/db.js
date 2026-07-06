import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/github-repo-creator';
    const conn = await mongoose.connect(uri);
    console.log(`[database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[database] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
}
