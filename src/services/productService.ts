import { api } from './api';

export interface Product {
    id: string;
    name: string;
    sku?: string;
    description?: string;
    basePrice: number;
    currency: string;
    taxRate: number;
    category?: string;
    tags: string[];
    unit: string;
    isActive: boolean;
    imageUrl?: string;
    createdAt: string;
}

export interface CreateProductData {
    name: string;
    sku?: string;
    description?: string;
    basePrice: number;
    currency?: string;
    category?: string;
    unit?: string;
    isActive?: boolean;
}

export interface ProductSearchParams {
    search?: string;
    category?: string;
    isActive?: boolean;
}

export const getProducts = async (params?: ProductSearchParams) => {
    const response = await api.get('/products', { params });
    return response.data;
};

export const createProduct = async (data: CreateProductData) => {
    const response = await api.post('/products', data);
    return response.data;
};

export const updateProduct = async (id: string, data: Partial<CreateProductData>) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
};

export const deleteProduct = async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};
