import { Felt } from './felt';
import { Relocatable } from './relocatable';

export type SegmentValue = Relocatable | Felt;

export function isFelt(segmentValue: SegmentValue): segmentValue is Felt;
export function isFelt(
  segmentValue: SegmentValue | number
): segmentValue is Felt;
export function isFelt(
  segmentValue: SegmentValue | number
): segmentValue is Felt {
  return segmentValue instanceof Felt;
}

export function isRelocatable(
  segmentValue: SegmentValue
): segmentValue is Relocatable;
export function isRelocatable(
  segmentValue: SegmentValue | number
): segmentValue is Relocatable;
export function isRelocatable(
  segmentValue: SegmentValue | number
): segmentValue is Relocatable {
  return segmentValue instanceof Relocatable;
}
