import express from 'express';
import { categoryController } from '../controllers';
import { auth, authorize } from '../middlewares';
import { UserRole } from '../models';

export const router = express.Router();

// Solo ADMIN puede crear, actualizar y eliminar categorías
router.post('/', auth, authorize([UserRole.ADMIN]), categoryController.create);
router.put('/:id', auth, authorize([UserRole.ADMIN]), categoryController.update);
router.delete('/:id', auth, authorize([UserRole.ADMIN]), categoryController.delete);

// Ambos roles pueden ver categorías
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getOne);