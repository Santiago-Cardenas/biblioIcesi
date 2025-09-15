import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserInput, UserInputUpdate, UserLogin } from "../interfaces";
import { UserDocument, UserModel, UserRole } from "../models";

class UserService {
    public async create(userInput: UserInput): Promise<UserDocument> {
        const userExists: UserDocument | null = await this.findByEmail(userInput.email);
        if (userExists !== null) {
            throw new ReferenceError('User already exists');
        }

        if (userInput.password) {
            userInput.password = await bcrypt.hash(userInput.password, 10);
        }

        // Forzar que solo se cree USER a menos que explícitamente pongan ADMIN
        if (!userInput.role) {
            userInput.role = UserRole.USER;
        }

        return UserModel.create(userInput);
    }

    public findByEmail(email: string, withPassword = false): Promise<UserDocument | null> {
        if (withPassword) {
            return UserModel.findOne({ email }).select("+password");
        }
        return UserModel.findOne({ email });
    }

    public findById(id: string): Promise<UserDocument | null> {
        return UserModel.findOne({ _id: id });
    }

    public async findAll(): Promise<UserDocument[]> {
        return UserModel.find({});
    }

    public async findOne(id: string): Promise<UserDocument | null> {
        return UserModel.findOne({ _id: id });
    }

    public async update(id: string, userInput: UserInputUpdate): Promise<UserDocument | null> {
        return UserModel.findOneAndUpdate({ _id: id }, userInput, { returnOriginal: false });
    }
    
    public async delete(id: string) {
        const userExists: UserDocument | null = await this.findById(id);
        if (userExists === null) {
            throw new ReferenceError("User doesn't exist");
        }
        return UserModel.deleteOne({ _id: id });
    }

    public async login(userLogin: UserLogin): Promise<any> {
        const userExists: UserDocument | null = await this.findByEmail(userLogin.email, true);
        if (userExists === null) {
            throw new ReferenceError("Not Authorized");
        }

        const isMatch: boolean = await bcrypt.compare(userLogin.password, userExists.password);
        if (!isMatch) {
            throw new ReferenceError("Not Authorized");
        }

        return {
            user: {
                id: userExists.id,
                email: userExists.email,
                name: userExists.name,
                role: userExists.role
            },
            token: await this.generateToken(userExists)
        };
    }

    public async generateToken(user: UserDocument): Promise<string> {
        return jwt.sign({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        },
        process.env.SECRET || "secret_key",
        { expiresIn: '10m' }
        );
    }
}

export const userService = new UserService();
