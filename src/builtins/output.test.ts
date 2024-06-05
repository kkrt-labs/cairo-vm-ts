import { describe, expect, test } from 'bun:test';
import { Memory } from 'memory/memory';
import { outputHandler } from './output';
import { Relocatable } from 'primitives/relocatable';
import { ExpectedFelt } from 'errors/virtualMachine';
import { Felt } from 'primitives/felt';

describe('Output', () => {
  test('Should properly add Felt to output segment', () => {
    const memory = new Memory();
    const { segmentId } = memory.addSegment(outputHandler);
    const address = new Relocatable(segmentId, 0);
    const a = new Felt(1n);
    const b = new Felt(2n);
    const c = new Felt(3n);

    memory.assertEq(address, a);
    memory.assertEq(address.add(1), b);
    memory.assertEq(address.add(2), c);

    expect(memory.segments[segmentId][0]).toEqual(new Felt(1n));
    expect(memory.segments[segmentId][1]).toEqual(new Felt(2n));
    expect(memory.segments[segmentId][2]).toEqual(new Felt(3n));
  });

  test('Should throw when trying to assert non-Felt value', () => {
    const memory = new Memory();
    const { segmentId } = memory.addSegment(outputHandler);
    const address = new Relocatable(segmentId, 10);
    const value = new Relocatable(0, 0);
    expect(() => memory.assertEq(address, value)).toThrow(new ExpectedFelt());
  });
});
