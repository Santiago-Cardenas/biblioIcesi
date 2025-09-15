import { categoryService } from '../src/services/category.service';
import { CategoryModel } from '../src/models/category.model';
import { CategoryInput } from '../src/interfaces/category.interface';

// Mock the CategoryModel
jest.mock('../src/models/category.model');

const mockedCategoryModel = CategoryModel as jest.Mocked<typeof CategoryModel>;

describe('CategoryService', () => {
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

      mockedCategoryModel.findOne.mockResolvedValueOnce(null);
      mockedCategoryModel.create.mockResolvedValueOnce(mockCategory as any);

      const result = await categoryService.create(categoryInput);

      expect(mockedCategoryModel.findOne).toHaveBeenCalledWith({ name: 'Fiction' });
      expect(mockedCategoryModel.create).toHaveBeenCalledWith(categoryInput);
      expect(result).toEqual(mockCategory);
    });

    it('should throw error if category already exists', async () => {
      const categoryInput: CategoryInput = {
        name: 'Fiction',
        description: 'Fiction books'
      };
      const existingCategory = { id: '1', ...categoryInput };

      mockedCategoryModel.findOne.mockResolvedValueOnce(existingCategory as any);

      await expect(categoryService.create(categoryInput)).rejects.toThrow('Category already exists');
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Fiction', description: 'Fiction books' },
        { id: '2', name: 'Non-Fiction', description: 'Non-fiction books' }
      ];

      mockedCategoryModel.find.mockResolvedValueOnce(mockCategories as any);

      const result = await categoryService.findAll();

      expect(mockedCategoryModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findById', () => {
    it('should return category by id', async () => {
      const mockCategory = { id: '1', name: 'Fiction', description: 'Fiction books' };

      mockedCategoryModel.findById.mockResolvedValueOnce(mockCategory as any);

      const result = await categoryService.findById('1');

      expect(mockedCategoryModel.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      mockedCategoryModel.findById.mockResolvedValueOnce(null);

      const result = await categoryService.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      const updateData = { name: 'Updated Fiction' };
      const mockUpdatedCategory = { id: '1', name: 'Updated Fiction', description: 'Fiction books' };

      mockedCategoryModel.findByIdAndUpdate.mockResolvedValueOnce(mockUpdatedCategory as any);

      const result = await categoryService.update('1', updateData);

      expect(mockedCategoryModel.findByIdAndUpdate).toHaveBeenCalledWith('1', updateData, { new: true });
      expect(result).toEqual(mockUpdatedCategory);
    });
  });

  describe('delete', () => {
    it('should delete category successfully', async () => {
      const mockCategory = { id: '1', name: 'Fiction' };

      mockedCategoryModel.findById.mockResolvedValueOnce(mockCategory as any);
      mockedCategoryModel.findByIdAndDelete.mockResolvedValueOnce({} as any);

      const result = await categoryService.delete('1');

      expect(mockedCategoryModel.findById).toHaveBeenCalledWith('1');
      expect(mockedCategoryModel.findByIdAndDelete).toHaveBeenCalledWith('1');
      expect(result).toBeDefined();
    });

    it('should throw error if category not found', async () => {
      mockedCategoryModel.findById.mockResolvedValueOnce(null);

      await expect(categoryService.delete('nonexistent')).rejects.toThrow("Category doesn't exist");
    });
  });
});
