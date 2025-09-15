import { LoanInput, LoanInputUpdate } from "../interfaces";
import { LoanDocument, LoanModel, CopyModel, UserModel, CopyStatus, LoanStatus } from "../models";

class LoanService {
    public async create(loanInput: LoanInput): Promise<LoanDocument> {
        // Verificar que el usuario existe
        const user = await UserModel.findById(loanInput.userId);
        if (!user) {
            throw new ReferenceError('User not found');
        }

        // Verificar que la copia existe y está disponible
        const copy = await CopyModel.findById(loanInput.copyId);
        if (!copy) {
            throw new ReferenceError('Copy not found');
        }

        if (copy.status !== CopyStatus.AVAILABLE) {
            throw new ReferenceError('Copy is not available for loan');
        }

        // Usar la fecha proporcionada o calcular 14 días desde hoy
        const loanData = {
            ...loanInput,
            dueDate: loanInput.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: LoanStatus.ACTIVE
        };

        // Crear el préstamo
        const loan = await LoanModel.create(loanData);

        // Actualizar el estado de la copia
        await CopyModel.findByIdAndUpdate(loanInput.copyId, { status: CopyStatus.LOANED });

        return loan.populate([
            { path: 'userId', select: 'name email' },
            { path: 'copyId', populate: { path: 'bookId', select: 'title author isbn' } }
        ]);
    }

    public async findAll(): Promise<LoanDocument[]> {
        return LoanModel.find({}).populate([
            { path: 'userId', select: 'name email' },
            { path: 'copyId', populate: { path: 'bookId', select: 'title author isbn' } }
        ]);
    }

    public async findById(id: string): Promise<LoanDocument | null> {
        return LoanModel.findById(id).populate([
            { path: 'userId', select: 'name email' },
            { path: 'copyId', populate: { path: 'bookId', select: 'title author isbn' } }
        ]);
    }

    public async findByUser(userId: string): Promise<LoanDocument[]> {
        return LoanModel.find({ userId }).populate([
            { path: 'userId', select: 'name email' },
            { path: 'copyId', populate: { path: 'bookId', select: 'title author isbn' } }
        ]);
    }

    public async findActiveLoans(): Promise<LoanDocument[]> {
        return LoanModel.find({ status: LoanStatus.ACTIVE }).populate([
            { path: 'userId', select: 'name email' },
            { path: 'copyId', populate: { path: 'bookId', select: 'title author isbn' } }
        ]);
    }

    public async findOverdueLoans(): Promise<LoanDocument[]> {
        const today = new Date();
        return LoanModel.find({ 
            status: LoanStatus.ACTIVE,
            dueDate: { $lt: today }
        }).populate([
            { path: 'userId', select: 'name email' },
            { path: 'copyId', populate: { path: 'bookId', select: 'title author isbn' } }
        ]);
    }

    public async returnLoan(id: string): Promise<LoanDocument | null> {
        const loan = await LoanModel.findById(id);
        if (!loan) {
            throw new ReferenceError("Loan not found");
        }

        if (loan.status !== LoanStatus.ACTIVE) {
            throw new ReferenceError("Loan is not active");
        }

        // Actualizar el préstamo
        const updatedLoan = await LoanModel.findByIdAndUpdate(id, {
            status: LoanStatus.RETURNED,
            returnedAt: new Date()
        }, { new: true });

        // Actualizar el estado de la copia
        await CopyModel.findByIdAndUpdate(loan.copyId, { status: CopyStatus.AVAILABLE });

        if (!updatedLoan) {
            return null;
        }
        return updatedLoan.populate([
            { path: 'userId', select: 'name email' },
            { path: 'copyId', populate: { path: 'bookId', select: 'title author isbn' } }
        ]);
    }

    public async update(id: string, loanInput: LoanInputUpdate): Promise<LoanDocument | null> {
        const loan = await LoanModel.findById(id);
        if (!loan) {
            throw new ReferenceError("Loan doesn't exist");
        }

        return LoanModel.findByIdAndUpdate(id, loanInput, { new: true }).populate([
            { path: 'userId', select: 'name email' },
            { path: 'copyId', populate: { path: 'bookId', select: 'title author isbn' } }
        ]);
    }

    public async delete(id: string): Promise<any> {
        const loan = await LoanModel.findById(id);
        if (!loan) {
            throw new ReferenceError("Loan doesn't exist");
        }

        // Si el préstamo está activo, liberar la copia
        if (loan.status === LoanStatus.ACTIVE) {
            await CopyModel.findByIdAndUpdate(loan.copyId, { status: CopyStatus.AVAILABLE });
        }

        return LoanModel.findByIdAndDelete(id);
    }

    // Método para actualizar préstamos vencidos
    public async updateOverdueLoans(): Promise<void> {
        const today = new Date();
        await LoanModel.updateMany(
            { 
                status: LoanStatus.ACTIVE,
                dueDate: { $lt: today }
            },
            { status: LoanStatus.OVERDUE }
        );
    }
}

export const loanService = new LoanService();