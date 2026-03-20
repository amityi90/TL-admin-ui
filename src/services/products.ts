import type { Product } from '../types/index';

export const getProducts = async (): Promise<Product[]> => {
    // In a real app, this would be:
    // const response = await api.get('/products');
    // return response.data;
    
    // For now, return mock data to demonstrate the UI
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: '1',
                    name: 'Diamond Solitaire Ring',
                    description: 'A classic 1-carat diamond solitaire ring in 18k white gold.',
                    price: 2500,
                    images: ['https://placehold.co/400x400?text=Ring'],
                    category: 'Rings',
                    material: '18k White Gold',
                    stockCount: 12
                },
                {
                    id: '2',
                    name: 'Gold Chain Necklace',
                    description: 'Solid 24k gold chain necklace, 20 inches.',
                    price: 1200,
                    images: ['https://placehold.co/400x400?text=Necklace'],
                    category: 'Necklaces',
                    material: '24k Gold',
                    stockCount: 5
                },
                 {
                    id: '3',
                    name: 'Pearl Earrings',
                    description: 'Elegant freshwater pearl earrings with diamond accents.',
                    price: 800,
                    images: ['https://placehold.co/400x400?text=Earrings'],
                    category: 'Earrings',
                    material: 'Silver & Pearl',
                    stockCount: 20
                }
            ]);
        }, 800);
    });
};

export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    // const response = await api.post('/products', product);
    // return response.data;
    return new Promise((resolve) => {
         setTimeout(() => {
            resolve({ ...product, id: Math.random().toString(36).substr(2, 9) });
         }, 800);
    });
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<Product> => {
    // const response = await api.put(`/products/${id}`, product);
    // return response.data;
     return new Promise((resolve) => {
         setTimeout(() => {
            resolve({ id, ...product } as Product);
         }, 800);
    });
};

export const deleteProduct = async (_id: string): Promise<void> => {
    // await api.delete(`/products/${id}`);
    return new Promise((resolve) => {
         setTimeout(() => {
            resolve();
         }, 800);
    });
};
