import { describe, expect, it } from 'vitest';
import { createProduct } from './product';
import type { CreateProductParams } from './product';

describe('createProduct', () => {
  const validParams: CreateProductParams = {
    id: 'p-001',
    name: 'Widget',
    pricePence: 1299,
    description: 'An example widget.',
    updatedAt: new Date('2026-01-15T12:00:00.000Z'),
  };

  it('creates a Product with the supplied values', () => {
    // Arrange
    const params = { ...validParams };

    // Act
    const result = createProduct(params);

    // Assert: compare values, including the fixed timestamp.
    expect(result).toEqual({ success: true, data: params });
  });

  it('rejects a whitespace-only ID with an ID validation issue', () => {
    // Arrange
    const params = { ...validParams, id: '   ' };

    // Act
    const result = createProduct(params);

    // Assert
    expect(result).toMatchObject({
      success: false,
      reason: 'validation',
      issues: expect.arrayContaining([
        expect.objectContaining({ field: 'id' }),
      ]),
    });
  });

  it('rejects a negative price with a price validation issue', () => {
    // Arrange
    const params = { ...validParams, pricePence: -1 };

    // Act
    const result = createProduct(params);

    // Assert
    expect(result).toMatchObject({
      success: false,
      reason: 'validation',
      issues: expect.arrayContaining([
        expect.objectContaining({ field: 'pricePence' }),
      ]),
    });
  });

  it('collects validation issues for multiple invalid fields', () => {
    // Arrange
    const params = {
      ...validParams,
      name: '   ',
      pricePence: -1,
      description: '   ',
    };

    // Act
    const result = createProduct(params);

    // Assert
    expect(result).toMatchObject({
      success: false,
      reason: 'validation',
      issues: expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
        expect.objectContaining({ field: 'pricePence' }),
        expect.objectContaining({ field: 'description' }),
      ]),
    });
  });

  it.todo('accepts a zero price');
});
