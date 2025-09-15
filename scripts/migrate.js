const mongoose = require('mongoose');
const { databaseConnection } = require('../src/config/database');

// Migration functions
const migrations = [
  {
    version: '1.0.0',
    description: 'Initial database setup',
    up: async () => {
      console.log('Running migration 1.0.0: Initial database setup');
      
      // Create indexes if they don't exist
      const db = mongoose.connection.db;
      
      // Users collection
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      
      // Books collection
      await db.collection('books').createIndex({ isbn: 1 }, { unique: true });
      await db.collection('books').createIndex({ title: 'text', author: 'text' });
      
      // Copies collection
      await db.collection('copies').createIndex({ bookId: 1 });
      await db.collection('copies').createIndex({ code: 1 }, { unique: true });
      
      // Loans collection
      await db.collection('loans').createIndex({ userId: 1 });
      await db.collection('loans').createIndex({ copyId: 1 });
      await db.collection('loans').createIndex({ status: 1 });
      
      // Reservations collection
      await db.collection('reservations').createIndex({ userId: 1 });
      await db.collection('reservations').createIndex({ bookId: 1 });
      await db.collection('reservations').createIndex({ status: 1 });
      
      console.log('Migration 1.0.0 completed');
    }
  }
];

// Migration runner
async function runMigrations() {
  try {
    await databaseConnection.connect();
    
    const db = mongoose.connection.db;
    
    // Create migrations collection if it doesn't exist
    const migrationsCollection = db.collection('migrations');
    
    for (const migration of migrations) {
      // Check if migration has already been run
      const existingMigration = await migrationsCollection.findOne({ version: migration.version });
      
      if (existingMigration) {
        console.log(`Migration ${migration.version} already applied, skipping`);
        continue;
      }
      
      console.log(`Running migration ${migration.version}: ${migration.description}`);
      
      try {
        await migration.up();
        
        // Record migration as completed
        await migrationsCollection.insertOne({
          version: migration.version,
          description: migration.description,
          appliedAt: new Date()
        });
        
        console.log(`Migration ${migration.version} completed successfully`);
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await databaseConnection.disconnect();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
