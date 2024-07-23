import { describe, expect, test } from 'bun:test';

import { EmptyKeys } from 'errors/squashedDict';

import { Felt } from 'primitives/felt';
import { SquashedDictManager } from './squashedDictManager';

describe('SquashedDictManager', () => {
  test('should properly initialize a SquashedDictManager', () => {
    const squashedDictManager = new SquashedDictManager();
    expect(squashedDictManager.keys.length).toEqual(0);
    expect(squashedDictManager.keyToIndices.size).toEqual(0);
  });

  test('should properly insert new index', () => {
    const squashedDictManager = new SquashedDictManager();
    const key = new Felt(2n);
    const indices = [new Felt(3n), new Felt(5n), new Felt(1n)];
    squashedDictManager.keys.push(key);
    indices.map((index) => squashedDictManager.insert(key, index));
    expect(squashedDictManager.lastIndices()).toEqual(indices);
  });

  test('should properly get the last index', () => {
    const squashedDictManager = new SquashedDictManager();
    const key = new Felt(2n);
    const indices = [new Felt(3n), new Felt(5n), new Felt(1n)];
    squashedDictManager.keys.push(key);
    indices.map((index) => squashedDictManager.insert(key, index));
    expect(squashedDictManager.lastIndex()).toEqual(
      indices[indices.length - 1]
    );
  });

  test('should properly pop the last index', () => {
    const squashedDictManager = new SquashedDictManager();
    const key = new Felt(2n);
    const indices = [new Felt(3n), new Felt(5n), new Felt(1n)];
    squashedDictManager.keys.push(key);
    indices.map((index) => squashedDictManager.insert(key, index));
    expect(squashedDictManager.popIndex()).toEqual(indices[indices.length - 1]);
    expect(squashedDictManager.lastIndices()).toEqual(
      indices.slice(0, indices.length - 1)
    );
  });

  test('should properly pop the last key', () => {
    const squashedDictManager = new SquashedDictManager();
    const keys = [new Felt(2n), new Felt(5n), new Felt(7n)];
    keys.map((key) => squashedDictManager.keys.push(key));
    expect(squashedDictManager.popKey()).toEqual(keys[keys.length - 1]);
    expect(squashedDictManager.keys).toEqual(keys.slice(0, keys.length - 1));
  });

  test('should throw if there is no keys', () => {
    const squashedDictManager = new SquashedDictManager();
    expect(() => squashedDictManager.lastKey()).toThrow(new EmptyKeys());
  });
});
