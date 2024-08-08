import { z } from 'zod';
import { HintName } from 'hints/hintName';
import { cellRef, CellRef } from 'hints/hintParamsSchema';
import { resOperand, ResOperand } from 'hints/hintParamsSchema';
import { VirtualMachine } from 'vm/virtualMachine';
import { Felt } from 'primitives/felt';

export const wideMul128Parser = z.
    object({
        WideMul128: z.object({
            lhs: resOperand,
            rhs: resOperand,
            high: cellRef,
            low: cellRef
        }),
    })
    .transform(({ WideMul128: { lhs, rhs, high, low } }) => ({
        type: HintName.WideMul128,
        lhs,
        rhs,
        high,
        low
    }));

/**
 * Performs a wide multiplication of two 128-bit operands and stores the result.
 *
 * This function calculates the product of two 128-bit operands, splits the result into high and low 128-bit parts,
 * and stores them in the specified memory locations within the virtual machine.
 *
 * @param {VirtualMachine} vm - The virtual machine instance where the operation is executed.
 * @param {ResOperand} lhs - The left-hand side operand for the multiplication.
 * @param {ResOperand} rhs - The right-hand side operand for the multiplication.
 * @param {CellRef} high - The memory reference where the high 128 bits of the result will be stored.
 * @param {CellRef} low - The memory reference where the low 128 bits of the result will be stored.
 * @returns {void}
 */

export const wideMul128 = (
    vm: VirtualMachine,
    lhs: ResOperand,
    rhs: ResOperand,
    high: CellRef,
    low: CellRef
): void => {

    const mask = (1n << 128n) - 1n;

    const lhsVal = vm.getResOperandValue(lhs).toBigInt();
    const rhsVal = vm.getResOperandValue(rhs).toBigInt();

    const prod = lhsVal * rhsVal;

    const highVal = prod >> BigInt(128);
    vm.memory.assertEq(vm.cellRefToRelocatable(high), new Felt(highVal));

    const lowVal = prod & mask;
    const lowRef = vm.cellRefToRelocatable(low);
    vm.memory.assertEq(lowRef, new Felt(lowVal));

};

export type WideMul128 = z.infer<
    typeof wideMul128Parser
>;
