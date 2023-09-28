import { test, expect, describe } from 'bun:test';
import { Felt } from './felt';
import {
  Relocatable,
  OffsetUnderflow,
  SegmentError,
  ForbiddenOperation,
} from './relocatable';
import { UnsignedInteger } from './uint';
import { Err, Ok, VMError } from 'result-pattern/result';

describe('Relocatable', () => {
  describe('constructor', () => {
    test('should initialise a relocatable correctly', () => {
      const relocatable = new Relocatable(0n, 5n);
      expect(relocatable.getSegmentIndex()).toEqual(0n);
      expect(relocatable.getOffset()).toEqual(5n);
    });
  });

  describe('sub', () => {
    test('should subtract two relocatables properly within the same segment', () => {
      const a = new Relocatable(1n, 10n);
      const b = new Relocatable(1n, 3n);
      const result = a.sub(b);
      expect(result.isOk() && result.unwrap().getOffset()).toEqual(7n);
      expect(result.isOk() && result.unwrap().getSegmentIndex()).toEqual(1n);
    });

    test('should return error OffsetUnderflow when offset goes below zero', () => {
      const a = new Relocatable(1n, 2n);
      const b = new Relocatable(1n, 3n);
      const result = a.sub(b);
      expect(result.isErr() && result.unwrapErr()).toEqual(OffsetUnderflow);
    });

    test('should return error SegmentError when segments are different', () => {
      const a = new Relocatable(1n, 10n);
      const b = new Relocatable(2n, 5n);
      const result = a.sub(b);
      expect(result.isErr() && result.unwrapErr()).toEqual(SegmentError);
    });

    test('should subtract a Felt from a Relocatable', () => {
      const relocatable = new Relocatable(0n, 10n);
      const felt = new Felt(5n);
      const result = relocatable.sub(felt);
      expect(result.isOk() && result.unwrap().getOffset()).toEqual(5n);
      expect(result.isOk() && result.unwrap().getSegmentIndex()).toEqual(0n);
    });

    test('should return OffsetUnderflow when subtracting a larger Felt', () => {
      const relocatable = new Relocatable(0n, 5n);
      const felt = new Felt(10n);
      const result = relocatable.sub(felt);
      expect(result.isErr() && result.unwrapErr()).toEqual(OffsetUnderflow);
    });

    test('should subtract a Relocatable', () => {
      const a = new Relocatable(0n, 10n);
      const b = new Relocatable(0n, 5n);
      const result = a.sub(b);
      expect(result.isOk() && result.unwrap().getOffset()).toEqual(5n);
      expect(result.isOk() && result.unwrap().getSegmentIndex()).toEqual(0n);
    });

    test('should subtract a Felt', () => {
      const a = new Relocatable(0n, 10n);
      const b = new Felt(5n);
      const result = a.sub(b);
      expect(result.isOk() && result.unwrap().getOffset()).toEqual(5n);
      expect(result.isOk() && result.unwrap().getSegmentIndex()).toEqual(0n);
    });
  });

  describe('add', () => {
    test('should add a Felt', () => {
      const relocatable = new Relocatable(0n, 5n);
      const felt = new Felt(5n);
      const result = relocatable.add(felt);
      expect(result.isOk() && result.unwrap().getOffset()).toEqual(10n);
      expect(result.isOk() && result.unwrap().getSegmentIndex()).toEqual(0n);
    });

    test('should return error ForbiddenOperation when adding an incompatible MaybeRelocatable', () => {
      const a = new Relocatable(0n, 10n);
      const b = new Relocatable(0n, 5n);
      const result = a.add(b);
      expect(result.isErr() && result.unwrapErr()).toEqual(ForbiddenOperation);
    });
    test('should add a Felt to a Relocatable', () => {
      const relocatable = new Relocatable(0n, 5n);
      const felt = new Felt(5n);
      const result = relocatable.add(felt);
      expect(result.isOk() && result.unwrap().getOffset()).toEqual(10n);
      expect(result.isOk() && result.unwrap().getSegmentIndex()).toEqual(0n);
    });
    test('should add a positive number correctly to a relocatable', () => {
      const relocatable = new Relocatable(0n, 5n);
      const result = relocatable.add(UnsignedInteger.toUint(5n));
      expect(result.isOk() && result.unwrap().getOffset()).toEqual(10n);
      expect(result.isOk() && result.unwrap().getSegmentIndex()).toEqual(0n);
    });
  });
});
