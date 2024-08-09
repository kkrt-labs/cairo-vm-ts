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
 * Check whether the value at `lhs` is less than or equal to the value at `rhs`
 *
 */
export type TestLessThanOrEqual = z.infer<typeof testLessThanOrEqualParser>;

/**
 * TestLessThanOrEqual hint
 *
 * Store true at `dst` if value at `lhs` is inferior or equal to value at `rhs`, false otherwise.
 *
 * @param {VirtualMachine} vm - The virtual machine instance.
 * @param {ResOperand} lhs -  The left-hand side operand.
 * @param {ResOperand} rhs -  The right-hand side operand.
 * @param {CellRef} dst -  Pointer to where the result will be stored.
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
