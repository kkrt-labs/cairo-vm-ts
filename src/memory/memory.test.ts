import { test, expect, describe } from 'bun:test';
import { Memory, WriteOnceError } from './memory';
import { Relocatable, SegmentError } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';

describe('Memory', () => {
  describe('get', () => {
    test('should return undefined if address is not written to', () => {
      const memory = new Memory();
      const address = new Relocatable(0, 0);
      const result = memory.get(address);
      expect(result).toEqual(undefined);
    });

    test('should return the value at the address', () => {
      const memory = new Memory();
      memory.incrementNumSegments();
      const address = new Relocatable(0, 0);
      const value = new Felt(10n);
      memory.insert(address, value);
      let result = memory.get(address);
      expect(result).toEqual(value);
    });
  });

  describe('insert', () => {
    test('should throw error if relocatable is out of memory segment bounds', () => {
      const memory = new Memory();
      const address = new Relocatable(1, 0);
      const value = new Felt(10n);
      expect(() => memory.insert(address, value)).toThrow(SegmentError);
    });

    test('should throw error if address is already written to', () => {
      let memory = new Memory();
      memory.incrementNumSegments();
      const address = new Relocatable(0, 0);
      const value = new Felt(10n);
      memory.insert(address, value);
      expect(() => memory.insert(address, value)).toThrow(WriteOnceError);
    });
  });
});
