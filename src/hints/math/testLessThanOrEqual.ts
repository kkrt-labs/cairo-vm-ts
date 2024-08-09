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

/** Zod object to parse TestLessThanOrEqual hint */
export const testLessThanOrEqualParser = z
  .object({
    TestLessThanOrEqual: z.object({
      lhs: resOperand,
      rhs: resOperand,
      dst: cellRef,
    }),
  })
  .transform(({ TestLessThanOrEqual: { lhs, rhs, dst } }) => ({
    type: HintName.TestLessThanOrEqual,
    lhs,
    rhs,
    dst,
  }));

/**
 * TestLessThanOrEqual hint
 *
 * Store true at `dst` if value at `lhs` is inferior or equal to value at `rhs`.
 * Store false otherwise
 */
export type TestLessThanOrEqual = z.infer<typeof testLessThanOrEqualParser>;

/**
 * TestLessThanOrEqual hint
 *
 * Check whether the value at `lhs` is less than or equal to the value at `rhs`
 *
 * Store the boolean result (0 or 1) at `dst`
 * 
 * 
 * @param {VirtualMachine} vm - The virtual machine instance.
 * @param {ResOperand} lhs -  Pointer to the operand representing the left-hand side value in the comparison.
 * @param {ResOperand} rhs -  Pointer to the operand representing the right-hand side value in the comparison.
 * @param {CellRef} dst -  Pointer to where the result of the comparison (0 or 1) will be stored. 
 * 
 */
export const testLessThanOrEqual = (
  vm: VirtualMachine,
  lhs: ResOperand,
  rhs: ResOperand,
  dst: CellRef
) => {
  const lhsValue = vm.getResOperandValue(lhs);
  const rhsValue = vm.getResOperandValue(rhs);
  const result = new Felt(BigInt(lhsValue <= rhsValue));
  vm.memory.assertEq(vm.cellRefToRelocatable(dst), result);
};
