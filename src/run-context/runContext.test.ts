import { test, expect, describe } from 'bun:test';
import { RunContext } from './runContext';
import { UnsignedInteger } from 'primitives/uint';

describe('RunContext', () => {
  describe('incrementPc', () => {
    test('should successfully increment pc', () => {
      const ctx = new RunContext();
      const instructionSize = UnsignedInteger.toUint32(2).unwrap();
      const result = ctx.incrementPc(instructionSize).unwrap();

      expect(result.getOffset()).toEqual(2);
      expect(result.getSegmentIndex()).toEqual(0);
    });
  });
});
