// schemas/copy.schema.ts
import { object, string, nativeEnum } from 'zod';
import { CopyStatus } from '../models';

export const copySchema = object({
    bookId: string({ error: "Book ID is required" }),
    code: string({ error: "Copy code is required" })
        .min(1, "Code cannot be empty"),
    status: nativeEnum(CopyStatus).default(CopyStatus.AVAILABLE)
});

export const copyUpdateSchema = object({
    bookId: string().optional(),
    code: string().min(1, "Code cannot be empty").optional(),
    status: nativeEnum(CopyStatus).optional()
});