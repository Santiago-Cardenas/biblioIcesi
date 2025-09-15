import mongoose from "mongoose";

export enum CopyStatus {
    AVAILABLE = 'AVAILABLE',
    LOANED = 'LOANED',
    DAMAGED = 'DAMAGED',
    RESERVED = 'RESERVED'
}

export interface CopyInput {
    bookId: string,
    code: string,
    status: CopyStatus
}

export interface CopyDocument extends CopyInput, mongoose.Document {
    createdAt: Date,
    updatedAt: Date
}

const copySchema = new mongoose.Schema({
    bookId: {type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true},
    code: {type: String, required: true, unique: true},
    status: {type: String, enum: Object.values(CopyStatus), default: CopyStatus.AVAILABLE}
}, {timestamps: true, collection: "copies"});

export const CopyModel = mongoose.model<CopyDocument>('Copy', copySchema);