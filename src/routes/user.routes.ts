import express from 'express';
import { userController } from '../controllers';
import { auth, authorize, validateSchema } from "../middlewares";
import { userSchema } from '../schemas';
import { UserRole } from '../models';

export const router = express.Router();

// Solo SUPERADMIN puede gestionar usuarios
router.get('/', auth, authorize([UserRole.ADMIN]), userController.getAll);
router.get('/profile', auth, userController.getMyProfile); // Usuario ve su propio perfil
router.get('/:id', auth, authorize([UserRole.ADMIN]), userController.getOne);
router.put('/:id', auth, authorize([UserRole.ADMIN]), userController.update);
router.delete('/:id', auth, authorize([UserRole.ADMIN]), userController.delete);

// Registro público (comentar si solo admin puede crear usuarios)
// router.post('/', validateSchema(userSchema), userController.create); 

// Solo SUPERADMIN puede crear usuarios (descomenta esta línea si prefieres esto)
router.post('/', auth, authorize([UserRole.ADMIN]), validateSchema(userSchema), userController.create);