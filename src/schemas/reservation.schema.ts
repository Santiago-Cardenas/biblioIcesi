import { object, string } from 'zod';

export const reservationSchema = object({
    bookId: string({ error: "Book ID is required" })
});