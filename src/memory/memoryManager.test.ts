import { describe, test, expect } from 'bun:test';
import { MemorySegmentManager } from './memoryManager';
import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { UnsignedInteger } from 'primitives/uint';

const DATA = [
  new Relocatable(0n, 0n),
  new Relocatable(0n, 1n),
  new Felt(1n),
  new Felt(2n),
  new Relocatable(1n, 1n),
];

describe('MemoryManager', () => {
  describe('addSegment', () => {
    test('should add a new segment to the memory and return a pointer to it', () => {
      const memoryManager = new MemorySegmentManager();
      const segment = memoryManager.addSegment();

      expect(segment).toEqual(new Relocatable(0n, 0n));
    });
    test('should expand the memory size', () => {
      const memoryManager = new MemorySegmentManager();
      const segment = memoryManager.addSegment();

      expect(memoryManager.memory.getNumSegments()).toEqual(1n);
    });
  });
  describe('loadData', () => {
    test('should return the final state of the pointer', () => {
      const memoryManager = new MemorySegmentManager();
      memoryManager.addSegment();
      const address = new Relocatable(0n, 0n);
      const loadedAddress = memoryManager.loadData(address, DATA);

      expect(loadedAddress.isOk() && loadedAddress.unwrap()).toEqual(
        new Relocatable(0n, 5n)
      );
    });
    test('should load the data in memory', () => {
      const memoryManager = new MemorySegmentManager();
      memoryManager.addSegment();
      const address = new Relocatable(0n, 0n);
      memoryManager.loadData(address, DATA);

      expect([...memoryManager.memory.data.values()]).toEqual(DATA);
    });
    test('should update segmentSizes', () => {
      const memoryManager = new MemorySegmentManager();
      memoryManager.addSegment();
      const address = new Relocatable(0n, 0n);
      memoryManager.loadData(address, DATA);

      expect(
        memoryManager.getSegmentSize(UnsignedInteger.toUint64(0n))
      ).toEqual(UnsignedInteger.toUint64(5n));
    });
  });
});
