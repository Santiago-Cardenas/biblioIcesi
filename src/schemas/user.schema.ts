import { error } from 'console';
import {object, string} from 'zod';

//PARA VALIDACION
export const userSchema: any = object({
    name: string({error: "Name is required"}),
    email: string({error: "Email is required"})
                .email("Not a valid email address"),
    password: string({error: "Password is required"})
            .min(8,"Password must be at least 8 characters long")
});