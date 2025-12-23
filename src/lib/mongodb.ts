import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cybersecurity-risk-ai';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// @ts-ignore
let cached = global.mongoose;

if (!cached) {
  // @ts-ignore
  cached = global.mongoose = { conn: null, promise: null, seeded: false };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      console.log('✅ MongoDB connected successfully');
      cached.conn = mongoose;
      
      // Auto-seed database on first connection
      if (!cached.seeded) {
        cached.seeded = true;
        try {
          const { seedDatabase } = await import('./seedDatabase');
          const result = await seedDatabase();
          if (result.success && !result.skipped) {
            console.log(`🌱 ${result.message}`);
          }
        } catch (err) {
          console.warn('⚠️  Auto-seed failed:', err);
        }
      }
      
      return mongoose;
    }).catch((err) => {
      console.warn('⚠️  MongoDB connection failed:', err.message);
      console.warn('⚠️  The app will work without feedback learning features.');
      cached.promise = null;
      return null;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection error:', e);
    return null;
  }

  return cached.conn;
}

export default connectDB;
