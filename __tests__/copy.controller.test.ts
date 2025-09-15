import { Request, Response } from 'express';
import { copyController } from '../src/controllers/copy.controller';
import { copyService } from '../src/services/copy.service';
import { CopyInput, CopyInputUpdate } from '../src/interfaces/copy.interface';
import { CopyStatus } from '../src/models/copy.model';

// Mock the copy service
jest.mock('../src/services/copy.service');

const mockedCopyService = copyService as jest.Mocked<typeof copyService>;

describe('CopyController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {};
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create copy successfully', async () => {
      const copyInput: CopyInput = {
        bookId: 'book1',
        code: 'COPY001',
        status: CopyStatus.AVAILABLE
      };
      const mockCopy = { id: '1', ...copyInput };

      mockRequest.body = copyInput;
      mockedCopyService.create.mockResolvedValueOnce(mockCopy as any);

      await copyController.create(mockRequest as Request, mockResponse as Response);

      expect(mockedCopyService.create).toHaveBeenCalledWith(copyInput);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockCopy);
    });

    it('should handle ReferenceError', async () => {
      const copyInput: CopyInput = {
        bookId: 'book1',
        code: 'COPY001',
        status: CopyStatus.AVAILABLE
      };

      mockRequest.body = copyInput;
      mockedCopyService.create.mockRejectedValueOnce(new ReferenceError('Book not found'));

      await copyController.create(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Book not found' });
    });

    it('should handle other errors', async () => {
      const copyInput: CopyInput = {
        bookId: 'book1',
        code: 'COPY001',
        status: CopyStatus.AVAILABLE
      };

      mockRequest.body = copyInput;
      mockedCopyService.create.mockRejectedValueOnce(new Error('Database error'));

      await copyController.create(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Internal server error", error: expect.any(Error) });
    });
  });

  describe('getAll', () => {
    it('should get all copies when no query params', async () => {
      const mockCopies = [
        { id: '1', bookId: 'book1', code: 'COPY001', status: CopyStatus.AVAILABLE },
        { id: '2', bookId: 'book2', code: 'COPY002', status: CopyStatus.LOANED }
      ];

      mockRequest.query = {};
      mockedCopyService.findAll.mockResolvedValueOnce(mockCopies as any);

      await copyController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedCopyService.findAll).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockCopies);
    });

    it('should get copies by bookId', async () => {
      const mockCopies = [
        { id: '1', bookId: 'book1', code: 'COPY001', status: CopyStatus.AVAILABLE }
      ];

      mockRequest.query = { bookId: 'book1' };
      mockedCopyService.findByBook.mockResolvedValueOnce(mockCopies as any);

      await copyController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedCopyService.findByBook).toHaveBeenCalledWith('book1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockCopies);
    });

    it('should get available copies when available=true', async () => {
      const mockCopies = [
        { id: '1', bookId: 'book1', code: 'COPY001', status: CopyStatus.AVAILABLE }
      ];

      mockRequest.query = { available: 'true' };
      mockedCopyService.findAvailableCopies.mockResolvedValueOnce(mockCopies as any);

      await copyController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedCopyService.findAvailableCopies).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockCopies);
    });

    it('should get available copies when status=AVAILABLE', async () => {
      const mockCopies = [
        { id: '1', bookId: 'book1', code: 'COPY001', status: CopyStatus.AVAILABLE }
      ];

      mockRequest.query = { status: 'AVAILABLE' };
      mockedCopyService.findAvailableCopies.mockResolvedValueOnce(mockCopies as any);

      await copyController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedCopyService.findAvailableCopies).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockCopies);
    });

    it('should handle errors', async () => {
      mockRequest.query = {};
      mockedCopyService.findAll.mockRejectedValueOnce(new Error('Database error'));

      await copyController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Internal server error", error: expect.any(Error) });
    });
  });

  describe('getOne', () => {
    it('should get copy by id', async () => {
      const mockCopy = { id: '1', bookId: 'book1', code: 'COPY001', status: CopyStatus.AVAILABLE };

      mockRequest.params = { id: '1' };
      mockedCopyService.findById.mockResolvedValueOnce(mockCopy as any);

      await copyController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockedCopyService.findById).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockCopy);
    });

    it('should return 404 if copy not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockedCopyService.findById.mockResolvedValueOnce(null);

      await copyController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Copy not found' });
    });

    it('should handle errors', async () => {
      mockRequest.params = { id: '1' };
      mockedCopyService.findById.mockRejectedValueOnce(new Error('Database error'));

      await copyController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Internal server error", error: expect.any(Error) });
    });
  });

  describe('update', () => {
    it('should update copy successfully', async () => {
      const updateData: CopyInputUpdate = { status: CopyStatus.LOANED };
      const mockUpdatedCopy = { id: '1', bookId: 'book1', code: 'COPY001', status: CopyStatus.LOANED };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      mockedCopyService.update.mockResolvedValueOnce(mockUpdatedCopy as any);

      await copyController.update(mockRequest as Request, mockResponse as Response);

      expect(mockedCopyService.update).toHaveBeenCalledWith('1', updateData);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockUpdatedCopy);
    });

    it('should return 404 if copy not found', async () => {
      const updateData: CopyInputUpdate = { status: CopyStatus.LOANED };

      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = updateData;
      mockedCopyService.update.mockResolvedValueOnce(null);

      await copyController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Copy not found' });
    });

    it('should handle ReferenceError', async () => {
      const updateData: CopyInputUpdate = { status: CopyStatus.LOANED };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      mockedCopyService.update.mockRejectedValueOnce(new ReferenceError('Invalid data'));

      await copyController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid data' });
    });

    it('should handle other errors', async () => {
      const updateData: CopyInputUpdate = { status: CopyStatus.LOANED };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      mockedCopyService.update.mockRejectedValueOnce(new Error('Database error'));

      await copyController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Internal server error", error: expect.any(Error) });
    });
  });

  describe('updateStatus', () => {
    it('should update copy status successfully', async () => {
      const mockUpdatedCopy = { id: '1', bookId: 'book1', code: 'COPY001', status: CopyStatus.LOANED };

      mockRequest.params = { id: '1' };
      mockRequest.body = { status: CopyStatus.LOANED };
      mockedCopyService.updateStatus.mockResolvedValueOnce(mockUpdatedCopy as any);

      await copyController.updateStatus(mockRequest as Request, mockResponse as Response);

      expect(mockedCopyService.updateStatus).toHaveBeenCalledWith('1', CopyStatus.LOANED);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockUpdatedCopy);
    });

    it('should return 400 for invalid status', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'INVALID_STATUS' };

      await copyController.updateStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid status' });
    });

    it('should return 404 if copy not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { status: CopyStatus.LOANED };
      mockedCopyService.updateStatus.mockResolvedValueOnce(null);

      await copyController.updateStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Copy not found' });
    });

    it('should handle ReferenceError', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: CopyStatus.LOANED };
      mockedCopyService.updateStatus.mockRejectedValueOnce(new ReferenceError('Invalid status'));

      await copyController.updateStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid status' });
    });

    it('should handle other errors', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: CopyStatus.LOANED };
      mockedCopyService.updateStatus.mockRejectedValueOnce(new Error('Database error'));

      await copyController.updateStatus(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Internal server error", error: expect.any(Error) });
    });
  });

  describe('delete', () => {
    it('should delete copy successfully', async () => {
      mockRequest.params = { id: '1' };
      mockedCopyService.delete.mockResolvedValueOnce({} as any);

      await copyController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockedCopyService.delete).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Copy deleted successfully' });
    });

    it('should handle ReferenceError', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockedCopyService.delete.mockRejectedValueOnce(new ReferenceError("Copy doesn't exist"));

      await copyController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: "Copy doesn't exist" });
    });

    it('should handle other errors', async () => {
      mockRequest.params = { id: '1' };
      mockedCopyService.delete.mockRejectedValueOnce(new Error('Database error'));

      await copyController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: "Internal server error", error: expect.any(Error) });
    });
  });
});
