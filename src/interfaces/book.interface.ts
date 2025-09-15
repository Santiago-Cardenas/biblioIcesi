export interface BookInput {
    title: string;
    author: string;
    isbn: string;
    editorial?: string;
    year?: number;
    categoryId: string;
    description?: string;
    imageUrl?: string;
}

export interface BookInputUpdate {
    title?: string;
    author?: string;
    isbn?: string;
    editorial?: string;
    year?: number;
    categoryId?: string;
    description?: string;
    imageUrl?: string;
}