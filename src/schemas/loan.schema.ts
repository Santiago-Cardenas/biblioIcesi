// schemas/loan.schema.ts
import { object, string, date } from 'zod';

export const loanSchema = object({
    userId: string({ error: "User ID is required" }),
    copyId: string({ error: "Copy ID is required" }),
    dueDate: date().default(() => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))
});