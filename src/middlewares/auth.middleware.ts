import { NextFunction, Request, Response } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { UserRole } from "../models";

// Extiende la interfaz Request para incluir user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name: string;
                role: UserRole;
            };
        }
    }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined = req.header("Authorization");

    if (!token) {
        res.status(401).json({"message": "Not Authorized"});
        return;
    }
    
    try {
        token = token.replace("Bearer ", "");
        const decoded: any = jwt.verify(token, process.env.SECRET || "");
        
        // Guardar usuario en req.user en lugar de req.body
        req.user = decoded.user;
        next();
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            res.status(401).json({message: "Token Expired"});
            return;
        }
        res.status(401).json({message: "Not Authorized"});
    }
};

// Middleware para autorización por roles
export const authorize = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({message: "User not authenticated"});
            return;
        }
        
        if (!roles.includes(req.user.role)) {
            res.status(403).json({message: "Insufficient permissions"});
            return;
        }
        
        next();
    };
};