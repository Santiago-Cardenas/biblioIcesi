import { copyService } from '../src/services/copy.service';
import { CopyModel, BookModel, LoanModel, CopyStatus, LoanStatus } from '../src/models';

jest.mock('../src/models');

const mockedCopyModel = CopyModel as jest.Mocked<typeof CopyModel>;
const mockedBookModel = BookModel as jest.Mocked<typeof BookModel>;
const mockedLoanModel = LoanModel as jest.Mocked<typeof LoanModel>;

describe('CopyService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create copy successfully', async () => {
      const mockBook = { id: 'book1', title: 'Test Book' };
      const mockCopy = { 
        id: 'copy1', 
        bookId: 'book1',
        code: 'C001',
        status: CopyStatus.AVAILABLE
      };

      mockedBookModel.findById.mockResolvedValueOnce(mockBook as any);
      mockedCopyModel.findOne.mockResolvedValueOnce(null);
      mockedCopyModel.create.mockResolvedValueOnce(mockCopy as any);

      const result = await copyService.create({
        bookId: 'book1',
        code: 'C001',
        status: CopyStatus.AVAILABLE
      });

      expect(mockedBookModel.findById).toHaveBeenCalledWith('book1');
      expect(mockedCopyModel.findOne).toHaveBeenCalledWith({ code: 'C001' });
      expect(mockedCopyModel.create).toHaveBeenCalledWith({
        bookId: 'book1',
        code: 'C001',
        status: CopyStatus.AVAILABLE
      });
      expect(result).toEqual(mockCopy);
    });

    it('should create copy with custom status', async () => {
      const mockBook = { id: 'book1', title: 'Test Book' };
      const mockCopy = { 
        id: 'copy1', 
        bookId: 'book1',
        code: 'C001',
        status: CopyStatus.DAMAGED
      };

      mockedBookModel.findById.mockResolvedValueOnce(mockBook as any);
      mockedCopyModel.findOne.mockResolvedValueOnce(null);
      mockedCopyModel.create.mockResolvedValueOnce(mockCopy as any);

      const result = await copyService.create({
        bookId: 'book1',
        code: 'C001',
        status: CopyStatus.DAMAGED
      });

      expect(mockedCopyModel.create).toHaveBeenCalledWith({
        bookId: 'book1',
        code: 'C001',
        status: CopyStatus.DAMAGED
      });
      expect(result).toEqual(mockCopy);
    });

    it('should throw error if book not found', async () => {
      mockedBookModel.findById.mockResolvedValueOnce(null);

      await expect(copyService.create({
        bookId: 'nonexistent',
        code: 'C001',
        status: CopyStatus.AVAILABLE
      })).rejects.toThrow('Book not found');
    });

    it('should throw error if copy code already exists', async () => {
      const mockBook = { id: 'book1', title: 'Test Book' };
      const existingCopy = { id: 'copy1', code: 'C001' };

      mockedBookModel.findById.mockResolvedValueOnce(mockBook as any);
      mockedCopyModel.findOne.mockResolvedValueOnce(existingCopy as any);

      await expect(copyService.create({
        bookId: 'book1',
        code: 'C001',
        status: CopyStatus.AVAILABLE
      })).rejects.toThrow('Copy code already exists');
    });
  });

  describe('findAll', () => {
    it('should return all copies with populated book data', async () => {
      const mockCopies = [
        { id: 'copy1', bookId: { title: 'Book 1' } },
        { id: 'copy2', bookId: { title: 'Book 2' } }
      ];

      mockedCopyModel.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockCopies)
      } as any);

      const result = await copyService.findAll();

      expect(mockedCopyModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockCopies);
    });
  });

  describe('findById', () => {
    it('should return copy by id with populated book data', async () => {
      const mockCopy = { id: 'copy1', bookId: { title: 'Test Book' } };

      mockedCopyModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockCopy)
      } as any);

      const result = await copyService.findById('copy1');

      expect(mockedCopyModel.findById).toHaveBeenCalledWith('copy1');
      expect(result).toEqual(mockCopy);
    });
  });

  describe('findByBook', () => {
    it('should return copies by book', async () => {
      const mockCopies = [
        { id: 'copy1', bookId: 'book1' },
        { id: 'copy2', bookId: 'book1' }
      ];

      mockedCopyModel.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockCopies)
      } as any);

      const result = await copyService.findByBook('book1');

      expect(mockedCopyModel.find).toHaveBeenCalledWith({ bookId: 'book1' });
      expect(result).toEqual(mockCopies);
    });
  });

  describe('findAvailableCopies', () => {
    it('should return available copies', async () => {
      const mockCopies = [
        { id: 'copy1', status: CopyStatus.AVAILABLE, bookId: { title: 'Book 1' } }
      ];

      mockedCopyModel.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockCopies)
      } as any);

      const result = await copyService.findAvailableCopies();

      expect(mockedCopyModel.find).toHaveBeenCalledWith({ status: CopyStatus.AVAILABLE });
      expect(result).toEqual(mockCopies);
    });
  });

  describe('findAvailableCopiesByBook', () => {
    it('should return available copies for specific book', async () => {
      const mockCopies = [
        { id: 'copy1', bookId: 'book1', status: CopyStatus.AVAILABLE }
      ];

      mockedCopyModel.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockCopies)
      } as any);

      const result = await copyService.findAvailableCopiesByBook('book1');

      expect(mockedCopyModel.find).toHaveBeenCalledWith({ 
        bookId: 'book1', 
        status: CopyStatus.AVAILABLE 
      });
      expect(result).toEqual(mockCopies);
    });
  });

  describe('update', () => {
    it('should update copy successfully', async () => {
      const mockCopy = { id: 'copy1', code: 'C001', bookId: 'book1' };
      const mockBook = { id: 'book1', title: 'Test Book' };
      const mockUpdatedCopy = { id: 'copy1', code: 'C002', bookId: 'book1' };

      mockedCopyModel.findById.mockResolvedValueOnce(mockCopy as any);
      mockedBookModel.findById.mockResolvedValueOnce(mockBook as any);
      mockedCopyModel.findByIdAndUpdate.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockUpdatedCopy)
      } as any);

      const result = await copyService.update('copy1', {
        code: 'C002',
        bookId: 'book1'
      });

      expect(mockedCopyModel.findById).toHaveBeenCalledWith('copy1');
      expect(mockedBookModel.findById).toHaveBeenCalledWith('book1');
      expect(mockedCopyModel.findByIdAndUpdate).toHaveBeenCalledWith('copy1', {
        code: 'C002',
        bookId: 'book1'
      }, { new: true });
      expect(result).toEqual(mockUpdatedCopy);
    });

    it('should throw error if copy not found', async () => {
      mockedCopyModel.findById.mockResolvedValueOnce(null);

      await expect(copyService.update('nonexistent', {
        code: 'C002'
      })).rejects.toThrow("Copy doesn't exist");
    });

    it('should throw error if new code already exists', async () => {
      const mockCopy = { id: 'copy1', code: 'C001', bookId: 'book1' };
      const existingCopy = { id: 'copy2', code: 'C002' };

      mockedCopyModel.findById.mockResolvedValueOnce(mockCopy as any);
      mockedCopyModel.findOne.mockResolvedValueOnce(existingCopy as any);

      await expect(copyService.update('copy1', {
        code: 'C002'
      })).rejects.toThrow('Copy code already exists');
    });

    it('should throw error if new book not found', async () => {
      const mockCopy = { id: 'copy1', code: 'C001', bookId: 'book1' };

      mockedCopyModel.findById.mockResolvedValueOnce(mockCopy as any);
      mockedBookModel.findById.mockResolvedValueOnce(null);

      await expect(copyService.update('copy1', {
        bookId: 'nonexistent'
      })).rejects.toThrow('Book not found');
    });
  });

  describe('updateStatus', () => {
    it('should update copy status successfully', async () => {
      const mockCopy = { id: 'copy1', status: CopyStatus.AVAILABLE };
      const mockUpdatedCopy = { id: 'copy1', status: CopyStatus.DAMAGED };

      mockedCopyModel.findById.mockResolvedValueOnce(mockCopy as any);
      mockedCopyModel.findByIdAndUpdate.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockUpdatedCopy)
      } as any);

      const result = await copyService.updateStatus('copy1', CopyStatus.DAMAGED);

      expect(mockedCopyModel.findById).toHaveBeenCalledWith('copy1');
      expect(mockedCopyModel.findByIdAndUpdate).toHaveBeenCalledWith('copy1', { status: CopyStatus.DAMAGED }, { new: true });
      expect(result).toEqual(mockUpdatedCopy);
    });

    it('should throw error if copy not found', async () => {
      mockedCopyModel.findById.mockResolvedValueOnce(null);

      await expect(copyService.updateStatus('nonexistent', CopyStatus.DAMAGED)).rejects.toThrow("Copy doesn't exist");
    });
  });

  describe('delete', () => {
    it('should delete copy successfully', async () => {
      const mockCopy = { id: 'copy1', bookId: 'book1' };

      mockedCopyModel.findById.mockResolvedValueOnce(mockCopy as any);
      mockedLoanModel.findOne.mockResolvedValueOnce(null);
      mockedCopyModel.findByIdAndDelete.mockResolvedValueOnce(mockCopy as any);

      const result = await copyService.delete('copy1');

      expect(mockedCopyModel.findById).toHaveBeenCalledWith('copy1');
      expect(mockedLoanModel.findOne).toHaveBeenCalledWith({
        copyId: 'copy1',
        status: { $in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE] }
      });
      expect(mockedCopyModel.findByIdAndDelete).toHaveBeenCalledWith('copy1');
      expect(result).toEqual(mockCopy);
    });

    it('should throw error if copy not found', async () => {
      mockedCopyModel.findById.mockResolvedValueOnce(null);

      await expect(copyService.delete('nonexistent')).rejects.toThrow("Copy doesn't exist");
    });

    it('should throw error if copy has active loan', async () => {
      const mockCopy = { id: 'copy1', bookId: 'book1' };
      const activeLoan = { id: 'loan1', copyId: 'copy1', status: LoanStatus.ACTIVE };

      mockedCopyModel.findById.mockResolvedValueOnce(mockCopy as any);
      mockedLoanModel.findOne.mockResolvedValueOnce(activeLoan as any);

      await expect(copyService.delete('copy1')).rejects.toThrow("Cannot delete copy with active loan");
    });
  });
});
