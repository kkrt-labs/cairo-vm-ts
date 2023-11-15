import { test, expect, describe } from 'bun:test';
import { Felt } from './felt';
import { Relocatable, MemoryPointer, ProgramCounter } from './relocatable';
import { Uint32, UnsignedInteger } from './uint';
import {
  ForbiddenOperation,
  OffsetUnderflow,
  PrimitiveError,
  SegmentError,
} from 'result/primitives';

describe('Relocatable', () => {
  describe('constructor', () => {
    test('should initialize a relocatable correctly', () => {
      const relocatable = new Relocatable(0, 5);
      expect(relocatable.getSegmentIndex()).toEqual(0);
      expect(relocatable.getOffset()).toEqual(5);
    });
  });

  describe('sub', () => {
    test('should subtract two relocatables properly within the same segment', () => {
      const a = new Relocatable(1, 10);
      const b = new Relocatable(1, 3);
      const { value: result } = a.sub(b);
      expect(result as Felt).toEqual(new Felt(7n));
    });

    test('should return an error OffsetUnderflow when offset goes below zero', () => {
      const a = new Relocatable(1, 2);
      const b = new Relocatable(1, 3);
      const { error } = a.sub(b);
      expect(error).toEqual(new PrimitiveError(OffsetUnderflow));
    });

    test('should return an error SegmentError when segments are different', () => {
      const a = new Relocatable(1, 10);
      const b = new Relocatable(2, 5);
      const { error } = a.sub(b);

      expect(error).toEqual(new PrimitiveError(SegmentError));
    });

    test('should subtract a Felt from a Relocatable', () => {
      const relocatable = new Relocatable(0, 10);
      const felt = new Felt(5n);
      const { value: result } = relocatable.sub(felt);
      expect((result as Relocatable).getOffset()).toEqual(5);
      expect((result as Relocatable).getSegmentIndex()).toEqual(0);
    });

    test('should return an error OffsetUnderflow when subtracting a larger Felt', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(10n);
      const { error } = relocatable.sub(felt);
      expect(error).toEqual(new PrimitiveError(OffsetUnderflow));
    });

    test('should subtract a Relocatable', () => {
      const a = new Relocatable(0, 10);
      const b = new Relocatable(0, 5);
      const { value: result } = a.sub(b);
      expect(result as Felt).toEqual(new Felt(5n));
    });

    test('should subtract a Felt', () => {
      const a = new Relocatable(0, 10);
      const b = new Felt(5n);
      const { value: result } = a.sub(b);
      expect((result as Relocatable).getOffset()).toEqual(5);
      expect((result as Relocatable).getSegmentIndex()).toEqual(0);
    });
  });

  describe('add', () => {
    test('should add a Felt', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(5n);
      const { value: result } = relocatable.add(felt);
      expect((result as Relocatable).getOffset()).toEqual(10);
      expect((result as Relocatable).getSegmentIndex()).toEqual(0);
    });

    test('should return an error ForbiddenOperation when adding an incompatible MaybeRelocatable', () => {
      const a = new Relocatable(0, 10);
      const b = new Relocatable(0, 5);
      const { error } = a.add(b);
      expect(error).toEqual(new PrimitiveError(ForbiddenOperation));
    });
    test('should add a Felt to a Relocatable', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(5n);
      const { value: result } = relocatable.add(felt);
      expect((result as Relocatable).getOffset()).toEqual(10);
      expect((result as Relocatable).getSegmentIndex()).toEqual(0);
    });
    test('should add a positive number correctly to a relocatable', () => {
      const relocatable = new Relocatable(0, 5);
      const { value: add } = UnsignedInteger.toUint32(5);
      const { value: result } = relocatable.add(add as Uint32);
      expect((result as Relocatable).getOffset()).toEqual(10);
      expect((result as Relocatable).getSegmentIndex()).toEqual(0);
    });
  });

  describe('eq', () => {
    test('should return false for felt other', () => {
      const a = new Relocatable(0, 0);
      const b = new Felt(1n);
      const eq = a.eq(b);
      expect(eq).toBeFalse();
    });
    test('should return false for diff offset', () => {
      const a = new Relocatable(0, 0);
      const b = new Relocatable(0, 1);
      const eq = a.eq(b);
      expect(eq).toBeFalse();
    });
    test('should return false for diff segments', () => {
      const a = new Relocatable(0, 1);
      const b = new Relocatable(1, 1);
      const eq = a.eq(b);
      expect(eq).toBeFalse();
    });
    test('should return true for same offset and segment', () => {
      const a = new Relocatable(0, 1);
      const b = new Relocatable(0, 1);
      const eq = a.eq(b);
      expect(eq).toBeTrue();
    });
  });

  describe('getRelocatable', () => {
    test('should return the relocatable itself', () => {
      const relocatable = new Relocatable(0, 5);
      const result = Relocatable.getRelocatable(relocatable);
      expect(result).toEqual(relocatable);
    });
    test('should return undefined', () => {
      const relocatable = new Felt(5n);
      const result = Relocatable.getRelocatable(relocatable);
      expect(result).toBeUndefined();
    });
  });
});

describe('MemoryPointer', () => {
  describe('constructor', () => {
    test('should always set segment to 1', () => {
      const pointer = new MemoryPointer(42);
      expect(pointer.getSegmentIndex()).toEqual(1);
      expect(pointer.getOffset()).toEqual(42);
    });
  });
});

describe('ProgramCounter', () => {
  describe('constructor', () => {
    test('should always set segment to 0', () => {
      const pc = new ProgramCounter(24);
      expect(pc.getSegmentIndex()).toEqual(0);
      expect(pc.getOffset()).toEqual(24);
    });
  });
});
