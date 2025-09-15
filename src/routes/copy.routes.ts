import express from 'express';
import { copyController } from '../controllers';
import { auth, authorize, validateSchema } from '../middlewares';
import { copySchema, copyUpdateSchema } from '../schemas';
import { UserRole } from '../models';

export const router = express.Router();

// Rutas públicas (para consultar disponibilidad)
router.get('/', copyController.getAll); // Query params: ?bookId=id&available=true&status=AVAILABLE
router.get('/:id', copyController.getOne);

// Rutas que requieren autenticación de ADMIN
router.post('/', auth, authorize([UserRole.ADMIN]), validateSchema(copySchema), copyController.create);
router.put('/:id', auth, authorize([UserRole.ADMIN]), validateSchema(copyUpdateSchema), copyController.update);
router.patch('/:id/status', auth, authorize([UserRole.ADMIN]), copyController.updateStatus);
router.delete('/:id', auth, authorize([UserRole.ADMIN]), copyController.delete);