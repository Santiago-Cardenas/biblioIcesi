// interfaces/copy.interface.ts
import { CopyStatus } from "../models";

export interface CopyInput {
    bookId: string;
    code: string;
    status: CopyStatus; // Remover el ? para hacerlo requerido
}

export interface CopyInputUpdate {
    bookId?: string;
    code?: string;
    status?: CopyStatus;
}