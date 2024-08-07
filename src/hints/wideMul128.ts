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
        lhs: lhs,
        rhs: rhs,
        high: high,
        low: low
    }));

export const wideMul128 = (
    vm: VirtualMachine,
    lhs: ResOperand,
    rhs: ResOperand,
    high: CellRef,
    low: CellRef
): void => {
    try {
        const mask128 = (BigInt(1) << BigInt(128)) - BigInt(1);

        //Gets the operands' values
        const lhsVal = vm.getResOperandValue(lhs).toBigInt();
        const rhsVal = vm.getResOperandValue(rhs).toBigInt();

        // Do multiplication
        const prod = lhsVal * rhsVal;

        //Calc and storage high
        const highVal = prod >> BigInt(128);
        const highRef = vm.cellRefToRelocatable(high);
        vm.memory.assertEq(highRef, new Felt(highVal));

        //Calc and storage low
        const lowVal = prod & mask128;
        const lowRef = vm.cellRefToRelocatable(low);
        vm.memory.assertEq(lowRef, new Felt(lowVal));

    } catch (error: any) {
        throw new Error(error.message);
    }
};

