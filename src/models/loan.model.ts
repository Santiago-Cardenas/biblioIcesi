import mongoose from "mongoose";

export enum LoanStatus {
    ACTIVE = 'ACTIVE',
    RETURNED = 'RETURNED',
    OVERDUE = 'OVERDUE'
}

export interface LoanInput {
    userId: string,
    copyId: string,
    dueDate: Date
}

export interface LoanDocument extends LoanInput, mongoose.Document {
    status: LoanStatus,
    returnedAt?: Date,
    createdAt: Date,
    updatedAt: Date
}

const loanSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    copyId: {type: mongoose.Schema.Types.ObjectId, ref: 'Copy', required: true},
    status: {type: String, enum: Object.values(LoanStatus), default: LoanStatus.ACTIVE},
    dueDate: {type: Date, required: true},
    returnedAt: {type: Date}
}, {timestamps: true, collection: "loans"});

export const LoanModel = mongoose.model<LoanDocument>('Loan', loanSchema);