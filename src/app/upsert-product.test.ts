import { describe, expect, it, vi } from 'vitest';
import { FakeProductRepo } from '../infra/fake-product-repo';
import { upsertProduct } from './upsert-product';
import type { UpsertProductCommand } from './upsert-product';

describe('upsertProduct', () => {
  const command: UpsertProductCommand = {
    id: 'p-001',
    name: 'Widget',
    pricePence: 1299,
    description: 'An example widget.',
  };
  const updatedAt = new Date('2026-01-15T12:00:00.000Z');

  it('saves a retrievable Product using the supplied clock', async () => {
    // Arrange
    // A fresh fake provides working in-memory persistence for this test.
    const productRepo = new FakeProductRepo();
    // A clock stub makes the timestamp deterministic.
    const now = () => updatedAt;
    const deps = { productRepo, now };
    const expectedProduct = { ...command, updatedAt };

    // Act
    const result = await upsertProduct(deps, command);
    const storedProduct = await productRepo.getById(command.id);

    // Assert
    // State verification checks meaningful stored values, not just success.
    expect(result).toEqual({ success: true, data: expectedProduct });
    expect(storedProduct).toEqual(expectedProduct);
  });

  it('returns validation issues without saving invalid input', async () => {
    // Arrange
    const productRepo = new FakeProductRepo();
    const save = vi.spyOn(productRepo, 'save');
    const deps = { productRepo, now: () => updatedAt };
    const invalidCommand = { ...command, name: '   ' };

    // Act
    const result = await upsertProduct(deps, invalidCommand);

    // Assert
    expect(result).toMatchObject({
      success: false,
      reason: 'validation',
      issues: expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
      ]),
    });
    // Interaction verification: invalid input must not reach persistence.
    expect(save).not.toHaveBeenCalled();
  });

  it('propagates a repository save failure', async () => {
    // Arrange
    const productRepo = new FakeProductRepo();
    const deps = { productRepo, now: () => updatedAt };
    const failure = new Error('Repository unavailable');
    // Here the replaced method is a stub supplying a predetermined failure.
    vi.spyOn(productRepo, 'save').mockRejectedValue(failure);

    // Act
    const resultPromise = upsertProduct(deps, command);

    // Assert
    await expect(resultPromise).rejects.toBe(failure);
  });

  it.todo('rejects an invalid application clock without saving');
});
