import { z } from 'zod';

import { Felt } from 'primitives/felt';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { ResOperand, resOperand } from 'hints/hintParamsSchema';

/** Zod object to parse AssertLeFindSmallArcs hint */
export const assertLeFindSmallArcsParser = z
  .object({
    AssertLeFindSmallArcs: z.object({
      range_check_ptr: resOperand,
      a: resOperand,
      b: resOperand,
    }),
  })
  .transform(({ AssertLeFindSmallArcs: { range_check_ptr, a, b } }) => ({
    type: HintName.AssertLeFindSmallArcs,
    rangeCheckPtr: range_check_ptr,
    a,
    b,
  }));

/**
 * AssertLeFindSmallArcs hint
 *
 * Find the two small arcs from [(0, a), (a, b), (b, PRIME)] and
 * assert them to the range check segment.
 */
export type AssertLeFindSmallArcs = z.infer<typeof assertLeFindSmallArcsParser>;

export type Arc = {
  value: Felt;
  pos: number;
};

/**
 * Compute the three arcs [(0, a), (a, b), (b, PRIME)]
 *
 * Set the biggest arc to the scope variable `excluded_arc`
 *
 * Store the modulo and remainder of the smallest arc (resp. second smallest arc)
 * against `Math.ceil(Felt.PRIME / 3) >> 128n` (resp. `Math.ceil(Felt.PRIME / 2) >> 128n`)
 */
export const assertLeFindSmallArcs = (
  vm: VirtualMachine,
  rangeCheckPtr: ResOperand,
  a: ResOperand,
  b: ResOperand
) => {
  const aVal = vm.getResOperandValue(a);
  const bVal = vm.getResOperandValue(b);
  const arcs: Arc[] = [
    { value: aVal, pos: 0 },
    { value: bVal.sub(aVal), pos: 1 },
    { value: new Felt(-1n).sub(bVal), pos: 2 },
  ].sort((a, b) => a.value.compare(b.value));

  vm.scopeManager.set('excluded_arc', arcs[2].pos);

  const primeOver3High = new Felt(3544607988759775765608368578435044694n);
  const primeOver2High = new Felt(5316911983139663648412552867652567041n);
  const ptr = vm.getPointer(...vm.extractBuffer(rangeCheckPtr));

  vm.memory.assertEq(ptr, arcs[0].value.mod(primeOver3High));
  vm.memory.assertEq(ptr.add(1), arcs[0].value.div(primeOver3High));
  vm.memory.assertEq(ptr.add(2), arcs[1].value.mod(primeOver2High));
  vm.memory.assertEq(ptr.add(3), arcs[1].value.div(primeOver2High));
};
