// interfaces/loan.interface.ts
import { LoanStatus } from "../models";

export interface LoanInput {
    userId: string;
    copyId: string;
    dueDate: Date; // Remover el ? para hacerlo requerido
}

export interface LoanInputUpdate {
    status?: LoanStatus;
    returnedAt?: Date;
    dueDate?: Date;
}