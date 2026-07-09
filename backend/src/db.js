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

  const isAtlas = uri.includes('mongodb+srv') || uri.includes('mongodb.net');

  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      // Required for Atlas on Vercel (dynamic IPs, strict TLS)
      ...(isAtlas && {
        tls: true,
        tlsAllowInvalidCertificates: false,
        retryWrites: true,
      }),
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
