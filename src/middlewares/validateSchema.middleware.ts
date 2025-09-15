import { ZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateSchema = (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                name: error.name,
                issues: error.issues  // 👈 aquí
            });
        }
        return res.status(500).json({ message: "Internal server error", error });
    }
};
