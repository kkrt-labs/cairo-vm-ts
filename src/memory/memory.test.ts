import { test, expect, describe } from 'bun:test';

import { SegmentOutOfBounds, InconsistentMemory } from 'errors/memory';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { Memory } from './memory';

describe('Memory', () => {
  describe('get', () => {
    test('should return undefined if address is not constrained yet', () => {
      const memory = new Memory();
      const address = new Relocatable(0, 0);
      const result = memory.get(address);
      expect(result).toBeUndefined();
    });
  });

  const VALUES = [
    new Relocatable(0, 0),
    new Relocatable(0, 1),
    new Felt(1n),
    new Felt(2n),
    new Relocatable(1, 1),
  ];

  describe('addSegment', () => {
    test('should add a new segment to the memory and return a pointer to it', () => {
      const memory = new Memory();
      expect(memory.getSegmentNumber()).toEqual(1);
      memory.addSegment();
      expect(memory.getSegmentNumber()).toEqual(2);
    });
    test('should expand the memory size', () => {
      const memory = new Memory();
      memory.addSegment();

      expect(memory.getSegmentNumber()).toEqual(2);
    });
  });
  describe('setValues', () => {
    test('should set the values in memory', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 0);
      memory.setValues(address, VALUES);

      expect([...memory.values[0]]).toEqual(VALUES);
    });
    test('should update segmentSizes', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 0);
      memory.setValues(address, VALUES);

      expect(memory.getSegmentSize(0)).toEqual(5);
    });
  });

  describe('assertEq', () => {
    test('should write when the value is undefined', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 10);
      memory.assertEq(address, VALUES[0]);

      expect(memory.get(address)).toEqual(VALUES[0]);
    });

    test('should not throw when the given value is the one stored', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 10);
      memory.assertEq(address, VALUES[0]);

      expect(() => memory.assertEq(address, VALUES[0])).not.toThrow();
    });

    test('should throw when the given value is not the one stored', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 10);
      memory.assertEq(address, VALUES[0]);

      expect(() => memory.assertEq(address, VALUES[1])).toThrow(
        new InconsistentMemory(address, VALUES[0], VALUES[1])
      );
    });

    test('should throw when the segment is not initialized', () => {
      const memory = new Memory();
      const address = new Relocatable(1, 10);
      expect(() => memory.assertEq(address, VALUES[0])).toThrow(
        new SegmentOutOfBounds(address.segment, memory.getSegmentNumber())
      );
    });
  });
});
