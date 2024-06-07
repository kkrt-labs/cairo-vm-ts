import { describe, expect, test } from 'bun:test';

import { Relocatable } from 'primitives/relocatable';
import { Memory } from 'memory/memory';
import { rangeCheckHandler } from './rangeCheck';
import { Felt } from 'primitives/felt';

describe('range check', () => {
  test.each([new Felt(0n), new Felt((1n << 128n) - 1n)])(
    'should properly assert values inferior to 2 ** 128 in range check segment',
    (value) => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(rangeCheckHandler);

      const offset = 0;
      const address = new Relocatable(segmentId, offset);

      expect(() => memory.assertEq(address, value)).not.toThrow();
      expect(memory.segments[segmentId][offset]).toEqual(value);
    }
  );

  test.each([new Felt(1n << 128n), new Felt(-1n)])(
    'should throw when trying to assert values equal or superior to 2 ** 128 in range check segment',
    (value) => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(rangeCheckHandler);

      const offset = 0;
      const address = new Relocatable(segmentId, offset);

      expect(() => memory.assertEq(address, value)).toThrow();
      expect(memory.segments[segmentId][offset]).toBeUndefined();
    }
  );
});
