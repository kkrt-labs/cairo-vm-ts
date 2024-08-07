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
    TestLessThanOrEqualAddress: z.object({ lhs: resOperand, rhs: resOperand, dst: cellRef }),
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
 * Store true at `dst` if value at `lhs` inferior or equal to value at `rhs`.
 * Store false otherwise
 */
export type TestLessThan = z.infer<typeof testLessThanOrEqualAddressParser>;

/**
 * TestLessThanOrEqualAddress hint
 *
 * Check whether the value at `lhs` is inferior or equal to the value at `rhs`
 *
 * Store the boolean result (0 or 1) at `dst`
 */
export const testLessThanOrEqualAddress = (
  vm: VirtualMachine,
  lhs: ResOperand,
  rhs: ResOperand,
  dst: CellRef
) => {
  const lhsValue = vm.getResOperandRelocatable(lhs);
  const rhsValue = vm.getResOperandRelocatable(rhs);

  const isLessThanOrEqual = lhsValue.segmentId < rhsValue.segmentId || 
                            (lhsValue.segmentId === rhsValue.segmentId && lhsValue.offset <= rhsValue.offset);
                            
  const result = new Felt(isLessThanOrEqual ? 1n : 0n);

  vm.memory.assertEq(vm.cellRefToRelocatable(dst), result);
};
