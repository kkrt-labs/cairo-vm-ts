import { z } from 'zod';

import { Felt } from 'primitives/felt';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import {
  cellRef,
  resOperand,
  CellRef,
  ResOperand,
} from 'hints/hintParamsSchema';

/** Zod object to parse TestLessThan hint */
export const testLessThanParser = z
  .object({
    TestLessThan: z.object({ lhs: resOperand, rhs: resOperand, dst: cellRef }),
  })
  .transform(({ TestLessThan: { lhs, rhs, dst } }) => ({
    type: HintName.TestLessThan,
    lhs,
    rhs,
    dst,
  }));

/**
 * TestLessThan hint
 *
 * Store true at `dst` if value at `lhs` is strictly inferior to value at `rhs`.
 * Store false otherwise
 */
export type TestLessThan = z.infer<typeof testLessThanParser>;

/**
 * TestLessThan hint
 *
 * Check whether the value at `lhs` is strictly less than the value at `rhs`
 *
 * Store the boolean result (0 or 1) at `dst`
 */
export const testLessThan = (
  vm: VirtualMachine,
  lhs: ResOperand,
  rhs: ResOperand,
  dst: CellRef
) => {
  const lhsValue = vm.getResOperandValue(lhs);
  const rhsValue = vm.getResOperandValue(rhs);
  const result = new Felt(BigInt(lhsValue < rhsValue));
  vm.memory.assertEq(vm.cellRefToRelocatable(dst), result);
};
