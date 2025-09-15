import { Request, Response } from 'express';
import { userController } from '../src/controllers/user.controller';
import { userService } from '../src/services/user.service';
import { UserRole } from '../src/models';

jest.mock('../src/services/user.service');

const mockedUserService = userService as jest.Mocked<typeof userService>;

describe('UserController', () => {
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
    it('should create user successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: UserRole.USER
      };

      mockRequest = {
        body: {
          name: 'Test User',
          email: 'test@test.com',
          password: 'password123'
        }
      };

      mockedUserService.create.mockResolvedValueOnce(mockUser as any);

      await userController.create(mockRequest as Request, mockResponse as Response);

      expect(mockedUserService.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        role: UserRole.USER
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: "User created successfully",
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@test.com',
          role: UserRole.USER
        }
      });
    });

    it('should create user with ADMIN role when specified', async () => {
      const mockUser = {
        id: '1',
        name: 'Admin User',
        email: 'admin@test.com',
        role: UserRole.ADMIN
      };

      mockRequest = {
        body: {
          name: 'Admin User',
          email: 'admin@test.com',
          password: 'password123',
          role: UserRole.ADMIN
        }
      };

      mockedUserService.create.mockResolvedValueOnce(mockUser as any);

      await userController.create(mockRequest as Request, mockResponse as Response);

      expect(mockedUserService.create).toHaveBeenCalledWith({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: UserRole.ADMIN
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    it('should handle user already exists error', async () => {
      mockRequest = {
        body: {
          name: 'Test User',
          email: 'test@test.com',
          password: 'password123'
        }
      };

      mockedUserService.create.mockRejectedValueOnce(new ReferenceError('User already exists'));

      await userController.create(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User already exists' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        body: {
          name: 'Test User',
          email: 'test@test.com',
          password: 'password123'
        }
      };

      mockedUserService.create.mockRejectedValueOnce(new Error('Database error'));

      await userController.create(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('getAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@test.com', role: UserRole.USER },
        { id: '2', name: 'User 2', email: 'user2@test.com', role: UserRole.ADMIN }
      ];

      mockedUserService.findAll.mockResolvedValueOnce(mockUsers as any);

      await userController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockedUserService.findAll).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle internal server error', async () => {
      mockedUserService.findAll.mockRejectedValueOnce(new Error('Database error'));

      await userController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('getOne', () => {
    it('should return user by id', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@test.com', role: UserRole.USER };

      mockRequest = {
        params: { id: '1' }
      };

      mockedUserService.findOne.mockResolvedValueOnce(mockUser as any);

      await userController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockedUserService.findOne).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 when user not found', async () => {
      mockRequest = {
        params: { id: 'nonexistent' }
      };

      mockedUserService.findOne.mockResolvedValueOnce(null);

      await userController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedUserService.findOne.mockRejectedValueOnce(new Error('Database error'));

      await userController.getOne(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('getMyProfile', () => {
    it('should return authenticated user profile', async () => {
      const mockUser = { 
        id: '1', 
        name: 'Test User', 
        email: 'test@test.com', 
        role: UserRole.USER,
        createdAt: new Date()
      };

      mockRequest = {
        user: { id: '1', email: 'test@test.com', name: 'Test User', role: UserRole.USER }
      };

      mockedUserService.findOne.mockResolvedValueOnce(mockUser as any);

      await userController.getMyProfile(mockRequest as Request, mockResponse as Response);

      expect(mockedUserService.findOne).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: UserRole.USER,
        createdAt: expect.any(Date)
      });
    });

    it('should return 401 when user not authenticated', async () => {
      mockRequest = {};

      await userController.getMyProfile(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 404 when user not found', async () => {
      mockRequest = {
        user: { id: '1', email: 'test@test.com', name: 'Test User', role: UserRole.USER }
      };

      mockedUserService.findOne.mockResolvedValueOnce(null);

      await userController.getMyProfile(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const mockUpdatedUser = { 
        id: '1', 
        name: 'Updated User', 
        email: 'updated@test.com', 
        role: UserRole.USER 
      };

      mockRequest = {
        params: { id: '1' },
        body: { name: 'Updated User', email: 'updated@test.com' }
      };

      mockedUserService.update.mockResolvedValueOnce(mockUpdatedUser as any);

      await userController.update(mockRequest as Request, mockResponse as Response);

      expect(mockedUserService.update).toHaveBeenCalledWith('1', {
        name: 'Updated User',
        email: 'updated@test.com'
      });
      expect(mockJson).toHaveBeenCalledWith({
        message: "User updated successfully",
        user: {
          id: '1',
          name: 'Updated User',
          email: 'updated@test.com',
          role: UserRole.USER
        }
      });
    });

    it('should return 404 when user not found', async () => {
      mockRequest = {
        params: { id: 'nonexistent' },
        body: { name: 'Updated User' }
      };

      mockedUserService.update.mockResolvedValueOnce(null);

      await userController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User with id nonexistent not found' });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        params: { id: '1' },
        body: { name: 'Updated User' }
      };

      mockedUserService.update.mockRejectedValueOnce(new Error('Database error'));

      await userController.update(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedUserService.delete.mockResolvedValueOnce({ deletedCount: 1 } as any);

      await userController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockedUserService.delete).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ 
        userDeleted: { deletedCount: 1 }, 
        message: "User deleted successfully" 
      });
    });

    it('should handle user does not exist error', async () => {
      mockRequest = {
        params: { id: 'nonexistent' }
      };

      mockedUserService.delete.mockRejectedValueOnce(new ReferenceError("User doesn't exist"));

      await userController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ message: "User doesn't exist" });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      mockedUserService.delete.mockRejectedValueOnce(new Error('Database error'));

      await userController.delete(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockLoginResult = {
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test User',
          role: UserRole.USER
        },
        token: 'mock_token'
      };

      mockRequest = {
        body: {
          email: 'test@test.com',
          password: 'password123'
        }
      };

      mockedUserService.login.mockResolvedValueOnce(mockLoginResult);

      await userController.login(mockRequest as Request, mockResponse as Response);

      expect(mockedUserService.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123'
      });
      expect(mockJson).toHaveBeenCalledWith({
        message: "Login successful",
        ...mockLoginResult
      });
    });

    it('should handle invalid credentials', async () => {
      mockRequest = {
        body: {
          email: 'test@test.com',
          password: 'wrong_password'
        }
      };

      mockedUserService.login.mockRejectedValueOnce(new ReferenceError('Not Authorized'));

      await userController.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it('should handle internal server error', async () => {
      mockRequest = {
        body: {
          email: 'test@test.com',
          password: 'password123'
        }
      };

      mockedUserService.login.mockRejectedValueOnce(new Error('Database error'));

      await userController.login(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ 
        message: "Internal server error", 
        error: expect.any(Error) 
      });
    });
  });
});
