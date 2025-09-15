import serverless from 'serverless-http';
import { connectDB } from '../src/config/database';
import app from '../src/index';

// Connect to database on cold start
let isConnected = false;

const handler = async (event: any, context: any) => {
  // Connect to database if not already connected
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log('✅ Database connected for Vercel function');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  // Create serverless handler
  const serverlessHandler = serverless(app, {
    binary: ['image/*', 'application/pdf']
  });

  return serverlessHandler(event, context);
};

export { handler };
export default handler;
