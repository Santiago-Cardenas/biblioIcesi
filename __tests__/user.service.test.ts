import { userService } from '../src/services/user.service';
import { UserModel, UserRole } from '../src/models';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('../src/models');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock the functions properly
jest.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
jest.mocked(jwt.sign).mockReturnValue('mock_token' as never);

describe('UserService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw if user already exists', async () => {
      mockedUserModel.findOne.mockResolvedValueOnce({} as any);
      await expect(userService.create({ 
        email: 'test@test.com', 
        password: '123', 
        name: 'Test' 
      })).rejects.toThrow('User already exists');
    });

    it('should hash password and create user with USER role by default', async () => {
      mockedUserModel.findOne.mockResolvedValueOnce(null);
      // bcrypt.hash is already mocked globally
      const mockUser = { 
        id: '1', 
        email: 'test@test.com', 
        password: 'hashed_password', 
        name: 'Test',
        role: UserRole.USER
      };
      mockedUserModel.create.mockResolvedValueOnce(mockUser as any);

      const user = await userService.create({ 
        email: 'test@test.com', 
        password: '123', 
        name: 'Test' 
      });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('123', 10);
      expect(mockedUserModel.create).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'hashed_password',
        name: 'Test',
        role: UserRole.USER
      });
      expect(user).toEqual(mockUser);
    });

    it('should create user with ADMIN role when specified', async () => {
      mockedUserModel.findOne.mockResolvedValueOnce(null);
      // bcrypt.hash is already mocked globally
      const mockUser = { 
        id: '1', 
        email: 'admin@test.com', 
        password: 'hashed_password', 
        name: 'Admin',
        role: UserRole.ADMIN
      };
      mockedUserModel.create.mockResolvedValueOnce(mockUser as any);

      const user = await userService.create({ 
        email: 'admin@test.com', 
        password: '123', 
        name: 'Admin',
        role: UserRole.ADMIN
      });

      expect(mockedUserModel.create).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'hashed_password',
        name: 'Admin',
        role: UserRole.ADMIN
      });
      expect(user).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email without password', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
      mockedUserModel.findOne.mockResolvedValueOnce(mockUser as any);

      const user = await userService.findByEmail('test@test.com');

      expect(mockedUserModel.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(user).toEqual(mockUser);
    });

    it('should find user by email with password when requested', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test', password: 'hashed' };
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser)
      };
      (mockedUserModel.findOne as jest.Mock).mockReturnValueOnce(mockQuery);

      const user = await userService.findByEmail('test@test.com', true);

      expect(mockedUserModel.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(mockQuery.select).toHaveBeenCalledWith('+password');
      expect(user).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockedUserModel.findOne.mockResolvedValueOnce(null);

      const user = await userService.findByEmail('nonexistent@test.com');

      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
      mockedUserModel.findOne.mockResolvedValueOnce(mockUser as any);

      const user = await userService.findById('1');

      expect(mockedUserModel.findOne).toHaveBeenCalledWith({ _id: '1' });
      expect(user).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@test.com', name: 'User 1' },
        { id: '2', email: 'user2@test.com', name: 'User 2' }
      ];
      mockedUserModel.find.mockResolvedValueOnce(mockUsers as any);

      const users = await userService.findAll();

      expect(mockedUserModel.find).toHaveBeenCalledWith({});
      expect(users).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    it('should find one user by id', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
      mockedUserModel.findOne.mockResolvedValueOnce(mockUser as any);

      const user = await userService.findOne('1');

      expect(mockedUserModel.findOne).toHaveBeenCalledWith({ _id: '1' });
      expect(user).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const mockUpdatedUser = { id: '1', email: 'updated@test.com', name: 'Updated' };
      mockedUserModel.findOneAndUpdate.mockResolvedValueOnce(mockUpdatedUser as any);

      const user = await userService.update('1', { 
        name: 'Updated', 
        email: 'updated@test.com' 
      });

      expect(mockedUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '1' }, 
        { name: 'Updated', email: 'updated@test.com' }, 
        { returnOriginal: false }
      );
      expect(user).toEqual(mockUpdatedUser);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
      mockedUserModel.findOne.mockResolvedValueOnce(mockUser as any);
      mockedUserModel.deleteOne.mockResolvedValueOnce({ deletedCount: 1 } as any);

      const result = await userService.delete('1');

      expect(mockedUserModel.findOne).toHaveBeenCalledWith({ _id: '1' });
      expect(mockedUserModel.deleteOne).toHaveBeenCalledWith({ _id: '1' });
      expect(result).toEqual({ deletedCount: 1 });
    });

    it('should throw error if user does not exist', async () => {
      mockedUserModel.findOne.mockResolvedValueOnce(null);

      await expect(userService.delete('1')).rejects.toThrow("User doesn't exist");
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = { 
        id: '1', 
        email: 'test@test.com', 
        name: 'Test', 
        password: 'hashed_password',
        role: UserRole.USER
      };
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser)
      };
      (mockedUserModel.findOne as jest.Mock).mockReturnValueOnce(mockQuery);

      const result = await userService.login({ 
        email: 'test@test.com', 
        password: 'password' 
      });

      expect(mockedUserModel.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
      expect(mockQuery.select).toHaveBeenCalledWith('+password');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password', 'hashed_password');
      expect(result).toEqual({
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test',
          role: UserRole.USER
        },
        token: 'mock_token'
      });
    });

    it('should throw error if user does not exist', async () => {
      const mockQuery = {
        select: jest.fn().mockResolvedValue(null)
      };
      (mockedUserModel.findOne as jest.Mock).mockReturnValueOnce(mockQuery);

      await expect(userService.login({ 
        email: 'nonexistent@test.com', 
        password: 'password' 
      })).rejects.toThrow('Not Authorized');
    });

    it('should throw error if password is incorrect', async () => {
      const mockUser = { 
        id: '1', 
        email: 'test@test.com', 
        name: 'Test', 
        password: 'hashed_password',
        role: UserRole.USER
      };
      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUser)
      };
      (mockedUserModel.findOne as jest.Mock).mockReturnValueOnce(mockQuery);
      
      // Mock bcrypt.compare to return false for this test
      jest.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      await expect(userService.login({ 
        email: 'test@test.com', 
        password: 'wrong_password' 
      })).rejects.toThrow('Not Authorized');
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token', async () => {
      const mockUser = { 
        id: '1', 
        email: 'test@test.com', 
        name: 'Test',
        role: UserRole.USER
      };
      // jwt.sign is already mocked globally

      const token = await userService.generateToken(mockUser as any);

      expect(mockedJwt.sign).toHaveBeenCalledWith({
        user: {
          id: '1',
          email: 'test@test.com',
          name: 'Test',
          role: UserRole.USER
        }
      }, 'test_secret_key', { expiresIn: '10m' });
      expect(token).toBe('mock_token');
    });
  });
});
