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

/** Zod object to parse DivMod hint */
export const divModParser = z
  .object({
    DivMod: z.object({
      lhs: resOperand,
      rhs: resOperand,
      quotient: cellRef,
      remainder: cellRef,
    }),
  })
  .transform(({ DivMod: { lhs, rhs, quotient, remainder } }) => ({
    type: HintName.DivMod,
    lhs,
    rhs,
    quotient,
    remainder,
  }));

/**
 * DivMod hint type
 */
export type DivMod = z.infer<typeof divModParser>;

/**
 * Perform division and modulus operations.
 *
 * @param {VirtualMachine} vm - The virtual machine instance
 * @param {ResOperand} lhs - The left-hand side operand
 * @param {ResOperand} rhs - The right-hand side operand
 * @param {CellRef} quotient - The address to store the quotient
 * @param {CellRef} remainder - The address to store the remainder
 */

export const divMod = (
  vm: VirtualMachine,
  lhs: ResOperand,
  rhs: ResOperand,
  quotient: CellRef,
  remainder: CellRef
) => {
  const lhsValue = vm.getResOperandValue(lhs).toBigInt();
  const rhsValue = vm.getResOperandValue(rhs).toBigInt();

  if (rhsValue === 0n) {
    throw new Error('Division by zero');
  }

  const quotientValue = new Felt(lhsValue / rhsValue);
  const remainderValue = new Felt(lhsValue % rhsValue);

  vm.memory.assertEq(vm.cellRefToRelocatable(quotient), quotientValue);
  vm.memory.assertEq(vm.cellRefToRelocatable(remainder), remainderValue);
};
