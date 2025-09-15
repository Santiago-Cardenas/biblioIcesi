import mongoose from "mongoose";

export enum ReservationStatus {
    ACTIVE = 'ACTIVE',
    FULFILLED = 'FULFILLED',
    CANCELLED = 'CANCELLED'
}

export interface ReservationInput {
    userId: string,
    bookId: string
}

export interface ReservationDocument extends ReservationInput, mongoose.Document {
    status: ReservationStatus,
    createdAt: Date,
    updatedAt: Date
}

const reservationSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    bookId: {type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true},
    status: {type: String, enum: Object.values(ReservationStatus), default: ReservationStatus.ACTIVE}
}, {timestamps: true, collection: "reservations"});

export const ReservationModel = mongoose.model<ReservationDocument>('Reservation', reservationSchema);