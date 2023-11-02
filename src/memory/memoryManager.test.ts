import { describe, test, expect } from 'bun:test';
import { MemorySegmentManager } from './memoryManager';
import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';
import { UnsignedInteger } from 'primitives/uint';

const DATA = [
  new Relocatable(0, 0),
  new Relocatable(0, 1),
  new Felt(1n),
  new Felt(2n),
  new Relocatable(1, 1),
];

describe('MemoryManager', () => {
  describe('addSegment', () => {
    test('should add a new segment to the memory and return a pointer to it', () => {
      const memoryManager = new MemorySegmentManager();
      const segment = memoryManager.addSegment();

      expect(segment).toEqual(new Relocatable(0, 0));
    });
    test('should expand the memory size', () => {
      const memoryManager = new MemorySegmentManager();
      const segment = memoryManager.addSegment();

      expect(memoryManager.memory.getNumSegments()).toEqual(1);
    });
  });
  describe('loadData', () => {
    test('should return the final state of the pointer', () => {
      const memoryManager = new MemorySegmentManager();
      memoryManager.addSegment();
      const address = new Relocatable(0, 0);
      const loadedAddress = memoryManager.loadData(address, DATA);

      expect(loadedAddress).toEqual(new Relocatable(0, 5));
    });
    test('should load the data in memory', () => {
      const memoryManager = new MemorySegmentManager();
      memoryManager.addSegment();
      const address = new Relocatable(0, 0);
      memoryManager.loadData(address, DATA);

      expect([...memoryManager.memory.data.values()]).toEqual(DATA);
    });
    test('should update segmentSizes', () => {
      const memoryManager = new MemorySegmentManager();
      memoryManager.addSegment();
      const address = new Relocatable(0, 0);
      memoryManager.loadData(address, DATA);

      const segmentAddress = UnsignedInteger.ZERO_UINT32;

      expect(memoryManager.getSegmentSize(segmentAddress)).toEqual(
        UnsignedInteger.toUint32(5)
      );
    });
  });
});
