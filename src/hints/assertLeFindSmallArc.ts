import { z } from 'zod';

import { VirtualMachine } from 'vm/virtualMachine';
import { ResOp, resOp } from 'hints/hintParamsSchema';
import { HintName } from 'hints/hintName';
import { Felt } from 'primitives/felt';

/** Zod object to parse AssertLeFindSmallArcs hint */
export const assertLeFindSmallArcsParser = z
  .object({
    AssertLeFindSmallArcs: z.object({
      range_check_ptr: resOp,
      a: resOp,
      b: resOp,
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
 */
export type AssertLeFindSmallArcs = z.infer<typeof assertLeFindSmallArcsParser>;

export type Arc = {
  value: Felt;
  pos: number;
};

/**
 * Check whether the first arc from `` is excluded.
 */
export const assertLeFindSmallArcs = (
  vm: VirtualMachine,
  rangeCheckPtr: ResOp,
  a: ResOp,
  b: ResOp
) => {
  const aVal = vm.getResOperandValue(a);
  const bVal = vm.getResOperandValue(b);
  const arcs: Arc[] = [
    { value: aVal, pos: 0 },
    { value: bVal.sub(aVal), pos: 1 },
    { value: new Felt(-1n).sub(bVal), pos: 2 },
  ].sort((a, b) => (a.value > b.value ? 1 : a.value < b.value ? -1 : 0));

  vm.scopeManager.set('excluded_arc', arcs[2].pos);

  const primeOver3High = new Felt(3544607988759775765608368578435044694n);
  const primeOver2High = new Felt(5316911983139663648412552867652567041n);
  const ptr = vm.getPointer(...vm.extractBuffer(rangeCheckPtr));

  vm.memory.assertEq(ptr, arcs[0].value.mod(primeOver3High));
  vm.memory.assertEq(ptr, arcs[0].value.div(primeOver3High));
  vm.memory.assertEq(ptr, arcs[1].value.mod(primeOver2High));
  vm.memory.assertEq(ptr, arcs[1].value.div(primeOver2High));
};
