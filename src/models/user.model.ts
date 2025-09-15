import mongoose from "mongoose";
import { UserInput } from "../interfaces";

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER'
}

export interface UserDocument extends UserInput, mongoose.Document {
    createdAt: Date,
    updateAt: Date,
    deleteAt: Date,
    role: UserRole
}

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER }
}, { timestamps: true, collection: "users" });

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
