import { describe, expect, test } from 'bun:test';

import { Felt } from 'primitives/felt';
import { Register } from 'vm/instruction';
import { VirtualMachine } from 'vm/virtualMachine';

import { HintName } from 'hints/hintName';
import { shouldContinueSquashLoopParser } from './shouldContinueSquashLoop';

const SHOULD_CONTINUE_SQUASH_LOOP = {
  ShouldContinueSquashLoop: {
    should_continue: {
      register: 'AP',
      offset: 0,
    },
  },
};

describe('ShouldContinueSquashLoop', () => {
  test('should properly parse ShouldContinueSquashLoop hint', () => {
    const hint = shouldContinueSquashLoopParser.parse(
      SHOULD_CONTINUE_SQUASH_LOOP
    );
    expect(hint).toEqual({
      type: HintName.ShouldContinueSquashLoop,
      shouldContinue: {
        register: Register.Ap,
        offset: 0,
      },
    });
  });

  test.each([
    [[new Felt(4n)], new Felt(0n)],
    [[new Felt(13n), new Felt(15n)], new Felt(1n)],
  ])(
    'should properly execute ShouldContinueSquashLoop hint',
    (values, flag) => {
      const hint = shouldContinueSquashLoopParser.parse(
        SHOULD_CONTINUE_SQUASH_LOOP
      );
      const vm = new VirtualMachine();
      vm.memory.addSegment();
      vm.memory.addSegment();

      vm.squashedDictManager.keys = [new Felt(0n), new Felt(1n)];
      vm.squashedDictManager.keyToIndices.set('1', values);

      vm.executeHint(hint);

      expect(vm.memory.get(vm.ap)).toEqual(flag);
    }
  );
});
