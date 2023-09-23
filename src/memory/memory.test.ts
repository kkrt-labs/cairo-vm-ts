import { test, expect, describe } from 'bun:test';
import { Memory, UnknownAddressError, WriteOnceError } from './memory';
import { Relocatable, RelocatableError } from './primitives/relocatable';
import { Felt } from './primitives/felt';
import { UnsignedInteger } from './primitives/uint';

describe('Memory', () => {
  describe('get', () => {
    test('should throw if address is not written to', () => {
      const memory = new Memory();
      const address = new Relocatable(0, 0);

      expect(() => memory.get(address)).toThrow(new UnknownAddressError());
    });
    test('should return the value at the address', () => {
      const memory = new Memory();
      memory.numSegments = UnsignedInteger.toUint(1);
      const address = new Relocatable(0, 0);
      const value = new Felt(10n);
      memory.insert(address, value);

      expect(memory.get(address)).toEqual(value);
    });
  });
  describe('insert', () => {
    test('should throw if relocatable is out of memory segment bounds', () => {
      const memory = new Memory();
      const address = new Relocatable(1, 0);
      const value = new Felt(10n);

      expect(() => memory.insert(address, value)).toThrow(
        new RelocatableError()
      );
    });
    test('should throw if address is already written to', () => {
      let memory = new Memory();
      memory.numSegments = UnsignedInteger.toUint(1);
      const address = new Relocatable(0, 0);
      const value = new Felt(10n);
      memory.insert(address, value);

      expect(() => memory.insert(address, value)).toThrow(new WriteOnceError());
    });
  });
});
