import { Request, Response } from 'express';
import { categoryService } from '../services';
import { CategoryInput } from '../interfaces';

class CategoryController {
    public async create(req: Request, res: Response) {
        try {
            const newCategory = await categoryService.create(req.body as CategoryInput);
            res.status(201).json(newCategory);
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json(error);
        }
    }

    public async getAll(req: Request, res: Response) {
        try {
            const categories = await categoryService.findAll();
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async getOne(req: Request, res: Response) {
        try {
            const category = await categoryService.findById(req.params.id);
            if (!category) {
                res.status(404).json({ message: 'Category not found' });
                return;
            }
            res.status(200).json(category);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const category = await categoryService.update(req.params.id, req.body);
            if (!category) {
                res.status(404).json({ message: 'Category not found' });
                return;
            }
            res.status(200).json(category);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            await categoryService.delete(req.params.id);
            res.status(200).json({ message: 'Category deleted successfully' });
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(404).json({ message: error.message });
                return;
            }
            res.status(500).json(error);
        }
    }
}

export const categoryController = new CategoryController();