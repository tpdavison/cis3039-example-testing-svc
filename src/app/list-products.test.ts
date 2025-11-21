import { describe, it, expect, vi } from 'vitest';
import { listProducts } from './list-products';
import { Product } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

describe('listProducts', () => {
  describe('successful scenarios', () => {
    it('should return empty array when no products exist', async () => {
      const mockRepo: ProductRepo = {
        list: vi.fn().mockResolvedValue([]),
        getById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn(),
      };

      const result = await listProducts({ productRepo: mockRepo });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(mockRepo.list).toHaveBeenCalledOnce();
    });

    it('should return all products from the repository', async () => {
      const products: Product[] = [
        {
          id: 'prod-1',
          name: 'Product 1',
          pricePence: 1000,
          description: 'First product',
          updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'prod-2',
          name: 'Product 2',
          pricePence: 2000,
          description: 'Second product',
          updatedAt: new Date('2025-01-02'),
        },
      ];

      const mockRepo: ProductRepo = {
        list: vi.fn().mockResolvedValue(products),
        getById: vi.fn(),
        save: vi.fn(),
        delete: vi.fn(),
      };

      const result = await listProducts({ productRepo: mockRepo });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(products);
      expect(result.data).toHaveLength(2);
      expect(mockRepo.list).toHaveBeenCalledOnce();
    });
  });

  describe('error scenarios', () => {
    // Error scenario tests can be added here
    it.todo('should handle repository errors gracefully');
  });
});
