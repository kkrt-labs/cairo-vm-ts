/** Name to identify which hint is executed  */
export enum HintName {
  AllocFelt252Dict = 'AllocFelt252Dict',
  AllocSegment = 'AllocSegment',
  AssertLeFindSmallArcs = 'AssertLeFindSmallArcs',
  AssertLeIsFirstArcExcluded = 'AssertLeIsFirstArcExcluded',
  AssertLeIsSecondArcExcluded = 'AssertLeIsSecondArcExcluded',
  Felt252DictEntryInit = 'Felt252DictEntryInit',
  Felt252DictEntryUpdate = 'Felt252DictEntryUpdate',
  GetCurrentAccessDelta = 'GetCurrentAccessDelta',
  GetCurrentAccessIndex = 'GetCurrentAccessIndex',
  GetNextDictKey = 'GetNextDictKey',
  GetSegmentArenaIndex = 'GetSegmentArenaIndex',
  InitSquashData = 'InitSquashData',
  ShouldContinueSquashLoop = 'ShouldContinueSquashLoop',
  ShouldSkipSquashLoop = 'ShouldSkipSquashLoop',
  TestLessThan = 'TestLessThan',
  TestLessThanOrEqualAddress = 'TestLessThanOrEqualAddress',
}
