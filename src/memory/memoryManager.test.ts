import { describe, test, expect } from 'bun:test';
import { MemorySegmentManager } from './memoryManager';
import { Relocatable } from 'primitives/relocatable';
import { Felt } from 'primitives/felt';

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
      const data = [
        new Relocatable(0n, 0n),
        new Relocatable(0n, 1n),
        new Felt(1n),
        new Felt(2n),
        new Relocatable(1n, 1n),
      ];
      const address = new Relocatable(0n, 0n);
      const loadedAddress = memoryManager.loadData(address, data);

      expect(loadedAddress.isOk() && loadedAddress.unwrap()).toEqual(
        new Relocatable(0n, 5n)
      );
    });
    test('should load the data in memory', () => {
      const memoryManager = new MemorySegmentManager();
      memoryManager.addSegment();
      const data = [
        new Relocatable(0n, 0n),
        new Relocatable(0n, 1n),
        new Felt(1n),
        new Felt(2n),
        new Relocatable(1n, 1n),
      ];
      const address = new Relocatable(0n, 0n);
      memoryManager.loadData(address, data);

      expect([...memoryManager.memory.data.values()]).toEqual(data);
    });
  });
});
