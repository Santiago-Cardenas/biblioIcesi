import { object, string } from 'zod';

export const categorySchema = object({
    name: string({ error: "Name is required" })
        .min(1, "Name cannot be empty")
        .max(100, "Name cannot exceed 100 characters"),
    description: string().max(500, "Description cannot exceed 500 characters").optional()
});

export const categoryUpdateSchema = object({
    name: string().min(1, "Name cannot be empty").max(100, "Name cannot exceed 100 characters").optional(),
    description: string().max(500, "Description cannot exceed 500 characters").optional()
});