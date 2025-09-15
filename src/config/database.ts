// src/config/database.ts
import mongoose from "mongoose";

type ConnectOptions = mongoose.ConnectOptions & { w?: string | number };

function getConfig(): { uri: string; options: ConnectOptions } {
  const env = process.env.NODE_ENV ?? "development";

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || "";
  const dbName = process.env.MONGODB_DB || "biblioicesi";

  const base: ConnectOptions = {
    dbName,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  };

  if (env === "test") {
    const testUri = process.env.MONGODB_TEST_URI || `mongodb://127.0.0.1:27017/${dbName}_test`;
    return { uri: testUri, options: { ...base, dbName: `${dbName}_test` } };
  }

  if (env === "production") {
    if (!mongoUri) throw new Error("Missing MONGODB_URI/MONGO_URL in production");
    return { uri: mongoUri, options: { ...base, retryWrites: true, w: "majority" } };
  }

  // development
  return { uri: mongoUri || `mongodb://127.0.0.1:27017/${dbName}`, options: base };
}

// --- Singleton ---
declare global {
  // eslint-disable-next-line no-var
  var __mongooseConnPromise: Promise<typeof mongoose> | undefined;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!global.__mongooseConnPromise) {
    const { uri, options } = getConfig();
    if (!uri) throw new Error("Database URI is not defined");
    global.__mongooseConnPromise = mongoose.connect(uri, options).then((m) => {
      console.log(`✅ Connected to ${m.connection.host} DB: ${m.connection.name}`);
      m.connection.on("error", (err) => console.error("Mongo error:", err));
      m.connection.on("disconnected", () => console.log("Mongo disconnected"));
      return m;
    }).catch((err) => {
      global.__mongooseConnPromise = undefined;
      console.error("❌ Mongo connect failed:", err);
      throw err;
    });
  }

  return global.__mongooseConnPromise;
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    global.__mongooseConnPromise = undefined;
    console.log("✅ Mongo disconnected");
  } catch (e) {
    console.error("❌ Error on disconnect:", e);
    throw e;
  }
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
