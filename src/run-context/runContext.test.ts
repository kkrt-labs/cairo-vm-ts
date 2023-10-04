import { test, expect, describe } from 'bun:test';
import { RunContext } from './runContext';
import { UnsignedInteger } from 'primitives/uint';
import { unwrapOk } from 'test-utils/utils';

describe('RunContext', () => {
  describe('incrementPc', () => {
    test('should successfully increment pc', () => {
      const ctx = new RunContext();
      const instructionSize = unwrapOk(UnsignedInteger.toUint32(2));
      const result = unwrapOk(ctx.incrementPc(instructionSize));

      expect(result.getOffset()).toEqual(2);
      expect(result.getSegmentIndex()).toEqual(0);
    });
  });
});
