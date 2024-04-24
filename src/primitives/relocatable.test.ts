import { test, expect, describe } from 'bun:test';
import { Felt } from './felt';
import { Relocatable, MemoryPointer, ProgramCounter } from './relocatable';
import {
  ForbiddenOperation,
  OffsetUnderflow,
  SegmentError,
} from 'errors/primitives';

describe('Relocatable', () => {
  describe('constructor', () => {
    test('should initialize a relocatable correctly', () => {
      const relocatable = new Relocatable(0, 5);
      expect(relocatable.segment).toEqual(0);
      expect(relocatable.offset).toEqual(5);
    });
  });

  describe('sub', () => {
    test('should subtract two relocatables properly within the same segment', () => {
      const a = new Relocatable(1, 10);
      const b = new Relocatable(1, 3);
      const result = a.sub(b);
      expect(result).toEqual(new Felt(7n));
    });

    test('should throw an error OffsetUnderflow when offset goes below zero', () => {
      const a = new Relocatable(1, 2);
      const b = new Relocatable(1, 3);
      expect(() => a.sub(b)).toThrow(new OffsetUnderflow());
    });

    test('should throw an error SegmentError when segments are different', () => {
      const a = new Relocatable(1, 10);
      const b = new Relocatable(2, 5);
      expect(() => a.sub(b)).toThrow(new SegmentError());
    });

    test('should subtract a Felt from a Relocatable', () => {
      const relocatable = new Relocatable(0, 10);
      const felt = new Felt(5n);
      const result = relocatable.sub(felt);
      expect(result.offset).toEqual(5);
      expect(result.segment).toEqual(0);
    });

    test('should throw an error OffsetUnderflow when subtracting a larger Felt', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(10n);
      expect(() => relocatable.sub(felt)).toThrow(new OffsetUnderflow());
    });

    test('should subtract a Relocatable', () => {
      const a = new Relocatable(0, 10);
      const b = new Relocatable(0, 5);
      const result = a.sub(b);
      expect(result).toEqual(new Felt(5n));
    });

    test('should subtract a Felt', () => {
      const a = new Relocatable(0, 10);
      const b = new Felt(5n);
      const result = a.sub(b);
      expect(result.offset).toEqual(5);
      expect(result.segment).toEqual(0);
    });
  });

  describe('add', () => {
    test('should add a Felt', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(5n);
      const result = relocatable.add(felt);
      expect(result.offset).toEqual(10);
      expect(result.segment).toEqual(0);
    });

    test('should throw an error ForbiddenOperation when adding an incompatible MaybeRelocatable', () => {
      const a = new Relocatable(0, 10);
      const b = new Relocatable(0, 5);
      expect(() => a.add(b)).toThrow(new ForbiddenOperation());
    });
    test('should add a Felt to a Relocatable', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(5n);
      const result = relocatable.add(felt);
      expect(result.offset).toEqual(10);
      expect(result.segment).toEqual(0);
    });
    test('should add a positive number correctly to a relocatable', () => {
      const relocatable = new Relocatable(0, 5);
      const result = relocatable.add(5);
      expect(result.offset).toEqual(10);
      expect(result.segment).toEqual(0);
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
});

describe('MemoryPointer', () => {
  describe('constructor', () => {
    test('should always set segment to 1', () => {
      const pointer = new MemoryPointer(42);
      expect(pointer.segment).toEqual(1);
      expect(pointer.offset).toEqual(42);
    });
  });
});

describe('ProgramCounter', () => {
  describe('constructor', () => {
    test('should always set segment to 0', () => {
      const pc = new ProgramCounter(24);
      expect(pc.segment).toEqual(0);
      expect(pc.offset).toEqual(24);
    });
  });
});
