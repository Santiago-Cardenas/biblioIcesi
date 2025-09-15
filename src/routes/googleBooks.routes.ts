import { Router } from 'express';
import { googleBooksController } from '../controllers/googleBooks.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// Search books in Google Books API
router.get('/search', auth, googleBooksController.searchBooks);

// Get book by ISBN from Google Books API
router.get('/isbn/:isbn', auth, googleBooksController.getBookByISBN);

// Enrich book data with Google Books metadata
router.post('/enrich', auth, googleBooksController.enrichBookData);

export default router;
