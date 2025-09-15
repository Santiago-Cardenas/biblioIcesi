import { loanService } from '../src/services/loan.service';
import { LoanModel, UserModel, CopyModel, CopyStatus, LoanStatus } from '../src/models';

jest.mock('../src/models');

const mockedLoanModel = LoanModel as jest.Mocked<typeof LoanModel>;
const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockedCopyModel = CopyModel as jest.Mocked<typeof CopyModel>;

describe('LoanService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create loan successfully', async () => {
      const mockUser = { id: 'user1', name: 'Test User' };
      const mockCopy = { id: 'copy1', status: CopyStatus.AVAILABLE };
      const mockLoan = { 
        id: 'loan1', 
        userId: 'user1', 
        copyId: 'copy1',
        status: LoanStatus.ACTIVE
      };

      mockedUserModel.findById.mockResolvedValueOnce(mockUser as any);
      mockedCopyModel.findById.mockResolvedValueOnce(mockCopy as any);
      
      // Create a mock that has the populate method
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockLoan)
      };
      mockedLoanModel.create.mockReturnValueOnce(mockQuery as any);
      mockedCopyModel.findByIdAndUpdate.mockResolvedValueOnce(mockCopy as any);

      const result = await loanService.create({
        userId: 'user1',
        copyId: 'copy1',
        dueDate: new Date('2024-12-31')
      });

      expect(mockedUserModel.findById).toHaveBeenCalledWith('user1');
      expect(mockedCopyModel.findById).toHaveBeenCalledWith('copy1');
      expect(mockQuery.populate).toHaveBeenCalledWith([
        { path: 'userId', select: 'name email' },
        { path: 'copyId', populate: { path: 'bookId', select: 'title author isbn' } }
      ]);
      expect(mockedCopyModel.findByIdAndUpdate).toHaveBeenCalledWith('copy1', { status: CopyStatus.LOANED });
      expect(result).toEqual(mockLoan);
    });

    it('should throw error if user not found', async () => {
      mockedUserModel.findById.mockResolvedValueOnce(null);

      await expect(loanService.create({
        userId: 'nonexistent',
        copyId: 'copy1',
        dueDate: new Date('2024-12-31')
      })).rejects.toThrow('User not found');
    });

    it('should throw error if copy not found', async () => {
      const mockUser = { id: 'user1', name: 'Test User' };

      mockedUserModel.findById.mockResolvedValueOnce(mockUser as any);
      mockedCopyModel.findById.mockResolvedValueOnce(null);

      await expect(loanService.create({
        userId: 'user1',
        copyId: 'nonexistent',
        dueDate: new Date('2024-12-31')
      })).rejects.toThrow('Copy not found');
    });

    it('should throw error if copy is not available', async () => {
      const mockUser = { id: 'user1', name: 'Test User' };
      const mockCopy = { id: 'copy1', status: CopyStatus.LOANED };

      mockedUserModel.findById.mockResolvedValueOnce(mockUser as any);
      mockedCopyModel.findById.mockResolvedValueOnce(mockCopy as any);

      await expect(loanService.create({
        userId: 'user1',
        copyId: 'copy1',
        dueDate: new Date('2024-12-31')
      })).rejects.toThrow('Copy is not available for loan');
    });

    it('should use default due date if not provided', async () => {
      const mockUser = { id: 'user1', name: 'Test User' };
      const mockCopy = { id: 'copy1', status: CopyStatus.AVAILABLE };
      const mockLoan = { 
        id: 'loan1', 
        userId: 'user1', 
        copyId: 'copy1',
        status: LoanStatus.ACTIVE
      };

      mockedUserModel.findById.mockResolvedValueOnce(mockUser as any);
      mockedCopyModel.findById.mockResolvedValueOnce(mockCopy as any);
      const mockPopulatedLoan = { ...mockLoan, populate: jest.fn().mockResolvedValueOnce(mockLoan) };
      mockedLoanModel.create.mockResolvedValueOnce(mockPopulatedLoan as any);
      mockedCopyModel.findByIdAndUpdate.mockResolvedValueOnce(mockCopy as any);

      await loanService.create({
        userId: 'user1',
        copyId: 'copy1',
        dueDate: new Date('2024-12-31')
      });

      expect(mockedLoanModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          copyId: 'copy1',
          status: LoanStatus.ACTIVE,
          dueDate: expect.any(Date)
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return all loans with populated data', async () => {
      const mockLoans = [
        { id: 'loan1', userId: { name: 'User 1' }, copyId: { bookId: { title: 'Book 1' } } }
      ];

      mockedLoanModel.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockLoans)
      } as any);

      const result = await loanService.findAll();

      expect(mockedLoanModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockLoans);
    });
  });

  describe('findById', () => {
    it('should return loan by id with populated data', async () => {
      const mockLoan = { id: 'loan1', userId: { name: 'User 1' }, copyId: { bookId: { title: 'Book 1' } } };

      mockedLoanModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockLoan)
      } as any);

      const result = await loanService.findById('loan1');

      expect(mockedLoanModel.findById).toHaveBeenCalledWith('loan1');
      expect(result).toEqual(mockLoan);
    });
  });

  describe('findByUser', () => {
    it('should return loans by user', async () => {
      const mockLoans = [
        { id: 'loan1', userId: 'user1', copyId: { bookId: { title: 'Book 1' } } }
      ];

      mockedLoanModel.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockLoans)
      } as any);

      const result = await loanService.findByUser('user1');

      expect(mockedLoanModel.find).toHaveBeenCalledWith({ userId: 'user1' });
      expect(result).toEqual(mockLoans);
    });
  });

  describe('findActiveLoans', () => {
    it('should return active loans', async () => {
      const mockLoans = [
        { id: 'loan1', status: LoanStatus.ACTIVE, userId: { name: 'User 1' } }
      ];

      mockedLoanModel.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockLoans)
      } as any);

      const result = await loanService.findActiveLoans();

      expect(mockedLoanModel.find).toHaveBeenCalledWith({ status: LoanStatus.ACTIVE });
      expect(result).toEqual(mockLoans);
    });
  });

  describe('findOverdueLoans', () => {
    it('should return overdue loans', async () => {
      const mockLoans = [
        { id: 'loan1', status: LoanStatus.ACTIVE, dueDate: new Date('2023-01-01') }
      ];

      mockedLoanModel.find.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockLoans)
      } as any);

      const result = await loanService.findOverdueLoans();

      expect(mockedLoanModel.find).toHaveBeenCalledWith({
        status: LoanStatus.ACTIVE,
        dueDate: { $lt: expect.any(Date) }
      });
      expect(result).toEqual(mockLoans);
    });
  });

  describe('returnLoan', () => {
    it('should return loan successfully', async () => {
      const mockLoan = { id: 'loan1', status: LoanStatus.ACTIVE, copyId: 'copy1' };
      const mockUpdatedLoan = { id: 'loan1', status: LoanStatus.RETURNED, returnedAt: expect.any(Date) };

      mockedLoanModel.findById.mockResolvedValueOnce(mockLoan as any);
      
      // Create a mock that has the populate method
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockUpdatedLoan)
      };
      mockedLoanModel.findByIdAndUpdate.mockReturnValueOnce(mockQuery as any);
      mockedCopyModel.findByIdAndUpdate.mockResolvedValueOnce({} as any);

      const result = await loanService.returnLoan('loan1');

      expect(mockedLoanModel.findById).toHaveBeenCalledWith('loan1');
      expect(mockedLoanModel.findByIdAndUpdate).toHaveBeenCalledWith('loan1', {
        status: LoanStatus.RETURNED,
        returnedAt: expect.any(Date)
      }, { new: true });
      expect(mockQuery.populate).toHaveBeenCalledWith([
        { path: 'userId', select: 'name email' },
        { path: 'copyId', populate: { path: 'bookId', select: 'title author isbn' } }
      ]);
      expect(mockedCopyModel.findByIdAndUpdate).toHaveBeenCalledWith('copy1', { status: CopyStatus.AVAILABLE });
      expect(result).toEqual(mockUpdatedLoan);
    });

    it('should throw error if loan not found', async () => {
      mockedLoanModel.findById.mockResolvedValueOnce(null);

      await expect(loanService.returnLoan('nonexistent')).rejects.toThrow('Loan not found');
    });

    it('should throw error if loan is not active', async () => {
      const mockLoan = { id: 'loan1', status: LoanStatus.RETURNED };

      mockedLoanModel.findById.mockResolvedValueOnce(mockLoan as any);

      await expect(loanService.returnLoan('loan1')).rejects.toThrow('Loan is not active');
    });
  });

  describe('update', () => {
    it('should update loan successfully', async () => {
      const mockLoan = { id: 'loan1', status: LoanStatus.ACTIVE };
      const mockUpdatedLoan = { id: 'loan1', status: LoanStatus.OVERDUE };

      mockedLoanModel.findById.mockResolvedValueOnce(mockLoan as any);
      
      // Create a mock that has the populate method
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(mockUpdatedLoan)
      };
      mockedLoanModel.findByIdAndUpdate.mockReturnValueOnce(mockQuery as any);

      const result = await loanService.update('loan1', { status: LoanStatus.OVERDUE });

      expect(mockedLoanModel.findById).toHaveBeenCalledWith('loan1');
      expect(mockedLoanModel.findByIdAndUpdate).toHaveBeenCalledWith('loan1', { status: LoanStatus.OVERDUE }, { new: true });
      expect(mockQuery.populate).toHaveBeenCalledWith([
        { path: 'userId', select: 'name email' },
        { path: 'copyId', populate: { path: 'bookId', select: 'title author isbn' } }
      ]);
      expect(result).toEqual(mockUpdatedLoan);
    });

    it('should throw error if loan not found', async () => {
      mockedLoanModel.findById.mockResolvedValueOnce(null);

      await expect(loanService.update('nonexistent', { status: LoanStatus.OVERDUE })).rejects.toThrow("Loan doesn't exist");
    });
  });

  describe('delete', () => {
    it('should delete loan successfully', async () => {
      const mockLoan = { id: 'loan1', status: LoanStatus.ACTIVE, copyId: 'copy1' };

      mockedLoanModel.findById.mockResolvedValueOnce(mockLoan as any);
      mockedCopyModel.findByIdAndUpdate.mockResolvedValueOnce({} as any);
      mockedLoanModel.findByIdAndDelete.mockResolvedValueOnce(mockLoan as any);

      const result = await loanService.delete('loan1');

      expect(mockedLoanModel.findById).toHaveBeenCalledWith('loan1');
      expect(mockedCopyModel.findByIdAndUpdate).toHaveBeenCalledWith('copy1', { status: CopyStatus.AVAILABLE });
      expect(mockedLoanModel.findByIdAndDelete).toHaveBeenCalledWith('loan1');
      expect(result).toEqual(mockLoan);
    });

    it('should throw error if loan not found', async () => {
      mockedLoanModel.findById.mockResolvedValueOnce(null);

      await expect(loanService.delete('nonexistent')).rejects.toThrow("Loan doesn't exist");
    });

    it('should not update copy status if loan is not active', async () => {
      const mockLoan = { id: 'loan1', status: LoanStatus.RETURNED, copyId: 'copy1' };

      mockedLoanModel.findById.mockResolvedValueOnce(mockLoan as any);
      mockedLoanModel.findByIdAndDelete.mockResolvedValueOnce(mockLoan as any);

      await loanService.delete('loan1');

      expect(mockedCopyModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('updateOverdueLoans', () => {
    it('should update overdue loans status', async () => {
      mockedLoanModel.updateMany.mockResolvedValueOnce({ modifiedCount: 2 } as any);

      await loanService.updateOverdueLoans();

      expect(mockedLoanModel.updateMany).toHaveBeenCalledWith(
        {
          status: LoanStatus.ACTIVE,
          dueDate: { $lt: expect.any(Date) }
        },
        { status: LoanStatus.OVERDUE }
      );
    });
  });
});
