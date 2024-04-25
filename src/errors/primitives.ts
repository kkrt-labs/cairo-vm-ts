export class PrimitiveError extends Error {}

// Felt and Relocatable errors
export const ForbiddenOperation = 'Forbidden operation';
export const OffsetUnderflow = 'Offset underflow';
export const SegmentError = 'Segment error';
export const OutOfRangeBigInt =
  'Underlying bigint negative, or greater than Felt.PRIME';
// Int16 errors
export const ByteArrayLengthError = 'Expected a byte array of length 2.';
export const OutOfRangeNumber = 'Underlying number out of range';
// Uint errors
export const Uint16ConversionError =
  'Cannot convert to Uint16, as underlying number < 0 or > 2^16';
export const Uint53ConversionError =
  'Cannot convert to Uint53, as underlying number < 0 or > Number.MAX_SAFE_INTEGER OR is not an integer';
export const Uint64ConversionError =
  'Cannot convert to Uint64, as underlying bigint < 0 or > 2^64';
