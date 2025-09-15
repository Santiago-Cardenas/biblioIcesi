import mongoose from 'mongoose';

interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions & { w?: string | number };
}

const getDatabaseConfig = (): DatabaseConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  // Read MongoDB URI from environment variables
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;
  const dbName = process.env.MONGODB_DB || 'biblioicesi';

  // Configuration for different environments
  const configs = {
    development: {
      uri: mongoUri || `mongodb://localhost:27017/${dbName}`,
      options: {
        dbName,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    },
    test: {
      uri: process.env.MONGODB_TEST_URI || `mongodb://localhost:27017/${dbName}_test`,
      options: {
        dbName: `${dbName}_test`,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    },
    production: {
      uri: mongoUri || '',
      options: {
        dbName,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority',
      } as any // Cast to any to avoid type error for 'w'
    }
  };

  const environment = isTest ? 'test' : isProduction ? 'production' : 'development';
  return configs[environment];
};

// Global promise to prevent multiple connections
let connectionPromise: Promise<void> | null = null;

export async function connectDB(): Promise<void> {
  // Return existing connection promise if available
  if (connectionPromise) {
    return connectionPromise;
  }

  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    console.log('Database already connected');
    return;
  }

  connectionPromise = (async () => {
    try {
      const config = getDatabaseConfig();
      
      if (!config.uri) {
        throw new Error('Database URI is not defined');
      }

      await mongoose.connect(config.uri, config.options);
      
      const host = mongoose.connection.host;
      const dbName = mongoose.connection.name;
      console.log(`Connected to ${host} DB: ${dbName}`);

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('Database connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('Database disconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.disconnect();
        process.exit(0);
      });

    } catch (error) {
      console.error('Database connection failed:', error);
      connectionPromise = null; // Reset on error
      throw error;
    }
  })();

  return connectionPromise;
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    connectionPromise = null;
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    throw error;
  }
}

export function getConnectionStatus(): boolean {
  return mongoose.connection.readyState === 1;
}
