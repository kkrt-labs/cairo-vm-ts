import { test, expect, describe } from 'bun:test';
import { Memory, UnknownAddressError, WriteOnceError } from './memory';
import {
  MaybeRelocatable,
  Relocatable,
  SegmentError,
} from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { UnsignedInteger } from 'primitives/uint';
import { unwrapErr, unwrapOk } from 'test-utils/utils';

describe('Memory', () => {
  describe('get', () => {
    test('should return error if address is not written to', () => {
      const memory = new Memory();
      const address = new Relocatable(0, 0);
      const result = unwrapErr(memory.get(address));
      expect(result).toEqual(UnknownAddressError);
    });

    test('should return the value at the address', () => {
      const memory = new Memory();
      memory.incrementNumSegments();
      const address = new Relocatable(0, 0);
      const value = new Felt(10n);
      memory.insert(address, value);
      let result = unwrapOk(memory.get(address));
      expect(result).toEqual(value);
    });
  });

  describe('insert', () => {
    test('should return error if relocatable is out of memory segment bounds', () => {
      const memory = new Memory();
      const address = new Relocatable(1, 0);
      const value = new Felt(10n);
      const result = unwrapErr(memory.insert(address, value));
      expect(result).toEqual(SegmentError);
    });

    test('should return error if address is already written to', () => {
      let memory = new Memory();
      memory.incrementNumSegments();
      const address = new Relocatable(0, 0);
      const value = new Felt(10n);
      memory.insert(address, value);
      const err = unwrapErr(memory.insert(address, value));
      expect(err).toEqual(WriteOnceError);
    });
  });
});
