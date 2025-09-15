import { Request, Response } from 'express';
import { loanController } from '../src/controllers/loan.controller';
import { loanService, reservationService } from '../src/services';
import { LoanModel } from '../src/models/loan.model';
import { UserRole } from '../src/models';

jest.mock('../src/services');
jest.mock('../src/models/loan.model');

const mockedLoanService = loanService as jest.Mocked<typeof loanService>;
const mockedReservationService = reservationService as jest.Mocked<typeof reservationService>;
const mockedLoanModel = LoanModel as jest.Mocked<typeof LoanModel>;

describe('LoanController', () => {
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
    it('should create loan successfully', async () => {
      const mockLoan = {
        id: '1',
        userId: 'user1',
        copyId: 'copy1',
        status: 'ACTIVE'
      };

      mockRequest = {
        body: {
          userId: 'user1',
          copyId: 'copy1',
          dueDate: new Date('2024-12-31')
        }
      };

      mockedLoanService.create.mockResolvedValueOnce(mockLoan as any);

      await loanController.create(mockRequest as Request, mockResponse as Response);

      expect(mockedLoanService.create).toHaveBeenCalledWith({
        userId: 'user1',
        copyId: 'copy1',
        dueDate: new Date('2024-12-31')
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockLoan);
    });

    it('should handle reference error', async () => {
      mockRequest = {
        body: {
          userId: 'user1',
          copyId: 'copy1',
          dueDate: new Date('2024-12-31')
        }
      };

      mockedLoanService.create.mockRejectedValueOnce(new ReferenceError('User not found'));

      await loanController.create(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        body: {
          userId: 'user1',
          copyId: 'copy1',
          dueDate: new Date('2024-12-31')
        }
      };

      mockedLoanService.create.mockRejectedValueOnce(new Error('Database error'));

      await loanController.create(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('getAll', () => {
    it('should return all loans when no query parameters', async () => {
      const mockLoans = [
        { id: '1', userId: 'user1', copyId: 'copy1' },
        { id: '2', userId: 'user2', copyId: 'copy2' }
      ];

      mockRequest = { query: {} };

      mockedLoanService.findAll.mockResolvedValueOnce(mockLoans as any);

      await loanController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedLoanService.findAll).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockLoans);
    });

    it('should filter by user when userId query parameter is provided', async () => {
      const mockLoans = [
        { id: '1', userId: 'user1', copyId: 'copy1' }
      ];

      mockRequest = { query: { userId: 'user1' } };

      mockedLoanService.findByUser.mockResolvedValueOnce(mockLoans as any);

      await loanController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedLoanService.findByUser).toHaveBeenCalledWith('user1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockLoans);
    });

    it('should filter by active status when status=ACTIVE', async () => {
      const mockLoans = [
        { id: '1', userId: 'user1', copyId: 'copy1', status: 'ACTIVE' }
      ];

      mockRequest = { query: { status: 'ACTIVE' } };

      mockedLoanService.findActiveLoans.mockResolvedValueOnce(mockLoans as any);

      await loanController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedLoanService.findActiveLoans).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockLoans);
    });

    it('should filter overdue loans when overdue=true', async () => {
      const mockLoans = [
        { id: '1', userId: 'user1', copyId: 'copy1', status: 'OVERDUE' }
      ];

      mockRequest = { query: { overdue: 'true' } };

      mockedLoanService.findOverdueLoans.mockResolvedValueOnce(mockLoans as any);

      await loanController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedLoanService.findOverdueLoans).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockLoans);
    });

    it('should handle internal server error', async () => {
      mockRequest = { query: {} };

      mockedLoanService.findAll.mockRejectedValueOnce(new Error('Database error'));

      await loanController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('getOne', () => {
    it('should return loan by id', async () => {
      const mockLoan = { id: '1', userId: 'user1', copyId: 'copy1' };

      mockRequest = {
        params: { id: '1' }
      };

      mockedLoanService.findById.mockResolvedValueOnce(mockLoan as any);

      await loanController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockedLoanService.findById).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockLoan);
    });

    it('should return 404 when loan not found', async () => {
      mockRequest = {
        params: { id: 'nonexistent' }
      };

      mockedLoanService.findById.mockResolvedValueOnce(null);

      await loanController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Loan not found' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedLoanService.findById.mockRejectedValueOnce(new Error('Database error'));

      await loanController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('returnLoan', () => {
    it('should return loan successfully', async () => {
      const mockLoan = { 
        id: '1', 
        userId: 'user1', 
        copyId: 'copy1',
        _id: '1'
      };
      const mockPopulatedLoan = {
        copyId: {
          bookId: { _id: 'book1' }
        }
      };

      mockRequest = {
        params: { id: '1' }
      };

      mockedLoanService.returnLoan.mockResolvedValueOnce(mockLoan as any);
      mockedLoanModel.findById.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(mockPopulatedLoan)
      } as any);
      mockedReservationService.processReservationsForBook.mockResolvedValueOnce(undefined);

      await loanController.returnLoan(mockRequest as Request, mockResponse as Response);

      expect(mockedLoanService.returnLoan).toHaveBeenCalledWith('1');
      expect(mockedLoanModel.findById).toHaveBeenCalledWith('1');
      expect(mockedReservationService.processReservationsForBook).toHaveBeenCalledWith('book1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: 'Loan returned successfully', 
        loan: mockLoan 
      });
    });

    it('should return 404 when loan not found', async () => {
      mockRequest = {
        params: { id: 'nonexistent' }
      };

      mockedLoanService.returnLoan.mockResolvedValueOnce(null);

      await loanController.returnLoan(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Loan not found' });
    });

    it('should handle reference error', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedLoanService.returnLoan.mockRejectedValueOnce(new ReferenceError('Loan not found'));

      await loanController.returnLoan(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Loan not found' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedLoanService.returnLoan.mockRejectedValueOnce(new Error('Database error'));

      await loanController.returnLoan(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('update', () => {
    it('should update loan successfully', async () => {
      const mockUpdatedLoan = { 
        id: '1', 
        userId: 'user1', 
        copyId: 'copy1',
        status: 'OVERDUE'
      };

      mockRequest = {
        params: { id: '1' },
        body: { status: 'OVERDUE' }
      };

      mockedLoanService.update.mockResolvedValueOnce(mockUpdatedLoan as any);

      await loanController.update(mockRequest as Request, mockResponse as Response);

      expect(mockedLoanService.update).toHaveBeenCalledWith('1', {
        status: 'OVERDUE'
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockUpdatedLoan);
    });

    it('should return 404 when loan not found', async () => {
      mockRequest = {
        params: { id: 'nonexistent' },
        body: { status: 'OVERDUE' }
      };

      mockedLoanService.update.mockResolvedValueOnce(null);

      await loanController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Loan not found' });
    });

    it('should handle reference error', async () => {
      mockRequest = {
        params: { id: '1' },
        body: { status: 'OVERDUE' }
      };

      mockedLoanService.update.mockRejectedValueOnce(new ReferenceError('Loan not found'));

      await loanController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Loan not found' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        params: { id: '1' },
        body: { status: 'OVERDUE' }
      };

      mockedLoanService.update.mockRejectedValueOnce(new Error('Database error'));

      await loanController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('delete', () => {
    it('should delete loan successfully', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedLoanService.delete.mockResolvedValueOnce({} as any);

      await loanController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockedLoanService.delete).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Loan deleted successfully' });
    });

    it('should handle reference error', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedLoanService.delete.mockRejectedValueOnce(new ReferenceError('Loan not found'));

      await loanController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Loan not found' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedLoanService.delete.mockRejectedValueOnce(new Error('Database error'));

      await loanController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('getMyLoans', () => {
    it('should return authenticated user loans', async () => {
      const mockLoans = [
        { id: '1', userId: 'user1', copyId: 'copy1' }
      ];

      mockRequest = {
        user: { id: 'user1', email: 'test@test.com', name: 'Test User', role: UserRole.USER }
      };

      mockedLoanService.findByUser.mockResolvedValueOnce(mockLoans as any);

      await loanController.getMyLoans(mockRequest as Request, mockResponse as Response);

      expect(mockedLoanService.findByUser).toHaveBeenCalledWith('user1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockLoans);
    });

    it('should return 401 when user not authenticated', async () => {
      mockRequest = {};

      await loanController.getMyLoans(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        user: { id: 'user1', email: 'test@test.com', name: 'Test User', role: UserRole.USER }
      };

      mockedLoanService.findByUser.mockRejectedValueOnce(new Error('Database error'));

      await loanController.getMyLoans(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });
});
