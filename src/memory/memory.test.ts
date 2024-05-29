import { test, expect, describe, spyOn } from 'bun:test';

import { SegmentOutOfBounds, InconsistentMemory } from 'errors/memory';
import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { Memory } from './memory';

const VALUES = [
  new Relocatable(0, 0),
  new Relocatable(0, 1),
  new Felt(1n),
  new Felt(2n),
  new Relocatable(1, 1),
];

describe('Memory', () => {
  describe('constructor', () => {
    test('Should initialize the number of segments to 0', () => {
      const memory = new Memory();
      expect(memory.getSegmentNumber()).toEqual(0);
    });
  });

  describe('addSegment', () => {
    test('should add a new segment', () => {
      const memory = new Memory();
      memory.addSegment();
      expect(memory.getSegmentNumber()).toEqual(1);
    });
  });

  describe('get', () => {
    test('should throw when accessing an undefined segment', () => {
      const memory = new Memory();
      const address = new Relocatable(0, 0);
      expect(() => memory.get(address)).toThrow(
        new SegmentOutOfBounds(address.segmentId, memory.getSegmentNumber())
      );
    });

    test('should return undefined if address is not constrained yet', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 0);
      const result = memory.get(address);
      expect(result).toBeUndefined();
    });
  });

  describe('setValues', () => {
    test('should set the values in memory', () => {
      const memory = new Memory();
      memory.addSegment();
      const address = new Relocatable(0, 0);
      memory.setValues(address, VALUES);

      expect([...memory.segments[0]]).toEqual(VALUES);
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
        new InconsistentMemory(address.offset, VALUES[0], VALUES[1])
      );
    });

    test('should throw when the segment is not initialized', () => {
      const memory = new Memory();
      const address = new Relocatable(1, 10);
      expect(() => memory.assertEq(address, VALUES[0])).toThrow(
        new SegmentOutOfBounds(address.segmentId, memory.getSegmentNumber())
      );
    });
  });

  describe('toString', () => {
    test('Memory should be correctly printed to stdout', () => {
      const memory = new Memory();
      memory.addSegment();
      memory.addSegment();
      const addresses = [
        new Relocatable(0, 0),
        new Relocatable(0, 2),
        new Relocatable(1, 0),
      ];
      memory.assertEq(addresses[0], VALUES[2]);
      memory.assertEq(addresses[1], VALUES[3]);
      memory.assertEq(addresses[2], VALUES[1]);

      const expectedStr = [
        '\nMEMORY',
        'Address  ->  Value',
        '-----------------',
        '0:0 -> 1',
        '0:2 -> 2',
        '1:0 -> 0:1',
      ].join('\n');

      const logSpy = spyOn(memory, 'toString');

      memory.toString();

      expect(logSpy.mock.results[0].value).toEqual(expectedStr);
    });
  });
});
