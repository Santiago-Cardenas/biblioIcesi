import { BookInput, BookInputUpdate } from "../interfaces";
import { BookDocument, BookModel, CategoryModel, CopyModel } from "../models";

class BookService {
    public async create(bookInput: BookInput): Promise<BookDocument> {
        // Verificar que la categoría existe
        const category = await CategoryModel.findById(bookInput.categoryId);
        if (!category) {
            throw new ReferenceError('Category not found');
        }

        const bookExists = await BookModel.findOne({ isbn: bookInput.isbn });
        if (bookExists) {
            throw new ReferenceError('Book with this ISBN already exists');
        }
        
        return BookModel.create(bookInput);
    }

    public async findAll(): Promise<BookDocument[]> {
        return BookModel.find({}).populate('categoryId', 'name description');
    }

    public async findById(id: string): Promise<BookDocument | null> {
        return BookModel.findById(id).populate('categoryId', 'name description');
    }

    public async findByCategory(categoryId: string): Promise<BookDocument[]> {
        return BookModel.find({ categoryId }).populate('categoryId', 'name description');
    }

    public async search(query: string): Promise<BookDocument[]> {
        const searchRegex = new RegExp(query, 'i');
        return BookModel.find({
            $or: [
                { title: searchRegex },
                { author: searchRegex },
                { isbn: searchRegex }
            ]
        }).populate('categoryId', 'name description');
    }

    public async update(id: string, bookInput: BookInputUpdate): Promise<BookDocument | null> {
        const book = await BookModel.findById(id);
        if (!book) {
            throw new ReferenceError("Book doesn't exist");
        }

        // Si se actualiza la categoría, verificar que existe
        if (bookInput.categoryId) {
            const category = await CategoryModel.findById(bookInput.categoryId);
            if (!category) {
                throw new ReferenceError('Category not found');
            }
        }

        // Si se actualiza el ISBN, verificar que no exista otro libro con el mismo ISBN
        if (bookInput.isbn && bookInput.isbn !== book.isbn) {
            const existingBook = await BookModel.findOne({ isbn: bookInput.isbn });
            if (existingBook) {
                throw new ReferenceError('Book with this ISBN already exists');
            }
        }

        return BookModel.findByIdAndUpdate(id, bookInput, { new: true }).populate('categoryId', 'name description');
    }

    public async delete(id: string): Promise<any> {
        const book = await BookModel.findById(id);
        if (!book) {
            throw new ReferenceError("Book doesn't exist");
        }

        // Verificar si hay copias asociadas
        const copies = await CopyModel.find({ bookId: id });
        if (copies.length > 0) {
            throw new ReferenceError("Cannot delete book with existing copies");
        }

        return BookModel.findByIdAndDelete(id);
    }

    public async getBooksWithAvailableCopies(): Promise<BookDocument[]> {
        // Obtener libros que tienen al menos una copia disponible
        const availableBooks = await CopyModel.aggregate([
            { $match: { status: 'AVAILABLE' } },
            { $group: { _id: '$bookId' } },
            { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
            { $unwind: '$book' },
            { $replaceRoot: { newRoot: '$book' } }
        ]);

        return BookModel.populate(availableBooks, { path: 'categoryId', select: 'name description' });
    }
}

export const bookService = new BookService();