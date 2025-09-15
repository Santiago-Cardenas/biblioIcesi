import express from 'express';
import { userController } from '../controllers';
import { validateSchema } from '../middlewares';
import { userSchema } from '../schemas';

export const router = express.Router();

router.post('/register', validateSchema(userSchema), userController.create);
router.post('/login', userController.login);
