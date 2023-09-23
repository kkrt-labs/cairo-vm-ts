import { describe, test, expect } from 'bun:test';
import { MemorySegmentManager } from './memoryManager';
import { Relocatable } from './primitives/relocatable';
import { Felt } from './primitives/felt';

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

      expect(memoryManager.memory.numSegments).toEqual(1);
    });
  });
  describe('loadData', () => {
    test('should load data into the memory', () => {
      const memoryManager = new MemorySegmentManager();
      memoryManager.addSegment();
      const data = [
        new Relocatable(0, 0),
        new Relocatable(0, 1),
        new Felt(1n),
        new Felt(2n),
        new Relocatable(1, 1),
      ];
      const address = new Relocatable(0, 0);

      expect(memoryManager.loadData(address, data)).toEqual(
        new Relocatable(0, 5)
      );
    });
  });
});
