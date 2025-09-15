import mongoose from "mongoose";

export interface CategoryInput {
    name: string,
    description?: string
}

export interface CategoryDocument extends CategoryInput, mongoose.Document {
    createdAt: Date,
    updatedAt: Date
}

const categorySchema = new mongoose.Schema({
    name: {type: String, required: true, unique: true},
    description: {type: String}
}, {timestamps: true, collection: "categories"});

export const CategoryModel = mongoose.model<CategoryDocument>('Category', categorySchema);