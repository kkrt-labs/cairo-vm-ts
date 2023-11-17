import { test, expect, describe } from 'bun:test';
import { Memory } from './memory';
import { Relocatable } from 'primitives/relocatable';

describe('Memory', () => {
  describe('get', () => {
    test('should return undefined if address is not written to', () => {
      const memory = new Memory();
      const address = new Relocatable(0, 0);
      const result = memory.get(address);
      expect(result).toBeUndefined();
    });
  });
});
