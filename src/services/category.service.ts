import { CategoryInput, CategoryInputUpdate } from "../interfaces";
import { CategoryDocument, CategoryModel } from "../models";

class CategoryService {
    public async create(categoryInput: CategoryInput): Promise<CategoryDocument> {
        const categoryExists = await CategoryModel.findOne({ name: categoryInput.name });
        if (categoryExists) {
            throw new ReferenceError('Category already exists');
        }
        return CategoryModel.create(categoryInput);
    }

    public async findAll(): Promise<CategoryDocument[]> {
        return CategoryModel.find({});
    }

    public async findById(id: string): Promise<CategoryDocument | null> {
        return CategoryModel.findById(id);
    }

    public async update(id: string, categoryInput: Partial<CategoryInput>): Promise<CategoryDocument | null> {
        return CategoryModel.findByIdAndUpdate(id, categoryInput, { new: true });
    }

    public async delete(id: string): Promise<any> {
        const category = await CategoryModel.findById(id);
        if (!category) {
            throw new ReferenceError("Category doesn't exist");
        }
        return CategoryModel.findByIdAndDelete(id);
    }
}

export const categoryService = new CategoryService();