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

/** Zod object to parse TestLessThanOrEqualAddress hint */
export const testLessThanOrEqualAddressParser = z
  .object({
    TestLessThanOrEqualAddress: z.object({
      lhs: resOperand,
      rhs: resOperand,
      dst: cellRef,
    }),
  })
  .transform(({ TestLessThanOrEqualAddress: { lhs, rhs, dst } }) => ({
    type: HintName.TestLessThanOrEqualAddress,
    lhs,
    rhs,
    dst,
  }));

/**
 * TestLessThanOrEqualAddress hint
 *
 * Check whether the Relocatable value at `lhs` is inferior or equal to the value at `rhs`
 */
export type TestLessThanOrEqualAddress = z.infer<
  typeof testLessThanOrEqualAddressParser
>;

/**
 * TestLessThanOrEqualAddress hint
 *
 * Compares the values at the relocatable values `lhs` and `rhs` and stores
 * the result in `dst`. The result is `1` if the value at `lhs` is
 * less than or equal to the value at `rhs`, and `0` otherwise.
 *
 * @param {VirtualMachine} vm - The virtual machine instance.
 * @param {ResOperand} lhs - The relocatable value of the left-hand side operand.
 * @param {ResOperand} rhs - The relocatable value of the right-hand side operand.
 * @param {CellRef} dst - The address where the result of the comparison will be stored.
 */
export const testLessThanOrEqualAddress = (
  vm: VirtualMachine,
  lhs: ResOperand,
  rhs: ResOperand,
  dst: CellRef
) => {
  const lhsValue = vm.getResOperandRelocatable(lhs);
  const rhsValue = vm.getResOperandRelocatable(rhs);

  const isLessThanOrEqual = lhsValue <= rhsValue;

  const result = new Felt(isLessThanOrEqual ? 1n : 0n);

  vm.memory.assertEq(vm.cellRefToRelocatable(dst), result);
};
