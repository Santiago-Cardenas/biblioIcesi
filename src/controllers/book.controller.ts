import { Request, Response } from 'express';
import { bookService } from '../services';
import { BookInput, BookInputUpdate } from '../interfaces';

class BookController {
    public async create(req: Request, res: Response) {
        try {
            const newBook = await bookService.create(req.body as BookInput);
            res.status(201).json(newBook);
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async getAll(req: Request, res: Response) {
        try {
            const { category, search, available } = req.query;
            
            let books;
            
            if (search) {
                books = await bookService.search(search as string);
            } else if (category) {
                books = await bookService.findByCategory(category as string);
            } else if (available === 'true') {
                books = await bookService.getBooksWithAvailableCopies();
            } else {
                books = await bookService.findAll();
            }
            
            res.status(200).json(books);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async getOne(req: Request, res: Response) {
        try {
            const book = await bookService.findById(req.params.id);
            if (!book) {
                res.status(404).json({ message: 'Book not found' });
                return;
            }
            res.status(200).json(book);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const book = await bookService.update(req.params.id, req.body as BookInputUpdate);
            if (!book) {
                res.status(404).json({ message: 'Book not found' });
                return;
            }
            res.status(200).json(book);
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            await bookService.delete(req.params.id);
            res.status(200).json({ message: 'Book deleted successfully' });
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }
}

export const bookController = new BookController();