import { UserRole } from "../models";

export interface UserInput {
    name: string,
    email: string,
    password: string,
    role?: UserRole
}

export interface UserInputUpdate {
    name: string,
    email: string,
}

export interface UserLogin {
    email: string,
    password: string
}