import { describe, expect, test } from 'bun:test';

import { ExpectedFelt } from 'errors/primitives';
import { UndefinedValue } from 'errors/builtins';

import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { Memory } from 'memory/memory';
import { poseidonHandler } from './poseidon';

type PoseidonInput = {
  x: Felt;
  y: Felt;
  z: Felt;
  expected: Felt[];
};

describe('Poseidon', () => {
  const inputs: PoseidonInput[] = [
    {
      x: new Felt(1n),
      y: new Felt(2n),
      z: new Felt(3n),
      expected: [
        0xfa8c9b6742b6176139365833d001e30e932a9bf7456d009b1b174f36d558c5n,
        0x4f04deca4cb7f9f2bd16b1d25b817ca2d16fba2151e4252a2e2111cde08bfe6n,
        0x58dde0a2a785b395ee2dc7b60b79e9472ab826e9bb5383a8018b59772964892n,
      ].map((value) => new Felt(value)),
    },
    {
      x: new Felt(13n),
      y: new Felt(40n),
      z: new Felt(36n),
      expected: [
        0x3314844f551d723c07039394d16ceabebb5178983820576d393ed4725465b2en,
        0x368530a53a48b47a14e8e4e5cc1e531ec1c7fd92a0480ac5143ad6dc5794627n,
        0x5885c5b4d797dbae20b78bbfbb6e5ba02cc0a21ae05a9cac3606a21805be2c9n,
      ].map((value) => new Felt(value)),
    },
  ];

  test.each(inputs)(
    'should properly compute poseidon hash',
    ({ x, y, z, expected }: PoseidonInput) => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(poseidonHandler);
      const addressState1 = new Relocatable(segmentId, 3);
      const addressState2 = new Relocatable(segmentId, 4);
      const addressState3 = new Relocatable(segmentId, 5);

      memory.assertEq(new Relocatable(segmentId, 0), x);
      memory.assertEq(new Relocatable(segmentId, 1), y);
      memory.assertEq(new Relocatable(segmentId, 2), z);

      expect(memory.get(addressState1)).toEqual(expected[0]);
      expect(memory.get(addressState2)).toEqual(expected[1]);
      expect(memory.get(addressState3)).toEqual(expected[2]);
    }
  );

  test.each([0, 6])(
    'should throw UndefinedValue error when one of the two input is not constrained',
    (offset: number) => {
      const memory = new Memory();
      const { segmentId } = memory.addSegment(poseidonHandler);
      const address = new Relocatable(segmentId, offset);
      const addressHash = new Relocatable(segmentId, 3);

      memory.assertEq(address, new Felt(0n));

      expect(() => memory.get(addressHash)).toThrow(
        new UndefinedValue((offset + 1) % 6)
      );
    }
  );

  test('should throw ExpectedFelt error when trying to constrain an input cell to a Relocatable', () => {
    const memory = new Memory();
    const { segmentId } = memory.addSegment(poseidonHandler);
    const addressHash = new Relocatable(segmentId, 3);

    const xAddr = new Relocatable(segmentId, 0);
    const yAddr = new Relocatable(segmentId, 1);
    const zAddr = new Relocatable(segmentId, 2);
    const y = new Felt(1n);
    const z = new Felt(2n);

    memory.assertEq(xAddr, xAddr);
    memory.assertEq(yAddr, y);
    memory.assertEq(zAddr, z);

    expect(() => memory.get(addressHash)).toThrow(new ExpectedFelt(xAddr));
  });
});
