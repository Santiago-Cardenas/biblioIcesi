import { CopyInput, CopyInputUpdate } from "../interfaces";
import { CopyDocument, CopyModel, BookModel, CopyStatus, LoanModel, LoanStatus } from "../models";

class CopyService {
    public async create(copyInput: CopyInput): Promise<CopyDocument> {
        // Verificar que el libro existe
        const book = await BookModel.findById(copyInput.bookId);
        if (!book) {
            throw new ReferenceError('Book not found');
        }

        // Verificar que el código es único
        const copyExists = await CopyModel.findOne({ code: copyInput.code });
        if (copyExists) {
            throw new ReferenceError('Copy code already exists');
        }
        
        // Asegurar que el status tenga un valor por defecto
        const copyData = {
            ...copyInput,
            status: copyInput.status || CopyStatus.AVAILABLE
        };
        
        return CopyModel.create(copyData);
    }

    public async findAll(): Promise<CopyDocument[]> {
        return CopyModel.find({}).populate('bookId', 'title author isbn');
    }

    public async findById(id: string): Promise<CopyDocument | null> {
        return CopyModel.findById(id).populate('bookId', 'title author isbn');
    }

    public async findByBook(bookId: string): Promise<CopyDocument[]> {
        return CopyModel.find({ bookId }).populate('bookId', 'title author isbn');
    }

    public async findAvailableCopies(): Promise<CopyDocument[]> {
        return CopyModel.find({ status: CopyStatus.AVAILABLE }).populate('bookId', 'title author isbn');
    }

    public async findAvailableCopiesByBook(bookId: string): Promise<CopyDocument[]> {
        return CopyModel.find({ 
            bookId, 
            status: CopyStatus.AVAILABLE 
        }).populate('bookId', 'title author isbn');
    }

    public async update(id: string, copyInput: CopyInputUpdate): Promise<CopyDocument | null> {
        const copy = await CopyModel.findById(id);
        if (!copy) {
            throw new ReferenceError("Copy doesn't exist");
        }

        // Si se actualiza el código, verificar que es único
        if (copyInput.code && copyInput.code !== copy.code) {
            const existingCopy = await CopyModel.findOne({ code: copyInput.code });
            if (existingCopy) {
                throw new ReferenceError('Copy code already exists');
            }
        }

        // Si se actualiza el libro, verificar que existe
        if (copyInput.bookId) {
            const book = await BookModel.findById(copyInput.bookId);
            if (!book) {
                throw new ReferenceError('Book not found');
            }
        }

        return CopyModel.findByIdAndUpdate(id, copyInput, { new: true }).populate('bookId', 'title author isbn');
    }

    public async updateStatus(id: string, status: CopyStatus): Promise<CopyDocument | null> {
        const copy = await CopyModel.findById(id);
        if (!copy) {
            throw new ReferenceError("Copy doesn't exist");
        }

        return CopyModel.findByIdAndUpdate(id, { status }, { new: true }).populate('bookId', 'title author isbn');
    }

    public async delete(id: string): Promise<any> {
        const copy = await CopyModel.findById(id);
        if (!copy) {
            throw new ReferenceError("Copy doesn't exist");
        }

        // Verificar si la copia está prestada
        const activeLoan = await LoanModel.findOne({ 
            copyId: id, 
            status: { $in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE] }
        });
        
        if (activeLoan) {
            throw new ReferenceError("Cannot delete copy with active loan");
        }

        return CopyModel.findByIdAndDelete(id);
    }
}

export const copyService = new CopyService();