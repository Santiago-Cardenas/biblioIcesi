import { Request, Response } from 'express';
import { reservationService } from '../services';
import { ReservationInput, ReservationInputUpdate } from '../interfaces';

class ReservationController {
    public async create(req: Request, res: Response) {
        try {
            const newReservation = await reservationService.create(req.body as ReservationInput);
            res.status(201).json(newReservation);
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
            const { userId, bookId, status } = req.query;
            
            let reservations;
            
            if (userId) {
                reservations = await reservationService.findByUser(userId as string);
            } else if (bookId) {
                reservations = await reservationService.findByBook(bookId as string);
            } else if (status === 'ACTIVE') {
                reservations = await reservationService.findActiveReservations();
            } else {
                reservations = await reservationService.findAll();
            }
            
            res.status(200).json(reservations);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async getOne(req: Request, res: Response) {
        try {
            const reservation = await reservationService.findById(req.params.id);
            if (!reservation) {
                res.status(404).json({ message: 'Reservation not found' });
                return;
            }
            res.status(200).json(reservation);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async fulfill(req: Request, res: Response) {
        try {
            const reservation = await reservationService.fulfill(req.params.id);
            if (!reservation) {
                res.status(404).json({ message: 'Reservation not found' });
                return;
            }
            res.status(200).json({ message: 'Reservation fulfilled successfully', reservation });
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    public async cancel(req: Request, res: Response) {
        try {
            const reservation = await reservationService.cancel(req.params.id);
            if (!reservation) {
                res.status(404).json({ message: 'Reservation not found' });
                return;
            }
            res.status(200).json({ message: 'Reservation cancelled successfully', reservation });
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
            const reservation = await reservationService.update(req.params.id, req.body as ReservationInputUpdate);
            if (!reservation) {
                res.status(404).json({ message: 'Reservation not found' });
                return;
            }
            res.status(200).json(reservation);
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
            await reservationService.delete(req.params.id);
            res.status(200).json({ message: 'Reservation deleted successfully' });
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    // Endpoint para obtener reservas del usuario autenticado
    public async getMyReservations(req: Request, res: Response) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            
            const reservations = await reservationService.findByUser(req.user.id);
            res.status(200).json(reservations);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error });
        }
    }

    // Endpoint para que un usuario haga una reserva
    public async createMyReservation(req: Request, res: Response) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            
            const reservationInput: ReservationInput = {
                userId: req.user.id,
                bookId: req.body.bookId
            };
            
            const newReservation = await reservationService.create(reservationInput);
            res.status(201).json(newReservation);
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: "Internal server error", error });
        }
    }
}

export const reservationController = new ReservationController();