import 'dotenv/config';
import { connectDB } from '../src/config/database';
import { UserModel } from '../src/models/user.model';
import { BookModel } from '../src/models/book.model';
import { CopyModel } from '../src/models/copy.model';
import { CategoryModel } from '../src/models/category.model';
import { LoanModel } from '../src/models/loan.model';
import { ReservationModel } from '../src/models/reservation.model';

async function ensureIndexes() {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();

    console.log('📊 Ensuring indexes...');

    // Users indexes
    await UserModel.collection.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Users.email index ensured');

    // Books indexes
    await BookModel.collection.createIndex({ isbn: 1 }, { unique: true });
    await BookModel.collection.createIndex({ title: 'text', author: 'text' });
    console.log('✅ Books.isbn and text search indexes ensured');

    // Copies indexes
    await CopyModel.collection.createIndex({ code: 1 }, { unique: true });
    await CopyModel.collection.createIndex({ bookId: 1 });
    await CopyModel.collection.createIndex({ status: 1 });
    console.log('✅ Copies.code and related indexes ensured');

    // Categories indexes
    await CategoryModel.collection.createIndex({ name: 1 }, { unique: true });
    console.log('✅ Categories.name index ensured');

    // Loans indexes
    await LoanModel.collection.createIndex({ userId: 1 });
    await LoanModel.collection.createIndex({ copyId: 1 });
    await LoanModel.collection.createIndex({ status: 1 });
    await LoanModel.collection.createIndex({ dueDate: 1 });
    console.log('✅ Loans indexes ensured');

    // Reservations indexes
    await ReservationModel.collection.createIndex({ userId: 1 });
    await ReservationModel.collection.createIndex({ bookId: 1 });
    await ReservationModel.collection.createIndex({ status: 1 });
    await ReservationModel.collection.createIndex({ expiresAt: 1 });
    console.log('✅ Reservations indexes ensured');

    // Compound indexes for better performance
    await LoanModel.collection.createIndex({ userId: 1, status: 1 });
    await CopyModel.collection.createIndex({ bookId: 1, status: 1 });
    await ReservationModel.collection.createIndex({ bookId: 1, status: 1 });
    console.log('✅ Compound indexes ensured');

    console.log('🎉 All indexes ensured successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error ensuring indexes:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  ensureIndexes();
}

export { ensureIndexes };
