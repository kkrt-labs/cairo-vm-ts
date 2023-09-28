import { test, expect, describe } from 'bun:test';
import { Memory, UnknownAddressError, WriteOnceError } from './memory';
import {
  MaybeRelocatable,
  Relocatable,
  SegmentError,
} from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { UnsignedInteger } from 'primitives/uint';

describe('Memory', () => {
  describe('get', () => {
    test('should return error if address is not written to', () => {
      const memory = new Memory();
      const address = new Relocatable(0n, 0n);
      const result = memory.get(address);
      expect(result.isErr() && result.unwrapErr()).toEqual(UnknownAddressError);
    });

    test('should return the value at the address', () => {
      const memory = new Memory();
      memory.numSegments = UnsignedInteger.toUint(1n);
      const address = new Relocatable(0n, 0n);
      const value = new Felt(10n);
      memory.insert(address, value);
      let result = memory.get(address);
      expect(result.isOk() && result.unwrap()).toEqual(value);
    });
  });

  describe('insert', () => {
    test('should return error if relocatable is out of memory segment bounds', () => {
      const memory = new Memory();
      const address = new Relocatable(1n, 0n);
      const value = new Felt(10n);
      const result = memory.insert(address, value);
      expect(result.isErr() && result.unwrapErr()).toEqual(SegmentError);
    });

    test('should return error if address is already written to', () => {
      let memory = new Memory();
      memory.numSegments = UnsignedInteger.toUint(1n);
      const address = new Relocatable(0n, 0n);
      const value = new Felt(10n);
      memory.insert(address, value);
      const err = memory.insert(address, value);
      expect(err.isErr() && err.unwrapErr()).toEqual(WriteOnceError);
    });
  });
});
