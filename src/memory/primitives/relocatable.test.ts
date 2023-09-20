import { test, expect, describe } from 'bun:test';
import { Felt } from './felt';
import {
  Relocatable,
  OffsetUnderflow,
  SegmentError,
  ForbiddenOperation,
} from './relocatable';

describe('Relocatable', () => {
  describe('constructor', () => {
    test('should initialise a relocatable correctly', () => {
      const relocatable = new Relocatable(0, 5);
      expect(relocatable.getSegmentIndex()).toEqual(0);
      expect(relocatable.getOffset()).toEqual(5);
    });
  });

  describe('sub', () => {
    test('should subtract two relocatables properly within the same segment', () => {
      const a = new Relocatable(1, 10);
      const b = new Relocatable(1, 3);
      const result = a.sub(b);
      expect(result.getOffset()).toEqual(7);
    });

    test('should throw OffsetUnderflow when offset goes below zero', () => {
      const a = new Relocatable(1, 2);
      const b = new Relocatable(1, 3);
      expect(() => a.sub(b)).toThrow(new OffsetUnderflow());
    });

    test('should throw SegmentError when segments are different', () => {
      const a = new Relocatable(1, 10);
      const b = new Relocatable(2, 5);
      expect(() => a.sub(b)).toThrow(new SegmentError());
    });
  });

  describe('addFelt', () => {
    test('should add a Felt to a Relocatable', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(5n);
      const result = relocatable.addFelt(felt);
      expect(result.getOffset()).toEqual(10);
    });
  });
  describe('subFelt', () => {
    test('should subtract a Felt from a Relocatable', () => {
      const relocatable = new Relocatable(0, 10);
      const felt = new Felt(5n);
      const result = relocatable.subFelt(felt);
      expect(result.getOffset()).toEqual(5);
    });

    test('should throw OffsetUnderflow when subtracting a larger Felt', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(10n);
      expect(() => relocatable.subFelt(felt)).toThrow(new OffsetUnderflow());
    });
  });

  describe('addMaybeRelocatable', () => {
    test('should add a Felt wrapped in MaybeRelocatable', () => {
      const relocatable = new Relocatable(0, 5);
      const felt = new Felt(5n);
      const result = relocatable.addMaybeRelocatable(felt);
      expect(result.getOffset()).toEqual(10);
    });

    test('should throw ForbiddenOperation when adding an incompatible MaybeRelocatable', () => {
      const a = new Relocatable(0, 10);
      const b = new Relocatable(0, 5);
      expect(() => a.addMaybeRelocatable(b)).toThrow(new ForbiddenOperation());
    });
  });

  describe('subMaybeRelocatable', () => {
    test('should subtract a Relocatable wrapped in MaybeRelocatable', () => {
      const a = new Relocatable(0, 10);
      const b = new Relocatable(0, 5);
      const result = a.subMaybeRelocatable(b);
      expect(result.getOffset()).toEqual(5);
    });

    test('should subtract a Felt wrapped in MaybeRelocatable', () => {
      const a = new Relocatable(0, 10);
      const b = new Felt(5n);
      const result = a.subMaybeRelocatable(b);
      expect(result.getOffset()).toEqual(5);
    });
  });
});
