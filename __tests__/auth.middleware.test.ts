import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth, authorize } from '../src/middlewares/auth.middleware';
import { UserRole } from '../src/models';

jest.mock('jsonwebtoken');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('auth middleware', () => {
    it('should authenticate user with valid token', () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: UserRole.USER
      };

      mockRequest = {
        header: jest.fn().mockReturnValue('Bearer valid_token')
      };

      mockedJwt.verify.mockReturnValueOnce({
        user: mockUser
      } as any);

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedJwt.verify).toHaveBeenCalledWith('valid_token', 'test_secret_key');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no token provided', () => {
      mockRequest = {
        header: jest.fn().mockReturnValue(undefined)
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Not Authorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      mockRequest = {
        header: jest.fn().mockReturnValue('Bearer invalid_token')
      };

      mockedJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Not Authorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
      mockRequest = {
        header: jest.fn().mockReturnValue('Bearer expired_token')
      };

      const tokenExpiredError = new jwt.TokenExpiredError('Token expired', new Date());
      mockedJwt.verify.mockImplementationOnce(() => {
        throw tokenExpiredError;
      });

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Token Expired' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token without Bearer prefix', () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: UserRole.USER
      };

      mockRequest = {
        header: jest.fn().mockReturnValue('valid_token')
      };

      mockedJwt.verify.mockReturnValueOnce({
        user: mockUser
      } as any);

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedJwt.verify).toHaveBeenCalledWith('valid_token', 'test_secret_key');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use default secret when SECRET env var is not set', () => {
      const originalSecret = process.env.SECRET;
      delete process.env.SECRET;

      const mockUser = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
        role: UserRole.USER
      };

      mockRequest = {
        header: jest.fn().mockReturnValue('Bearer valid_token')
      };

      mockedJwt.verify.mockReturnValueOnce({
        user: mockUser
      } as any);

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedJwt.verify).toHaveBeenCalledWith('valid_token', '');
      expect(mockNext).toHaveBeenCalled();

      // Restore original secret
      process.env.SECRET = originalSecret;
    });
  });

  describe('authorize middleware', () => {
    it('should authorize user with correct role', () => {
      mockRequest = {
        user: {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin User',
          role: UserRole.ADMIN
        }
      };

      const adminAuthorize = authorize([UserRole.ADMIN]);
      adminAuthorize(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should authorize user with one of multiple allowed roles', () => {
      mockRequest = {
        user: {
          id: '1',
          email: 'user@test.com',
          name: 'Regular User',
          role: UserRole.USER
        }
      };

      const multiRoleAuthorize = authorize([UserRole.USER, UserRole.ADMIN]);
      multiRoleAuthorize(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockRequest = {};

      const adminAuthorize = authorize([UserRole.ADMIN]);
      adminAuthorize(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not authenticated' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is not authorized', () => {
      mockRequest = {
        user: {
          id: '1',
          email: 'user@test.com',
          name: 'Regular User',
          role: UserRole.USER
        }
      };

      const adminAuthorize = authorize([UserRole.ADMIN]);
      adminAuthorize(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user role is not in allowed roles list', () => {
      mockRequest = {
        user: {
          id: '1',
          email: 'user@test.com',
          name: 'Regular User',
          role: UserRole.USER
        }
      };

      const adminOnlyAuthorize = authorize([UserRole.ADMIN]);
      adminOnlyAuthorize(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
