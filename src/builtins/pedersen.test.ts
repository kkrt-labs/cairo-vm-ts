import { describe, expect, test } from 'bun:test';

import { UndefinedValue } from 'errors/builtins';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { Memory } from 'memory/memory';
import { bitwiseHandler } from './bitwise';
import { ExpectedFelt } from 'errors/virtualMachine';
import { pedersenHandler } from './pedersen';

type PedersenInput = {
  x: Felt;
  y: Felt;
  expected: Felt;
};

describe('Pedersen', () => {
  const inputs: PedersenInput[] = [
    {
      x: new Felt(0n),
      y: new Felt(0n),
      expected: new Felt(
        0x49ee3eba8c1600700ee1b87eb599f16716b0b1022947733551fde4050ca6804n
      ),
    },
    {
      x: new Felt(0n),
      y: new Felt(1n),
      expected: new Felt(
        0x46c9aeb066cc2f41c7124af30514f9e607137fbac950524f5fdace5788f9d43n
      ),
    },
    {
      x: new Felt(1n),
      y: new Felt(0n),
      expected: new Felt(
        0x268a9d47dde48af4b6e2c33932ed1c13adec25555abaa837c376af4ea2f8a94n
      ),
    },
    {
      x: new Felt(54n),
      y: new Felt(1249832432n),
      expected: new Felt(
        0x20120a7d08fd21654c72a9281841406543b16d00faaca1069332053c41c07b8n
      ),
    },
  ];

  test.each(inputs)(
    'should properly compute pedersen hash',
    ({ x, y, expected }: PedersenInput) => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(pedersenHandler);
      const addressHash = new Relocatable(segmentId, 2);

      memory.assertEq(new Relocatable(segmentId, 0), x);
      memory.assertEq(new Relocatable(segmentId, 1), y);

      expect(memory.get(addressHash)).toEqual(expected);
    }
  );

  test.each([0, 1])(
    'should throw UndefinedValue error when one of the two input is not constrained',
    (offset: number) => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(bitwiseHandler);
      const address = new Relocatable(segmentId, offset);
      const addressHash = new Relocatable(segmentId, 2);

      memory.assertEq(address, new Felt(0n));

      expect(() => memory.get(addressHash)).toThrow(
        new UndefinedValue((offset + 1) % 2)
      );
    }
  );

  test('should throw ExpectedFelt error when trying to constrain an input cell to a Relocatable', () => {
    const memory = new Memory();
    const { segmentId } = memory.addSegment(bitwiseHandler);
    const addressHash = new Relocatable(segmentId, 2);

    const xAddr = new Relocatable(segmentId, 0);
    const yAddr = new Relocatable(segmentId, 1);
    const y = new Felt(1n);

    memory.assertEq(xAddr, xAddr);
    memory.assertEq(yAddr, y);

    expect(() => memory.get(addressHash)).toThrow(new ExpectedFelt());
  });
});
