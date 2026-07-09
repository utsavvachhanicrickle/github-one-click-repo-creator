import mongoose from 'mongoose';

// Cache the connection promise so serverless warm invocations reuse it
let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return; // already connected or connecting
  }

  if (connectionPromise) {
    return connectionPromise; // reuse pending connection
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/github-repo-creator';

  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    .then((conn) => {
      console.log(`[database] MongoDB Connected: ${conn.connection.host}`);
    })
    .catch((error) => {
      console.error(`[database] MongoDB Connection Error: ${error.message}`);
      connectionPromise = null; // reset so next call retries
      // Do NOT call process.exit(1) on Vercel — it kills the serverless function
    });

  return connectionPromise;
}
