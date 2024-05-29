import { describe, expect, test } from 'bun:test';

import { UndefinedValue } from 'errors/builtins';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { Memory } from 'memory/memory';
import { bitwiseHandler } from './bitwise';
import { ExpectedFelt } from 'errors/virtualMachine';

type BitwiseInput = {
  x: Felt;
  y: Felt;
  expected: {
    and: Felt;
    xor: Felt;
    or: Felt;
  };
};

describe('Bitwise', () => {
  const inputs: BitwiseInput[] = [
    {
      x: new Felt(0n),
      y: new Felt(-1n),
      expected: { and: new Felt(0n), xor: new Felt(-1n), or: new Felt(-1n) },
    },
    {
      x: new Felt(1n),
      y: new Felt(2n),
      expected: { and: new Felt(0n), xor: new Felt(3n), or: new Felt(3n) },
    },
    {
      x: new Felt(2n),
      y: new Felt(1n),
      expected: { and: new Felt(0n), xor: new Felt(3n), or: new Felt(3n) },
    },
  ];

  test.each(inputs)(
    'should properly perform bitwise operations',
    ({ x, y, expected }: BitwiseInput) => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(bitwiseHandler);
      const addressAND = new Relocatable(segmentId, 2);
      const addressXOR = new Relocatable(segmentId, 3);
      const addressOR = new Relocatable(segmentId, 4);

      memory.assertEq(new Relocatable(segmentId, 0), x);
      memory.assertEq(new Relocatable(segmentId, 1), y);

      expect(memory.get(addressAND)).toEqual(expected.and);
      expect(memory.get(addressXOR)).toEqual(expected.xor);
      expect(memory.get(addressOR)).toEqual(expected.or);
    }
  );

  test.each([0, 1])(
    'should throw UndefinedValue error when one of the two input is not constrained',
    (offset: number) => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(bitwiseHandler);
      const address = new Relocatable(segmentId, offset);
      const addressAND = new Relocatable(segmentId, 2);

      memory.assertEq(address, new Felt(0n));

      expect(() => memory.get(addressAND)).toThrow(
        new UndefinedValue((offset + 1) % 2)
      );
    }
  );

  test('should throw ExpectedFelt error when trying to constrain an input cell to a Relocatable', () => {
    const memory = new Memory();
    const { segmentId } = memory.addSegment(bitwiseHandler);
    const addressAND = new Relocatable(segmentId, 2);

    const xAddr = new Relocatable(segmentId, 0);
    const yAddr = new Relocatable(segmentId, 1);
    const y = new Felt(1n);

    memory.assertEq(xAddr, xAddr);
    memory.assertEq(yAddr, y);

    expect(() => memory.get(addressAND)).toThrow(new ExpectedFelt());
  });
});
