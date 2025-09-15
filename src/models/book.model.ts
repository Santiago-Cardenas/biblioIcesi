import mongoose from "mongoose";

export interface BookInput {
    title: string,
    author: string,
    isbn: string,
    editorial?: string,
    year?: number,
    categoryId: string,
    description?: string,
    imageUrl?: string
}

export interface BookDocument extends BookInput, mongoose.Document {
    createdAt: Date,
    updatedAt: Date
}

const bookSchema = new mongoose.Schema({
    title: {type: String, required: true},
    author: {type: String, required: true},
    isbn: {type: String, required: true, unique: true},
    editorial: {type: String},
    year: {type: Number},
    categoryId: {type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true},
    description: {type: String},
    imageUrl: {type: String}
}, {timestamps: true, collection: "books"});

export const BookModel = mongoose.model<BookDocument>('Book', bookSchema);