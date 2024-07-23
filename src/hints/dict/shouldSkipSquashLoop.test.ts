import { describe, expect, test } from 'bun:test';

import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';
import { HintName } from 'hints/hintName';
import { Felt } from 'primitives/felt';
import { shouldSkipSquashLoopParser } from './shouldSkipSquashLoop';

const SHOULD_SKIP_SQUASH_LOOP = {
  ShouldSkipSquashLoop: {
    should_skip_loop: {
      register: 'AP',
      offset: 0,
    },
  },
};

describe('shouldSkipSquashLoop', () => {
  test('should properly parse ShouldSkipSquashLoop hint', () => {
    const hint = shouldSkipSquashLoopParser.parse(SHOULD_SKIP_SQUASH_LOOP);
    expect(hint).toEqual({
      type: HintName.ShouldSkipSquashLoop,
      shouldSkipLoop: {
        register: Register.Ap,
        offset: 0,
      },
    });
  });

  test.each([
    [[new Felt(4n)], new Felt(1n)],
    [[new Felt(13n), new Felt(15n)], new Felt(0n)],
  ])('should properly execute ShouldSkipSquashLoop hint', (values, flag) => {
    const hint = shouldSkipSquashLoopParser.parse(SHOULD_SKIP_SQUASH_LOOP);
    const vm = new VirtualMachine();
    vm.memory.addSegment();
    vm.memory.addSegment();

    vm.squashedDictManager.keys = [new Felt(0n), new Felt(1n)];
    vm.squashedDictManager.keyToIndices.set('1', values);

    vm.executeHint(hint);

    expect(vm.memory.get(vm.ap)).toEqual(flag);
  });
});
