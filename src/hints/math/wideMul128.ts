import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';

import {
  resOperand,
  ResOperand,
  cellRef,
  CellRef,
} from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { Felt } from 'primitives/felt';

/** Zod object to parse WideMul128 hint */
export const wideMul128Parser = z
  .object({
    WideMul128: z.object({
      lhs: resOperand,
      rhs: resOperand,
      high: cellRef,
      low: cellRef,
    }),
  })
  .transform(({ WideMul128: { lhs, rhs, high, low } }) => ({
    type: HintName.WideMul128,
    lhs,
    rhs,
    high,
    low,
  }));

/**
 * WideMul128 hint type
 */
export type WideMul128 = z.infer<typeof wideMul128Parser>;

/**
 * Perform 128-bit multiplication and store high and low parts.
 *
 * @param {VirtualMachine} vm - The virtual machine instance
 * @param {ResOperand} lhs - The left-hand side operand
 * @param {ResOperand} rhs - The right-hand side operand
 * @param {CellRef} high - The address to store the high part of the product
 * @param {CellRef} low - The address to store the low part of the product
 */
export const wideMul128 = (
  vm: VirtualMachine,
  lhs: ResOperand,
  rhs: ResOperand,
  high: CellRef,
  low: CellRef
) => {
  const lhsValue = vm.getResOperandValue(lhs).toBigInt();
  const rhsValue = vm.getResOperandValue(rhs).toBigInt();

  const product = lhsValue * rhsValue;
  const mask = (1n << 128n) - 1n;

  const highValue = new Felt(product >> 128n);
  const lowValue = new Felt(product & mask);

  vm.memory.assertEq(vm.cellRefToRelocatable(high), highValue);
  vm.memory.assertEq(vm.cellRefToRelocatable(low), lowValue);
};
