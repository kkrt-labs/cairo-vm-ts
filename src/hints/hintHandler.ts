import { VirtualMachine } from 'vm/virtualMachine';

import { Hint } from './hintSchema';
import { HintName } from './hintName';

import { AllocSegment, allocSegment } from './allocSegment';
import {
  AssertLeFindSmallArcs,
  assertLeFindSmallArcs,
} from './assertLeFindSmallArc';
import {
  AssertLeIsFirstArcExcluded,
  assertLeIsFirstArcExcluded,
} from './assertLeIsFirstArcExcluded';
import {
  AssertLeIsSecondArcExcluded,
  assertLeIsSecondArcExcluded,
} from './assertLeIsSecondArcExcluded';
import { AllocFelt252Dict, allocFelt252Dict } from './dict/allocFelt252Dict';
import {
  Felt252DictEntryInit,
  felt252DictEntryInit,
} from './dict/felt252DictEntryInit';
import {
  Felt252DictEntryUpdate,
  felt252DictEntryUpdate,
} from './dict/felt252DictEntryUpdate';
import {
  GetCurrentAccessDelta,
  getCurrentAccessDelta,
} from './dict/getCurrentAccessDelta';
import {
  GetCurrentAccessIndex,
  getCurrentAccessIndex,
} from './dict/getCurrentAccessIndex';
import { GetNextDictKey, getNextDictKey } from './dict/getNextDictKey';
import {
  GetSegmentArenaIndex,
  getSegmentArenaIndex,
} from './dict/getSegmentArenaIndex';
import { InitSquashData, initSquashData } from './dict/initSquashData';
import {
  ShouldContinueSquashLoop,
  shouldContinueSquashLoop,
} from './dict/shouldContinueSquashLoop';
import {
  ShouldSkipSquashLoop,
  shouldSkipSquashLoop,
} from './dict/shouldSkipSquashLoop';
import { TestLessThan, testLessThan } from './math/testLessThan';
import {
  TestLessThanOrEqualAddress,
  testLessThanOrEqualAddress,
} from './math/testLessThanOrEqualAddress';

/**
 * Map hint names to the function executing their logic.
 */
export type HintHandler = Record<
  HintName,
  (vm: VirtualMachine, hint: Hint) => void
>;

export const handlers: HintHandler = {
  [HintName.AllocFelt252Dict]: (vm, hint) => {
    const h = hint as AllocFelt252Dict;
    allocFelt252Dict(vm, h.segmentArenaPtr);
  },
  [HintName.AllocSegment]: (vm, hint) => {
    const h = hint as AllocSegment;
    allocSegment(vm, h.dst);
  },
  [HintName.AssertLeFindSmallArcs]: (vm, hint) => {
    const h = hint as AssertLeFindSmallArcs;
    assertLeFindSmallArcs(vm, h.rangeCheckPtr, h.a, h.b);
  },
  [HintName.AssertLeIsFirstArcExcluded]: (vm, hint) => {
    const h = hint as AssertLeIsFirstArcExcluded;
    assertLeIsFirstArcExcluded(vm, h.skipExcludeFirstArc);
  },
  [HintName.AssertLeIsSecondArcExcluded]: (vm, hint) => {
    const h = hint as AssertLeIsSecondArcExcluded;
    assertLeIsSecondArcExcluded(vm, h.skipExcludeSecondArc);
  },
  [HintName.Felt252DictEntryInit]: (vm, hint) => {
    const h = hint as Felt252DictEntryInit;
    felt252DictEntryInit(vm, h.dictPtr, h.key);
  },
  [HintName.Felt252DictEntryUpdate]: (vm, hint) => {
    const h = hint as Felt252DictEntryUpdate;
    felt252DictEntryUpdate(vm, h.dictPtr, h.value);
  },
  [HintName.GetCurrentAccessDelta]: (vm, hint) => {
    const h = hint as GetCurrentAccessDelta;
    getCurrentAccessDelta(vm, h.indexDeltaMinusOne);
  },
  [HintName.GetCurrentAccessIndex]: (vm, hint) => {
    const h = hint as GetCurrentAccessIndex;
    getCurrentAccessIndex(vm, h.rangeCheckPtr);
  },
  [HintName.GetNextDictKey]: (vm, hint) => {
    const h = hint as GetNextDictKey;
    getNextDictKey(vm, h.nextKey);
  },
  [HintName.GetSegmentArenaIndex]: (vm, hint) => {
    const h = hint as GetSegmentArenaIndex;
    getSegmentArenaIndex(vm, h.dictEndptr, h.dictIndex);
  },
  [HintName.InitSquashData]: (vm, hint) => {
    const h = hint as InitSquashData;
    initSquashData(
      vm,
      h.dictAccesses,
      h.ptrDiff,
      h.nAccesses,
      h.bigKeys,
      h.firstKey
    );
  },
  [HintName.ShouldContinueSquashLoop]: (vm, hint) => {
    const h = hint as ShouldContinueSquashLoop;
    shouldContinueSquashLoop(vm, h.shouldContinue);
  },
  [HintName.ShouldSkipSquashLoop]: (vm, hint) => {
    const h = hint as ShouldSkipSquashLoop;
    shouldSkipSquashLoop(vm, h.shouldSkipLoop);
  },
  [HintName.TestLessThan]: (vm, hint) => {
    const h = hint as TestLessThan;
    testLessThan(vm, h.lhs, h.rhs, h.dst);
  },
  [HintName.TestLessThanOrEqualAddress]: (vm, hint) => {
    const h = hint as TestLessThanOrEqualAddress;
    testLessThanOrEqualAddress(vm, h.lhs, h.rhs, h.dst);
  },
};
