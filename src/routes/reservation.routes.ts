import express from 'express';
import { reservationController } from '../controllers';
import { auth, authorize, validateSchema } from '../middlewares';
import { reservationSchema } from '../schemas';
import { UserRole } from '../models';

export const router = express.Router();

// Rutas para usuarios autenticados
router.get('/my-reservations', auth, reservationController.getMyReservations); // Usuario ve sus propias reservas
router.post('/my-reservations', auth, validateSchema(reservationSchema), reservationController.createMyReservation); // Usuario hace una reserva

// Rutas que requieren autenticación de ADMIN
router.post('/', auth, authorize([UserRole.ADMIN]), validateSchema(reservationSchema), reservationController.create);
router.get('/', auth, authorize([UserRole.ADMIN]), reservationController.getAll); // Query params: ?userId=id&bookId=id&status=ACTIVE
router.get('/:id', auth, authorize([UserRole.ADMIN]), reservationController.getOne);
router.patch('/:id/fulfill', auth, authorize([UserRole.ADMIN]), reservationController.fulfill);
router.patch('/:id/cancel', auth, authorize([UserRole.ADMIN]), reservationController.cancel);
router.put('/:id', auth, authorize([UserRole.ADMIN]), reservationController.update);
router.delete('/:id', auth, authorize([UserRole.ADMIN]), reservationController.delete);