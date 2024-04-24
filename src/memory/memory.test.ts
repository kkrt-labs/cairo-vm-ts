import { test, expect, describe } from 'bun:test';
import { Memory } from './memory';
import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { WriteInvalidSegment, WriteOnceError } from 'errors/memory';

describe('Memory', () => {
  describe('get', () => {
    test('should return undefined if address is not written to', () => {
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

  describe('write', () => {
    test('should write a value in the memory at the given address', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 10);
      memory.write(address, DATA[0]);

      expect(memory.get(address)).toEqual(DATA[0]);
    });
    test('should throw SegmentError on uninitialized segment', () => {
      const memory = new Memory();
      const address = new Relocatable(1, 10);
      expect(() => memory.write(address, DATA[0])).toThrow(
        new WriteInvalidSegment(address.segment, memory.getSegmentNumber())
      );
    });
    test('should throw WriteOnceError on memory already written to', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 10);
      memory.write(address, DATA[0]);

      expect(() => memory.write(address, DATA[0])).toThrow(
        new WriteOnceError()
      );
    });
  });
});
