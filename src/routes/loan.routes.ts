import express from 'express';
import { loanController } from '../controllers';
import { auth, authorize, validateSchema } from '../middlewares';
import { loanSchema } from '../schemas';
import { UserRole } from '../models';

export const router = express.Router();

// Rutas para usuarios autenticados
router.get('/my-loans', auth, loanController.getMyLoans); // Usuario ve sus propios préstamos

// Rutas que requieren autenticación de ADMIN
router.post('/', auth, authorize([UserRole.ADMIN]), validateSchema(loanSchema), loanController.create);
router.get('/', auth, authorize([UserRole.ADMIN]), loanController.getAll); // Query params: ?userId=id&status=ACTIVE&overdue=true
router.get('/:id', auth, authorize([UserRole.ADMIN]), loanController.getOne);
router.patch('/:id/return', auth, authorize([UserRole.ADMIN]), loanController.returnLoan);
router.put('/:id', auth, authorize([UserRole.ADMIN]), loanController.update);
router.delete('/:id', auth, authorize([UserRole.ADMIN]), loanController.delete);