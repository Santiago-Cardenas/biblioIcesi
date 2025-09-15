import { ReservationInput, ReservationInputUpdate } from "../interfaces";
import { ReservationDocument, ReservationModel, BookModel, UserModel, ReservationStatus } from "../models";
import { copyService } from "./copy.service";

class ReservationService {
    public async create(reservationInput: ReservationInput): Promise<ReservationDocument> {
        // Verificar que el usuario existe
        const user = await UserModel.findById(reservationInput.userId);
        if (!user) {
            throw new ReferenceError('User not found');
        }

        // Verificar que el libro existe
        const book = await BookModel.findById(reservationInput.bookId);
        if (!book) {
            throw new ReferenceError('Book not found');
        }

        // Verificar que no hay copias disponibles
        const availableCopies = await copyService.findAvailableCopiesByBook(reservationInput.bookId);
        if (availableCopies.length > 0) {
            throw new ReferenceError('Book has available copies, no reservation needed');
        }

        // Verificar que el usuario no tiene ya una reserva activa para este libro
        const existingReservation = await ReservationModel.findOne({
            userId: reservationInput.userId,
            bookId: reservationInput.bookId,
            status: ReservationStatus.ACTIVE
        });

        if (existingReservation) {
            throw new ReferenceError('User already has an active reservation for this book');
        }

        const reservation = await ReservationModel.create(reservationInput);
        return reservation.populate([
            { path: 'userId', select: 'name email' },
            { path: 'bookId', select: 'title author isbn' }
        ]);
    }

    public async findAll(): Promise<ReservationDocument[]> {
        return ReservationModel.find({}).populate([
            { path: 'userId', select: 'name email' },
            { path: 'bookId', select: 'title author isbn' }
        ]);
    }

    public async findById(id: string): Promise<ReservationDocument | null> {
        return ReservationModel.findById(id).populate([
            { path: 'userId', select: 'name email' },
            { path: 'bookId', select: 'title author isbn' }
        ]);
    }

    public async findByUser(userId: string): Promise<ReservationDocument[]> {
        return ReservationModel.find({ userId }).populate([
            { path: 'userId', select: 'name email' },
            { path: 'bookId', select: 'title author isbn' }
        ]);
    }

    public async findActiveReservations(): Promise<ReservationDocument[]> {
        return ReservationModel.find({ status: ReservationStatus.ACTIVE }).populate([
            { path: 'userId', select: 'name email' },
            { path: 'bookId', select: 'title author isbn' }
        ]);
    }

    public async findByBook(bookId: string): Promise<ReservationDocument[]> {
        return ReservationModel.find({ bookId, status: ReservationStatus.ACTIVE })
            .sort({ createdAt: 1 }) // Más antiguas primero (FIFO)
            .populate([
                { path: 'userId', select: 'name email' },
                { path: 'bookId', select: 'title author isbn' }
            ]);
    }

    public async fulfill(id: string): Promise<ReservationDocument | null> {
        const reservation = await ReservationModel.findById(id);
        if (!reservation) {
            throw new ReferenceError("Reservation not found");
        }

        if (reservation.status !== ReservationStatus.ACTIVE) {
            throw new ReferenceError("Reservation is not active");
        }

        return ReservationModel.findByIdAndUpdate(id, {
            status: ReservationStatus.FULFILLED
        }, { new: true }).populate([
            { path: 'userId', select: 'name email' },
            { path: 'bookId', select: 'title author isbn' }
        ]);
    }

    public async cancel(id: string): Promise<ReservationDocument | null> {
        const reservation = await ReservationModel.findById(id);
        if (!reservation) {
            throw new ReferenceError("Reservation not found");
        }

        if (reservation.status !== ReservationStatus.ACTIVE) {
            throw new ReferenceError("Reservation is not active");
        }

        return ReservationModel.findByIdAndUpdate(id, {
            status: ReservationStatus.CANCELLED
        }, { new: true }).populate([
            { path: 'userId', select: 'name email' },
            { path: 'bookId', select: 'title author isbn' }
        ]);
    }

    public async update(id: string, reservationInput: ReservationInputUpdate): Promise<ReservationDocument | null> {
        const reservation = await ReservationModel.findById(id);
        if (!reservation) {
            throw new ReferenceError("Reservation doesn't exist");
        }

        return ReservationModel.findByIdAndUpdate(id, reservationInput, { new: true }).populate([
            { path: 'userId', select: 'name email' },
            { path: 'bookId', select: 'title author isbn' }
        ]);
    }

    public async delete(id: string): Promise<any> {
        const reservation = await ReservationModel.findById(id);
        if (!reservation) {
            throw new ReferenceError("Reservation doesn't exist");
        }

        return ReservationModel.findByIdAndDelete(id);
    }

    // Método para procesar reservas cuando se devuelve un libro
    public async processReservationsForBook(bookId: string): Promise<void> {
        const activeReservations = await this.findByBook(bookId);
        
        if (activeReservations.length > 0) {
            // Tomar la primera reserva (más antigua)
            const firstReservation = activeReservations[0];
            await this.fulfill(firstReservation.id);
            
            // Aquí podrías enviar una notificación al usuario
            console.log(`Reservation fulfilled for user ${firstReservation.userId} for book ${bookId}`);
        }
    }
}

export const reservationService = new ReservationService();