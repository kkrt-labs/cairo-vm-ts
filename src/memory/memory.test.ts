import { test, expect, describe } from 'bun:test';
import { Memory } from './memory';
import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { SegmentOutOfBounds, InconsistentMemory } from 'errors/memory';

describe('Memory', () => {
  describe('get', () => {
    test('should return undefined if address is not constrained yet', () => {
      const memory = new Memory();
      const address = new Relocatable(0, 0);
      const result = memory.get(address);
      expect(result).toBeUndefined();
    });
  });

  const DATA = [
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
  describe('setData', () => {
    test('should set the data in memory', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 0);
      memory.setData(address, DATA);

      expect([...memory.data[0]]).toEqual(DATA);
    });
    test('should update segmentSizes', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 0);
      memory.setData(address, DATA);

      expect(memory.getSegmentSize(0)).toEqual(5);
    });
  });

  describe('read', () => {
    test('should read a constrained value in the memory at the given address', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 10);
      memory.read(address, DATA[0]);

      expect(memory.get(address)).toEqual(DATA[0]);
    });
    test('should throw SegmentOutOfBounds on access to uninitialized segment', () => {
      const memory = new Memory();
      const address = new Relocatable(1, 10);
      expect(() => memory.read(address, DATA[0])).toThrow(
        new SegmentOutOfBounds(address.segment, memory.getSegmentNumber())
      );
    });
    test('should not throw when reading an address twice with the same value', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 10);
      memory.read(address, DATA[0]);

      expect(() => memory.read(address, DATA[0])).not.toThrow();
    });

    test('should throw InconsistentMemory on memory already constrained by a different value', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 10);
      memory.read(address, DATA[0]);

      expect(() => memory.read(address, DATA[1])).toThrow(
        new InconsistentMemory(address, DATA[0], DATA[1])
      );
    });
  });
});
