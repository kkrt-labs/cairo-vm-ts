import { test, expect, describe } from 'bun:test';
import { Felt } from './felt';
import {
  Relocatable,
  OffsetUnderflow,
  SegmentError,
  ForbiddenOperation,
  MemoryPointer,
  ProgramCounter,
} from './relocatable';
import { UnsignedInteger } from './uint';

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
      const result = a.sub(b).unwrap();
      expect(result.getOffset()).toEqual(7);
      expect(result.getSegmentIndex()).toEqual(1);
    });

    test('should return error OffsetUnderflow when offset goes below zero', () => {
      const a = new Relocatable(1, 2);
      const b = new Relocatable(1, 3);
      const result = a.sub(b).unwrapErr();
      expect(result).toEqual(OffsetUnderflow);
    });

    test('should return error SegmentError when segments are different', () => {
      const a = new Relocatable(1, 10);
      const b = new Relocatable(2, 5);
      const result = a.sub(b).unwrapErr();
      expect(result).toEqual(SegmentError);
    });

    test('should subtract a Felt from a Relocatable', () => {
      const relocatable = new Relocatable(0, 10);
      const felt = new Felt(5n);
      const result = relocatable.sub(felt).unwrap();
      expect(result.getOffset()).toEqual(5);
      expect(result.getSegmentIndex()).toEqual(0);
    });

    test('should return OffsetUnderflow when subtracting a larger Felt', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(10n);
      const result = relocatable.sub(felt).unwrapErr();
      expect(result).toEqual(OffsetUnderflow);
    });

    test('should subtract a Relocatable', () => {
      const a = new Relocatable(0, 10);
      const b = new Relocatable(0, 5);
      const result = a.sub(b).unwrap();
      expect(result.getOffset()).toEqual(5);
      expect(result.getSegmentIndex()).toEqual(0);
    });

    test('should subtract a Felt', () => {
      const a = new Relocatable(0, 10);
      const b = new Felt(5n);
      const result = a.sub(b).unwrap();
      expect(result.getOffset()).toEqual(5);
      expect(result.getSegmentIndex()).toEqual(0);
    });
  });

  describe('add', () => {
    test('should add a Felt', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(5n);
      const result = relocatable.add(felt).unwrap();
      expect(result.getOffset()).toEqual(10);
      expect(result.getSegmentIndex()).toEqual(0);
    });

    test('should return error ForbiddenOperation when adding an incompatible MaybeRelocatable', () => {
      const a = new Relocatable(0, 10);
      const b = new Relocatable(0, 5);
      const result = a.add(b).unwrapErr();
      expect(result).toEqual(ForbiddenOperation);
    });
    test('should add a Felt to a Relocatable', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(5n);
      const result = relocatable.add(felt).unwrap();
      expect(result.getOffset()).toEqual(10);
      expect(result.getSegmentIndex()).toEqual(0);
    });
    test('should add a positive number correctly to a relocatable', () => {
      const relocatable = new Relocatable(0, 5);
      const add = UnsignedInteger.toUint32(5).unwrap();
      const result = relocatable.add(add).unwrap();
      expect(result.getOffset()).toEqual(10);
      expect(result.getSegmentIndex()).toEqual(0);
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
