import express from 'express';
import { bookController } from '../controllers';
import { auth, authorize, validateSchema } from '../middlewares';
import { bookSchema, bookUpdateSchema } from '../schemas';
import { UserRole } from '../models';

export const router = express.Router();

// Rutas públicas
router.get('/', bookController.getAll); // Búsqueda con query params: ?category=id&search=texto&available=true
router.get('/:id', bookController.getOne);

// Rutas que requieren autenticación de ADMIN
router.post('/', auth, authorize([UserRole.ADMIN]), validateSchema(bookSchema), bookController.create);
router.put('/:id', auth, authorize([UserRole.ADMIN]), validateSchema(bookUpdateSchema), bookController.update);
router.delete('/:id', auth, authorize([UserRole.ADMIN]), bookController.delete);