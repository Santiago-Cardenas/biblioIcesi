import { Request, Response } from 'express';
import { copyService } from '../services';
import { CopyInput, CopyInputUpdate } from '../interfaces';
import { CopyStatus } from '../models';

class CopyController {
    public async create(req: Request, res: Response) {
        try {
            const newCopy = await copyService.create(req.body as CopyInput);
            res.status(201).json(newCopy);
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
            const { bookId, status, available } = req.query;
            
            let copies;
            
            if (bookId) {
                copies = await copyService.findByBook(bookId as string);
            } else if (available === 'true' || status === 'AVAILABLE') {
                copies = await copyService.findAvailableCopies();
            } else {
                copies = await copyService.findAll();
            }
            
            res.status(200).json(copies);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async getOne(req: Request, res: Response) {
        try {
            const copy = await copyService.findById(req.params.id);
            if (!copy) {
                res.status(404).json({ message: 'Copy not found' });
                return;
            }
            res.status(200).json(copy);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const copy = await copyService.update(req.params.id, req.body as CopyInputUpdate);
            if (!copy) {
                res.status(404).json({ message: 'Copy not found' });
                return;
            }
            res.status(200).json(copy);
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async updateStatus(req: Request, res: Response) {
        try {
            const { status } = req.body;
            
            if (!Object.values(CopyStatus).includes(status)) {
                res.status(400).json({ message: 'Invalid status' });
                return;
            }
            
            const copy = await copyService.updateStatus(req.params.id, status);
            if (!copy) {
                res.status(404).json({ message: 'Copy not found' });
                return;
            }
            res.status(200).json(copy);
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
            await copyService.delete(req.params.id);
            res.status(200).json({ message: 'Copy deleted successfully' });
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }
}

export const copyController = new CopyController();