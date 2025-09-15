import { ReservationStatus } from "../models";

export interface ReservationInput {
    userId: string;
    bookId: string;
}

export interface ReservationInputUpdate {
    status?: ReservationStatus;
}