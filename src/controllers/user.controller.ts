import {Request, Response} from 'express';
import { UserDocument, UserRole } from '../models';
import { userService } from '../services';
import { UserInput, UserInputUpdate, UserLogin } from '../interfaces';

class UserController {
    public async create(req: Request, res: Response) {
        try {
            const { role, ...rest } = req.body;
            const newUser: UserDocument = await userService.create({
                ...rest,
                role: role || UserRole.USER
            });

            res.status(201).json({
                message: "User created successfully",
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role
                }
            });
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: 'User already exists' });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async getAll(req: Request, res: Response) {
        try {
            const users: UserDocument[] = await userService.findAll();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async getOne(req: Request, res: Response) {
        try {
            const id: string = req.params.id || '';
            const user: UserDocument | null = await userService.findOne(id);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async getMyProfile(req: Request, res: Response) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            const user: UserDocument | null = await userService.findOne(req.user.id);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.status(200).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const id: string = req.params.id || '';
            const user: UserDocument | null = await userService.update(id, req.body as UserInputUpdate);
            if (user === null) {
                res.status(404).json({ message: `User with id ${id} not found` });
                return;
            }
            res.json({
                message: "User updated successfully",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const id: string = req.params.id || '';
            const userDeleted = await userService.delete(id);
            res.status(200).json({ userDeleted, message: "User deleted successfully" });
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: "User doesn't exist" });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async login(req: Request, res: Response) {
        try {
            const result = await userService.login(req.body as UserLogin);
            res.json({
                message: "Login successful",
                ...result
            });
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(401).json({ message: "Invalid credentials" });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }
}

export const userController = new UserController();
