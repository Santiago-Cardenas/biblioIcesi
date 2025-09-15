import { Request, Response } from 'express';
import { googleBooksService } from '../services/googleBooks.service';

class GoogleBooksController {
  public async searchBooks(req: Request, res: Response) {
    try {
      const { q, maxResults = 10 } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ 
          message: 'Query parameter "q" is required' 
        });
      }

      const books = await googleBooksService.searchBooks(q, parseInt(maxResults as string));
      
      res.status(200).json({
        books,
        total: books.length
      });
    } catch (error) {
      console.error('Error searching books:', error);
      res.status(500).json({ 
        message: 'Error searching books',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async getBookByISBN(req: Request, res: Response) {
    try {
      const { isbn } = req.params;
      
      if (!isbn) {
        return res.status(400).json({ 
          message: 'ISBN parameter is required' 
        });
      }

      const book = await googleBooksService.getBookByISBN(isbn);
      
      if (!book) {
        return res.status(404).json({ 
          message: 'Book not found' 
        });
      }

      res.status(200).json(book);
    } catch (error) {
      console.error('Error fetching book by ISBN:', error);
      res.status(500).json({ 
        message: 'Error fetching book by ISBN',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async enrichBookData(req: Request, res: Response) {
    try {
      const bookData = req.body;
      
      if (!bookData) {
        return res.status(400).json({ 
          message: 'Book data is required' 
        });
      }

      const enrichedData = await googleBooksService.enrichBookData(bookData);
      
      res.status(200).json(enrichedData);
    } catch (error) {
      console.error('Error enriching book data:', error);
      res.status(500).json({ 
        message: 'Error enriching book data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const googleBooksController = new GoogleBooksController();
