import { beforeAll, describe, expect, test } from 'bun:test';
import { Memory } from 'memory/memory';
import { Bitwise } from './bitwise';
import { Felt } from 'primitives/felt';
import { Relocatable } from 'primitives/relocatable';
import { CannotInferValue, UndefinedValue } from 'errors/builtins';

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

  const addressAND = new Relocatable(0, 2);
  const addressXOR = new Relocatable(0, 3);
  const addressOR = new Relocatable(0, 4);

  test.each(inputs)(
    'should properly perform bitwise operations',
    ({ x, y, expected }: BitwiseInput) => {
      const memory = new Memory();
      memory.addSegment(new Bitwise());
      memory.assertEq(new Relocatable(0, 0), x);
      memory.assertEq(new Relocatable(0, 1), y);
      expect(memory.get(addressAND)).toEqual(expected.and);
      expect(memory.get(addressXOR)).toEqual(expected.xor);
      expect(memory.get(addressOR)).toEqual(expected.or);
    }
  );

  test('should properly perform multiple bitwise operations ', () => {
    const memory = new Memory();
    memory.addSegment(new Bitwise());
    const x = new Felt(1n);
    const y = new Felt(2n);
    memory.assertEq(new Relocatable(0, 0), x);
    memory.assertEq(new Relocatable(0, 1), y);
    memory.assertEq(new Relocatable(0, 5), x);
    memory.assertEq(new Relocatable(0, 6), y);

    const expectedOR = new Felt(3n);
    const expectedAND = new Felt(0n);
    expect(memory.get(addressAND)).toEqual(expectedAND);
    expect(memory.get(addressXOR)).toEqual(expectedOR);
    expect(memory.get(addressOR)).toEqual(expectedOR);
    expect(memory.get(new Relocatable(0, 7))).toEqual(expectedAND);
    expect(memory.get(new Relocatable(0, 8))).toEqual(expectedOR);
    expect(memory.get(new Relocatable(0, 9))).toEqual(expectedOR);
  });

  test.each([new Relocatable(0, 0), new Relocatable(0, 1)])(
    'should throw UndefinedValue error when one of the two input is not constrained',
    (address: Relocatable) => {
      const memory = new Memory();
      memory.addSegment(new Bitwise());
      memory.assertEq(address, new Felt(0n));
      expect(() => memory.get(addressAND)).toThrow(
        new UndefinedValue(address.offset)
      );
    }
  );

  test.each([
    new Relocatable(0, 0),
    new Relocatable(0, 1),
    new Relocatable(0, 5),
    new Relocatable(0, 6),
  ])(
    'should throw CannotInferValue if trying to infer input values of the segment',
    (address: Relocatable) => {
      const memory = new Memory();
      memory.addSegment(new Bitwise());
      memory.assertEq(address, new Felt(0n));
      expect(() => memory.get(addressAND)).toThrow(
        new CannotInferValue(address)
      );
    }
  );

  test('should correctly print builtin name', () => {
    const memory = new Memory();
    memory.addSegment(new Bitwise());
    expect(memory.segments[0].builtin.toString()).toEqual('Bitwise builtin');
  });
});
