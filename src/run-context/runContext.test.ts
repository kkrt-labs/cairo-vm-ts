import { test, expect, describe } from 'bun:test';
import { RunContext } from './runContext';
import { UnsignedInteger } from 'primitives/uint';

describe('RunContext', () => {
  describe('incrementPc', () => {
    test('should successfully increment pc', () => {
      const ctx = new RunContext();
      const instructionSize = UnsignedInteger.toUint(2n);
      const result = ctx.incrementPc(instructionSize);

      expect(result.isOk() && result.unwrap().getOffset()).toEqual(2n);
      expect(result.isOk() && result.unwrap().getSegmentIndex()).toEqual(0n);
    });
  });
});
