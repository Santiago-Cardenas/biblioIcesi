import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserModel, BookModel, CopyModel, LoanModel, CategoryModel } from '../../src/models';
import { userService, bookService, copyService, loanService, categoryService } from '../../src/services';
import { UserRole, CopyStatus, LoanStatus } from '../../src/models';
import bcrypt from 'bcrypt';

// Mock bcrypt for integration tests
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Database Integration Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Close database connection and stop server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean database before each test
    await UserModel.deleteMany({});
    await BookModel.deleteMany({});
    await CopyModel.deleteMany({});
    await LoanModel.deleteMany({});
    await CategoryModel.deleteMany({});
    
    // Setup bcrypt mocks
    mockedBcrypt.hash.mockResolvedValue('hashed_password' as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
  });

  describe('User Management Flow', () => {
    it('should create user and authenticate successfully', async () => {
      // Create user
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER
      };

      const user = await userService.create(userData);
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);

      // Authenticate user
      const loginResult = await userService.login({
        email: userData.email,
        password: userData.password
      });

      expect(loginResult.user.email).toBe(userData.email);
      expect(loginResult.token).toBeDefined();
    });

    it('should create admin user and verify permissions', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: UserRole.ADMIN
      };

      const admin = await userService.create(adminData);
      expect(admin.role).toBe(UserRole.ADMIN);
    });
  });

  describe('Book and Copy Management Flow', () => {
    it('should create book with copies and manage availability', async () => {
      // Create category
      const category = await categoryService.create({
        name: 'Fiction',
        description: 'Fiction books'
      });

      // Create book
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        categoryId: (category as any)._id.toString(),
        description: 'A test book'
      };

      const book = await bookService.create(bookData);
      expect(book.title).toBe(bookData.title);

      // Create copies
      const copy1 = await copyService.create({
        bookId: (book as any)._id.toString(),
        code: 'COPY001',
        status: CopyStatus.AVAILABLE
      });

      const copy2 = await copyService.create({
        bookId: (book as any)._id.toString(),
        code: 'COPY002',
        status: CopyStatus.AVAILABLE
      });

      // Verify copies were created
      const copies = await copyService.findByBook((book as any)._id.toString());
      expect(copies).toHaveLength(2);

      // Check available copies
      const availableCopies = await copyService.findAvailableCopiesByBook((book as any)._id.toString());
      expect(availableCopies).toHaveLength(2);
    });
  });

  describe('Loan Management Flow', () => {
    it('should create loan and update copy status', async () => {
      // Create user
      const user = await userService.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER
      });

      // Create category and book
      const category = await categoryService.create({
        name: 'Fiction',
        description: 'Fiction books'
      });

      const book = await bookService.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        categoryId: (category as any)._id.toString(),
        description: 'A test book'
      });

      // Create copy
      const copy = await copyService.create({
        bookId: (book as any)._id.toString(),
        code: 'COPY001',
        status: CopyStatus.AVAILABLE
      });

      // Create loan
      const loan = await loanService.create({
        userId: (user as any)._id.toString(),
        copyId: (copy as any)._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      });

      expect(loan.status).toBe(LoanStatus.ACTIVE);

      // Verify copy status was updated
      const updatedCopy = await copyService.findById((copy as any)._id.toString());
      expect(updatedCopy?.status).toBe(CopyStatus.LOANED);

      // Return loan
      const returnedLoan = await loanService.returnLoan((loan as any)._id.toString());
      expect(returnedLoan?.status).toBe(LoanStatus.RETURNED);

      // Verify copy status was restored
      const restoredCopy = await copyService.findById((copy as any)._id.toString());
      expect(restoredCopy?.status).toBe(CopyStatus.AVAILABLE);
    });

    it('should handle overdue loans', async () => {
      // Create user
      const user = await userService.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER
      });

      // Create category and book
      const category = await categoryService.create({
        name: 'Fiction',
        description: 'Fiction books'
      });

      const book = await bookService.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        categoryId: (category as any)._id.toString(),
        description: 'A test book'
      });

      // Create copy
      const copy = await copyService.create({
        bookId: (book as any)._id.toString(),
        code: 'COPY001',
        status: CopyStatus.AVAILABLE
      });

      // Create overdue loan (due date in the past)
      const overdueLoan = await loanService.create({
        userId: (user as any)._id.toString(),
        copyId: (copy as any)._id.toString(),
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      });

      // Update overdue loans
      await loanService.updateOverdueLoans();

      // Check if loan was marked as overdue
      const updatedLoan = await loanService.findById((overdueLoan as any)._id.toString());
      expect(updatedLoan?.status).toBe(LoanStatus.OVERDUE);
    });
  });

  describe('Search and Filtering', () => {
    it('should search books by title and author', async () => {
      // Create category
      const category = await categoryService.create({
        name: 'Fiction',
        description: 'Fiction books'
      });

      // Create books
      await bookService.create({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '1234567890',
        categoryId: (category as any)._id.toString(),
        description: 'A classic novel'
      });

      await bookService.create({
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '0987654321',
        categoryId: (category as any)._id.toString(),
        description: 'Another classic novel'
      });

      // Search by title
      const titleResults = await bookService.search('Gatsby');
      expect(titleResults).toHaveLength(1);
      expect(titleResults[0].title).toBe('The Great Gatsby');

      // Search by author
      const authorResults = await bookService.search('Harper');
      expect(authorResults).toHaveLength(1);
      expect(authorResults[0].author).toBe('Harper Lee');
    });

    it('should filter books by category', async () => {
      // Create categories
      const fictionCategory = await categoryService.create({
        name: 'Fiction',
        description: 'Fiction books'
      });

      const nonFictionCategory = await categoryService.create({
        name: 'Non-Fiction',
        description: 'Non-fiction books'
      });

      // Create books in different categories
      await bookService.create({
        title: 'Fiction Book',
        author: 'Fiction Author',
        isbn: '1234567890',
        categoryId: (fictionCategory as any)._id.toString(),
        description: 'A fiction book'
      });

      await bookService.create({
        title: 'Non-Fiction Book',
        author: 'Non-Fiction Author',
        isbn: '0987654321',
        categoryId: (nonFictionCategory as any)._id.toString(),
        description: 'A non-fiction book'
      });

      // Filter by category
      const fictionBooks = await bookService.findByCategory((fictionCategory as any)._id.toString());
      expect(fictionBooks).toHaveLength(1);
      expect(fictionBooks[0].title).toBe('Fiction Book');
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate email registration', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER
      };

      // Create first user
      await userService.create(userData);

      // Try to create user with same email
      await expect(userService.create(userData)).rejects.toThrow('User already exists');
    });

    it('should handle loan creation with unavailable copy', async () => {
      // Create user
      const user = await userService.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER
      });

      // Create category and book
      const category = await categoryService.create({
        name: 'Fiction',
        description: 'Fiction books'
      });

      const book = await bookService.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        categoryId: (category as any)._id.toString(),
        description: 'A test book'
      });

      // Create copy that's already loaned
      const copy = await copyService.create({
        bookId: (book as any)._id.toString(),
        code: 'COPY001',
        status: CopyStatus.LOANED
      });

      // Try to create loan with unavailable copy
      await expect(loanService.create({
        userId: (user as any)._id.toString(),
        copyId: (copy as any)._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })).rejects.toThrow('Copy is not available');
    });
  });
});
