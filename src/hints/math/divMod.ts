import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';

import { resOperand, ResOperand, cellRef, CellRef, } from 'hints/hintParamsSchema';
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
    leftHandSide: lhs,
    rightHandSide: rhs,
    quotientAddress: quotient,
    remainderAddress: remainder,
  }));


/**
 * DivMod hint type
 */
export type DivMod = z.infer<typeof divModParser>;

/**
 * Perform division and modulus operations.
 *
 * @param {VirtualMachine} vm - The virtual machine instance
 * @param {ResOperand} leftHandSide - The left-hand side operand
 * @param {ResOperand} rightHandSide - The right-hand side operand
 * @param {CellRef} quotientAddress - The address to store the quotient
 * @param {CellRef} remainderAddress - The address to store the remainder
 */

export const divMod = (
    vm: VirtualMachine,
    leftHandSide: ResOperand,
    rightHandSide: ResOperand,
    quotientAddress: CellRef,
    remainderAddress: CellRef
  ) => {
    const lhsValue = vm.getResOperandValue(leftHandSide).toBigInt();
    const rhsValue = vm.getResOperandValue(rightHandSide).toBigInt();
    
    if (rhsValue === 0n) {
      throw new Error("Division by zero");
    }

    const quotientValue = new Felt(lhsValue / rhsValue);
    const remainderValue = new Felt(lhsValue % rhsValue);
    
    const quotientAddr = vm.cellRefToRelocatable(quotientAddress);
    const remainderAddr = vm.cellRefToRelocatable(remainderAddress);

    vm.memory.assertEq(quotientAddr, quotientValue);
    vm.memory.assertEq(remainderAddr, remainderValue);
  };