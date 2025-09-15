import { Request, Response } from 'express';
import { loanService, reservationService } from '../services';
import { LoanInput, LoanInputUpdate } from '../interfaces';
import { LoanModel } from '../models/loan.model';

class LoanController {
    public async create(req: Request, res: Response) {
        try {
            const newLoan = await loanService.create(req.body as LoanInput);
            res.status(201).json(newLoan);
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async getAll(req: Request, res: Response) {
        try {
            const { userId, status, overdue } = req.query;
            
            let loans;
            
            if (userId) {
                loans = await loanService.findByUser(userId as string);
            } else if (status === 'ACTIVE') {
                loans = await loanService.findActiveLoans();
            } else if (overdue === 'true') {
                loans = await loanService.findOverdueLoans();
            } else {
                loans = await loanService.findAll();
            }
            
            res.status(200).json(loans);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async getOne(req: Request, res: Response) {
        try {
            const loan = await loanService.findById(req.params.id);
            if (!loan) {
                res.status(404).json({ message: 'Loan not found' });
                return;
            }
            res.status(200).json(loan);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    // controllers/loan.controller.ts - método returnLoan corregido
    public async returnLoan(req: Request, res: Response) {
        try {
            const loan = await loanService.returnLoan(req.params.id);
            if (!loan) {
                res.status(404).json({ message: 'Loan not found' });
                return;
            }

            // Obtener la copia para procesar reservas
            const populatedLoan = await LoanModel.findById(loan._id).populate({
                path: 'copyId',
                populate: {
                    path: 'bookId'
                }
            });

            if (populatedLoan && populatedLoan.copyId && typeof populatedLoan.copyId === 'object' && 'bookId' in populatedLoan.copyId) {
                const copy = populatedLoan.copyId as any;
                await reservationService.processReservationsForBook(copy.bookId._id.toString());
            }

            res.status(200).json({ message: 'Loan returned successfully', loan });
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const loan = await loanService.update(req.params.id, req.body as LoanInputUpdate);
            if (!loan) {
                res.status(404).json({ message: 'Loan not found' });
                return;
            }
            res.status(200).json(loan);
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            await loanService.delete(req.params.id);
            res.status(200).json({ message: 'Loan deleted successfully' });
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    // Endpoint para obtener préstamos del usuario autenticado
    public async getMyLoans(req: Request, res: Response) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            
            const loans = await loanService.findByUser(req.user.id);
            res.status(200).json(loans);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }
}

export const loanController = new LoanController();