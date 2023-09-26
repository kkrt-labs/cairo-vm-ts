import { test, expect, describe } from 'bun:test';
import { Memory, UnknownAddressError, WriteOnceError } from './memory';
import {
  MaybeRelocatable,
  Relocatable,
  SegmentError,
} from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { UnsignedInteger } from 'primitives/uint';
import { Err, Ok, VMError } from 'result-pattern/result';

describe('Memory', () => {
  describe('get', () => {
    test('should return error if address is not written to', () => {
      const memory = new Memory();
      const address = new Relocatable(0, 0);
      const result = memory.get(address) as Err<VMError>;
      expect(result.unwrapErr()).toEqual(UnknownAddressError);
    });

    test('should return the value at the address', () => {
      const memory = new Memory();
      memory.numSegments = UnsignedInteger.toUint(1);
      const address = new Relocatable(0, 0);
      const value = new Felt(10n);
      memory.insert(address, value);
      expect((memory.get(address) as Ok<MaybeRelocatable>).unwrap()).toEqual(
        value
      );
    });
  });

  describe('insert', () => {
    test('should return error if relocatable is out of memory segment bounds', () => {
      const memory = new Memory();
      const address = new Relocatable(1, 0);
      const value = new Felt(10n);
      const result = memory.insert(address, value) as Err<VMError>;
      expect(result.unwrapErr()).toEqual(SegmentError);
    });

    test('should return error if address is already written to', () => {
      let memory = new Memory();
      memory.numSegments = UnsignedInteger.toUint(1);
      const address = new Relocatable(0, 0);
      const value = new Felt(10n);
      memory.insert(address, value);
      const err = memory.insert(address, value) as Err<VMError>;
      expect(err.unwrapErr()).toEqual(WriteOnceError);
    });
  });
});
