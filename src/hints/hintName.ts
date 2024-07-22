/** Name to identify which hint is executed  */
export enum HintName {
  AllocSegment = 'AllocSegment',
  TestLessThan = 'TestLessThan',
  AllocFelt252Dict = 'AllocFelt252Dict',
  Felt252DictEntryInit = 'Felt252DictEntryInit',
  Felt252DictEntryUpdate = 'Felt252DictEntryUpdate',
  GetSegmentArenaIndex = 'GetSegmentArenaIndex',
  InitSquashData = 'InitSquashData',
  GetCurrentAccessIndex = 'GetCurrentAccessIndex',
}
