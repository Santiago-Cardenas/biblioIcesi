import { Request, Response } from 'express';
import { categoryController } from '../src/controllers/category.controller';
import { categoryService } from '../src/services/category.service';
import { CategoryInput } from '../src/interfaces/category.interface';

// Mock the category service
jest.mock('../src/services/category.service');

const mockedCategoryService = categoryService as jest.Mocked<typeof categoryService>;

describe('CategoryController', () => {
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
    it('should create category successfully', async () => {
      const categoryInput: CategoryInput = {
        name: 'Fiction',
        description: 'Fiction books'
      };
      const mockCategory = { id: '1', ...categoryInput };

      mockRequest.body = categoryInput;
      mockedCategoryService.create.mockResolvedValueOnce(mockCategory as any);

      await categoryController.create(mockRequest as Request, mockResponse as Response);

      expect(mockedCategoryService.create).toHaveBeenCalledWith(categoryInput);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockCategory);
    });

    it('should handle ReferenceError', async () => {
      const categoryInput: CategoryInput = {
        name: 'Fiction',
        description: 'Fiction books'
      };

      mockRequest.body = categoryInput;
      mockedCategoryService.create.mockRejectedValueOnce(new ReferenceError('Category already exists'));

      await categoryController.create(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Category already exists' });
    });

    it('should handle other errors', async () => {
      const categoryInput: CategoryInput = {
        name: 'Fiction',
        description: 'Fiction books'
      };

      mockRequest.body = categoryInput;
      mockedCategoryService.create.mockRejectedValueOnce(new Error('Database error'));

      await categoryController.create(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getAll', () => {
    it('should get all categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Fiction', description: 'Fiction books' },
        { id: '2', name: 'Non-Fiction', description: 'Non-fiction books' }
      ];

      mockedCategoryService.findAll.mockResolvedValueOnce(mockCategories as any);

      await categoryController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedCategoryService.findAll).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockCategories);
    });

    it('should handle errors', async () => {
      mockedCategoryService.findAll.mockRejectedValueOnce(new Error('Database error'));

      await categoryController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getOne', () => {
    it('should get category by id', async () => {
      const mockCategory = { id: '1', name: 'Fiction', description: 'Fiction books' };

      mockRequest.params = { id: '1' };
      mockedCategoryService.findById.mockResolvedValueOnce(mockCategory as any);

      await categoryController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockedCategoryService.findById).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockCategory);
    });

    it('should return 404 if category not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockedCategoryService.findById.mockResolvedValueOnce(null);

      await categoryController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Category not found' });
    });

    it('should handle errors', async () => {
      mockRequest.params = { id: '1' };
      mockedCategoryService.findById.mockRejectedValueOnce(new Error('Database error'));

      await categoryController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      const updateData = { name: 'Updated Fiction' };
      const mockUpdatedCategory = { id: '1', name: 'Updated Fiction', description: 'Fiction books' };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      mockedCategoryService.update.mockResolvedValueOnce(mockUpdatedCategory as any);

      await categoryController.update(mockRequest as Request, mockResponse as Response);

      expect(mockedCategoryService.update).toHaveBeenCalledWith('1', updateData);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockUpdatedCategory);
    });

    it('should return 404 if category not found', async () => {
      const updateData = { name: 'Updated Fiction' };

      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = updateData;
      mockedCategoryService.update.mockResolvedValueOnce(null);

      await categoryController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Category not found' });
    });

    it('should handle errors', async () => {
      const updateData = { name: 'Updated Fiction' };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      mockedCategoryService.update.mockRejectedValueOnce(new Error('Database error'));

      await categoryController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('delete', () => {
    it('should delete category successfully', async () => {
      mockRequest.params = { id: '1' };
      mockedCategoryService.delete.mockResolvedValueOnce({} as any);

      await categoryController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockedCategoryService.delete).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Category deleted successfully' });
    });

    it('should handle ReferenceError', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockedCategoryService.delete.mockRejectedValueOnce(new ReferenceError("Category doesn't exist"));

      await categoryController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: "Category doesn't exist" });
    });

    it('should handle other errors', async () => {
      mockRequest.params = { id: '1' };
      mockedCategoryService.delete.mockRejectedValueOnce(new Error('Database error'));

      await categoryController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
