import { bookService } from '../src/services/book.service';
import { BookModel, CategoryModel, CopyModel } from '../src/models';

jest.mock('../src/models');

const mockedBookModel = BookModel as jest.Mocked<typeof BookModel>;
const mockedCategoryModel = CategoryModel as jest.Mocked<typeof CategoryModel>;
const mockedCopyModel = CopyModel as jest.Mocked<typeof CopyModel>;

describe('BookService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create book successfully', async () => {
      const mockCategory = { id: 'cat1', name: 'Fiction' };
      const mockBook = { 
        id: 'book1', 
        title: 'Test Book', 
        author: 'Test Author',
        isbn: '1234567890',
        categoryId: 'cat1'
      };

      mockedCategoryModel.findById.mockResolvedValueOnce(mockCategory as any);
      mockedBookModel.findOne.mockResolvedValueOnce(null);
      mockedBookModel.create.mockResolvedValueOnce(mockBook as any);

      const result = await bookService.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        categoryId: 'cat1'
      });

      expect(mockedCategoryModel.findById).toHaveBeenCalledWith('cat1');
      expect(mockedBookModel.findOne).toHaveBeenCalledWith({ isbn: '1234567890' });
      expect(mockedBookModel.create).toHaveBeenCalledWith({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        categoryId: 'cat1'
      });
      expect(result).toEqual(mockBook);
    });

    it('should throw error if category not found', async () => {
      mockedCategoryModel.findById.mockResolvedValueOnce(null);

      await expect(bookService.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        categoryId: 'nonexistent'
      })).rejects.toThrow('Category not found');
    });

    it('should throw error if book with ISBN already exists', async () => {
      const mockCategory = { id: 'cat1', name: 'Fiction' };
      const existingBook = { id: 'existing', isbn: '1234567890' };

      mockedCategoryModel.findById.mockResolvedValueOnce(mockCategory as any);
      mockedBookModel.findOne.mockResolvedValueOnce(existingBook as any);

      await expect(bookService.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        categoryId: 'cat1'
      })).rejects.toThrow('Book with this ISBN already exists');
    });
  });

  describe('findAll', () => {
    it('should return all books with populated category', async () => {
      const mockBooks = [
        { id: 'book1', title: 'Book 1', categoryId: { name: 'Fiction' } },
        { id: 'book2', title: 'Book 2', categoryId: { name: 'Science' } }
      ];

      mockedBookModel.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockBooks)
      } as any);

      const result = await bookService.findAll();

      expect(mockedBookModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockBooks);
    });
  });

  describe('findById', () => {
    it('should return book by id with populated category', async () => {
      const mockBook = { id: 'book1', title: 'Test Book', categoryId: { name: 'Fiction' } };

      mockedBookModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockBook)
      } as any);

      const result = await bookService.findById('book1');

      expect(mockedBookModel.findById).toHaveBeenCalledWith('book1');
      expect(result).toEqual(mockBook);
    });
  });

  describe('findByCategory', () => {
    it('should return books by category', async () => {
      const mockBooks = [
        { id: 'book1', title: 'Book 1', categoryId: 'cat1' },
        { id: 'book2', title: 'Book 2', categoryId: 'cat1' }
      ];

      mockedBookModel.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockBooks)
      } as any);

      const result = await bookService.findByCategory('cat1');

      expect(mockedBookModel.find).toHaveBeenCalledWith({ categoryId: 'cat1' });
      expect(result).toEqual(mockBooks);
    });
  });

  describe('search', () => {
    it('should search books by title, author, or ISBN', async () => {
      const mockBooks = [
        { id: 'book1', title: 'Test Book', author: 'Test Author', isbn: '1234567890' }
      ];

      mockedBookModel.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockBooks)
      } as any);

      const result = await bookService.search('test');

      expect(mockedBookModel.find).toHaveBeenCalledWith({
        $or: [
          { title: /test/i },
          { author: /test/i },
          { isbn: /test/i }
        ]
      });
      expect(result).toEqual(mockBooks);
    });
  });

  describe('update', () => {
    it('should update book successfully', async () => {
      const mockBook = { id: 'book1', title: 'Original Title', isbn: '1234567890' };
      const mockCategory = { id: 'cat1', name: 'Fiction' };
      const mockUpdatedBook = { id: 'book1', title: 'Updated Title', isbn: '1234567890' };

      mockedBookModel.findById.mockResolvedValueOnce(mockBook as any);
      mockedCategoryModel.findById.mockResolvedValueOnce(mockCategory as any);
      mockedBookModel.findByIdAndUpdate.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockUpdatedBook)
      } as any);

      const result = await bookService.update('book1', {
        title: 'Updated Title',
        categoryId: 'cat1'
      });

      expect(mockedBookModel.findById).toHaveBeenCalledWith('book1');
      expect(mockedCategoryModel.findById).toHaveBeenCalledWith('cat1');
      expect(mockedBookModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'book1',
        { title: 'Updated Title', categoryId: 'cat1' },
        { new: true }
      );
      expect(result).toEqual(mockUpdatedBook);
    });

    it('should throw error if book not found', async () => {
      mockedBookModel.findById.mockResolvedValueOnce(null);

      await expect(bookService.update('nonexistent', {
        title: 'Updated Title'
      })).rejects.toThrow("Book doesn't exist");
    });

    it('should throw error if new category not found', async () => {
      const mockBook = { id: 'book1', title: 'Original Title', isbn: '1234567890' };

      mockedBookModel.findById.mockResolvedValueOnce(mockBook as any);
      mockedCategoryModel.findById.mockResolvedValueOnce(null);

      await expect(bookService.update('book1', {
        categoryId: 'nonexistent'
      })).rejects.toThrow('Category not found');
    });

    it('should throw error if ISBN already exists for another book', async () => {
      const mockBook = { id: 'book1', title: 'Original Title', isbn: '1234567890' };
      const existingBook = { id: 'book2', isbn: '9876543210' };

      mockedBookModel.findById.mockResolvedValueOnce(mockBook as any);
      mockedBookModel.findOne.mockResolvedValueOnce(existingBook as any);

      await expect(bookService.update('book1', {
        isbn: '9876543210'
      })).rejects.toThrow('Book with this ISBN already exists');
    });
  });

  describe('delete', () => {
    it('should delete book successfully', async () => {
      const mockBook = { id: 'book1', title: 'Test Book' };
      const mockCopies: any[] = [];

      mockedBookModel.findById.mockResolvedValueOnce(mockBook as any);
      mockedCopyModel.find.mockResolvedValueOnce(mockCopies);
      mockedBookModel.findByIdAndDelete.mockResolvedValueOnce(mockBook as any);

      const result = await bookService.delete('book1');

      expect(mockedBookModel.findById).toHaveBeenCalledWith('book1');
      expect(mockedCopyModel.find).toHaveBeenCalledWith({ bookId: 'book1' });
      expect(mockedBookModel.findByIdAndDelete).toHaveBeenCalledWith('book1');
      expect(result).toEqual(mockBook);
    });

    it('should throw error if book not found', async () => {
      mockedBookModel.findById.mockResolvedValueOnce(null);

      await expect(bookService.delete('nonexistent')).rejects.toThrow("Book doesn't exist");
    });

    it('should throw error if book has existing copies', async () => {
      const mockBook = { id: 'book1', title: 'Test Book' };
      const mockCopies = [{ id: 'copy1', bookId: 'book1' }];

      mockedBookModel.findById.mockResolvedValueOnce(mockBook as any);
      mockedCopyModel.find.mockResolvedValueOnce(mockCopies);

      await expect(bookService.delete('book1')).rejects.toThrow("Cannot delete book with existing copies");
    });
  });

  describe('getBooksWithAvailableCopies', () => {
    it('should return books with available copies', async () => {
      const mockBooks = [
        { id: 'book1', title: 'Book 1' },
        { id: 'book2', title: 'Book 2' }
      ];

      mockedCopyModel.aggregate.mockResolvedValueOnce(mockBooks);
      mockedBookModel.populate.mockResolvedValueOnce(mockBooks as any);

      const result = await bookService.getBooksWithAvailableCopies();

      expect(mockedCopyModel.aggregate).toHaveBeenCalledWith([
        { $match: { status: 'AVAILABLE' } },
        { $group: { _id: '$bookId' } },
        { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
        { $unwind: '$book' },
        { $replaceRoot: { newRoot: '$book' } }
      ]);
      expect(mockedBookModel.populate).toHaveBeenCalledWith(mockBooks, { 
        path: 'categoryId', 
        select: 'name description' 
      });
      expect(result).toEqual(mockBooks);
    });
  });
});
