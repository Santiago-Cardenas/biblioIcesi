// schemas/book.schema.ts
import { object, string, number } from 'zod';

export const bookSchema = object({
    title: string({ error: "Title is required" })
        .min(1, "Title cannot be empty"),
    author: string({ error: "Author is required" })
        .min(1, "Author cannot be empty"),
    isbn: string({ error: "ISBN is required" })
        .min(10, "ISBN must be at least 10 characters")
        .max(13, "ISBN cannot exceed 13 characters"),
    editorial: string().optional(),
    year: number().min(1000).max(new Date().getFullYear()).optional(),
    categoryId: string({ error: "Category ID is required" }),
    description: string().optional(),
    imageUrl: string().url("Must be a valid URL").optional()
});

export const bookUpdateSchema = object({
    title: string().min(1, "Title cannot be empty").optional(),
    author: string().min(1, "Author cannot be empty").optional(),
    isbn: string().min(10, "ISBN must be at least 10 characters").max(13, "ISBN cannot exceed 13 characters").optional(),
    editorial: string().optional(),
    year: number().min(1000).max(new Date().getFullYear()).optional(),
    categoryId: string().optional(),
    description: string().optional(),
    imageUrl: string().url("Must be a valid URL").optional()
});