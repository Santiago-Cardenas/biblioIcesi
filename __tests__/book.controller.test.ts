import { Request, Response } from 'express';
import { bookController } from '../src/controllers/book.controller';
import { bookService } from '../src/services/book.service';

jest.mock('../src/services/book.service');

const mockedBookService = bookService as jest.Mocked<typeof bookService>;

describe('BookController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create book successfully', async () => {
      const mockBook = {
        id: '1',
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        categoryId: 'cat1'
      };

      mockRequest = {
        body: {
          title: 'Test Book',
          author: 'Test Author',
          isbn: '1234567890',
          categoryId: 'cat1'
        }
      };

      mockedBookService.create.mockResolvedValueOnce(mockBook as any);

      await bookController.create(mockRequest as Request, mockResponse as Response);

      expect(mockedBookService.create).toHaveBeenCalledWith({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        categoryId: 'cat1'
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockBook);
    });

    it('should handle reference error', async () => {
      mockRequest = {
        body: {
          title: 'Test Book',
          author: 'Test Author',
          isbn: '1234567890',
          categoryId: 'cat1'
        }
      };

      mockedBookService.create.mockRejectedValueOnce(new ReferenceError('Category not found'));

      await bookController.create(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Category not found' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        body: {
          title: 'Test Book',
          author: 'Test Author',
          isbn: '1234567890',
          categoryId: 'cat1'
        }
      };

      mockedBookService.create.mockRejectedValueOnce(new Error('Database error'));

      await bookController.create(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('getAll', () => {
    it('should return all books when no query parameters', async () => {
      const mockBooks = [
        { id: '1', title: 'Book 1', author: 'Author 1' },
        { id: '2', title: 'Book 2', author: 'Author 2' }
      ];

      mockRequest = { query: {} };

      mockedBookService.findAll.mockResolvedValueOnce(mockBooks as any);

      await bookController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedBookService.findAll).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockBooks);
    });

    it('should search books when search query parameter is provided', async () => {
      const mockBooks = [
        { id: '1', title: 'Test Book', author: 'Test Author' }
      ];

      mockRequest = { query: { search: 'test' } };

      mockedBookService.search.mockResolvedValueOnce(mockBooks as any);

      await bookController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedBookService.search).toHaveBeenCalledWith('test');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockBooks);
    });

    it('should filter by category when category query parameter is provided', async () => {
      const mockBooks = [
        { id: '1', title: 'Fiction Book', categoryId: 'cat1' }
      ];

      mockRequest = { query: { category: 'cat1' } };

      mockedBookService.findByCategory.mockResolvedValueOnce(mockBooks as any);

      await bookController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedBookService.findByCategory).toHaveBeenCalledWith('cat1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockBooks);
    });

    it('should return books with available copies when available=true', async () => {
      const mockBooks = [
        { id: '1', title: 'Available Book', copies: [{ status: 'AVAILABLE' }] }
      ];

      mockRequest = { query: { available: 'true' } };

      mockedBookService.getBooksWithAvailableCopies.mockResolvedValueOnce(mockBooks as any);

      await bookController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedBookService.getBooksWithAvailableCopies).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockBooks);
    });

    it('should handle internal server error', async () => {
      mockRequest = { query: {} };

      mockedBookService.findAll.mockRejectedValueOnce(new Error('Database error'));

      await bookController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('getOne', () => {
    it('should return book by id', async () => {
      const mockBook = { id: '1', title: 'Test Book', author: 'Test Author' };

      mockRequest = {
        params: { id: '1' }
      };

      mockedBookService.findById.mockResolvedValueOnce(mockBook as any);

      await bookController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockedBookService.findById).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockBook);
    });

    it('should return 404 when book not found', async () => {
      mockRequest = {
        params: { id: 'nonexistent' }
      };

      mockedBookService.findById.mockResolvedValueOnce(null);

      await bookController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Book not found' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedBookService.findById.mockRejectedValueOnce(new Error('Database error'));

      await bookController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('update', () => {
    it('should update book successfully', async () => {
      const mockUpdatedBook = { 
        id: '1', 
        title: 'Updated Book', 
        author: 'Updated Author' 
      };

      mockRequest = {
        params: { id: '1' },
        body: { title: 'Updated Book', author: 'Updated Author' }
      };

      mockedBookService.update.mockResolvedValueOnce(mockUpdatedBook as any);

      await bookController.update(mockRequest as Request, mockResponse as Response);

      expect(mockedBookService.update).toHaveBeenCalledWith('1', {
        title: 'Updated Book',
        author: 'Updated Author'
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockUpdatedBook);
    });

    it('should return 404 when book not found', async () => {
      mockRequest = {
        params: { id: 'nonexistent' },
        body: { title: 'Updated Book' }
      };

      mockedBookService.update.mockResolvedValueOnce(null);

      await bookController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Book not found' });
    });

    it('should handle reference error', async () => {
      mockRequest = {
        params: { id: '1' },
        body: { title: 'Updated Book' }
      };

      mockedBookService.update.mockRejectedValueOnce(new ReferenceError('Category not found'));

      await bookController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Category not found' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        params: { id: '1' },
        body: { title: 'Updated Book' }
      };

      mockedBookService.update.mockRejectedValueOnce(new Error('Database error'));

      await bookController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('delete', () => {
    it('should delete book successfully', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedBookService.delete.mockResolvedValueOnce({} as any);

      await bookController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockedBookService.delete).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Book deleted successfully' });
    });

    it('should handle reference error', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedBookService.delete.mockRejectedValueOnce(new ReferenceError('Cannot delete book with existing copies'));

      await bookController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Cannot delete book with existing copies' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedBookService.delete.mockRejectedValueOnce(new Error('Database error'));

      await bookController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });
});
