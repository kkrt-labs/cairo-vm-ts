export class PrimitiveError extends Error {}

// Felt and Relocatable errors

/** Forbidden operation */
export class ForbiddenOperation extends PrimitiveError {}
/** Offset underflow */
export class OffsetUnderflow extends PrimitiveError {}
/** Segment error */
export class SegmentError extends PrimitiveError {}
/** Underlying bigint negative, or greater than Felt.PRIME */
export class OutOfRangeBigInt extends PrimitiveError {}

// Int16 errors

/** Expected a byte array of length 2 */
export class ByteArrayLengthError extends PrimitiveError {}
/** Underlying number out of range */
export class OutOfRangeNumber extends PrimitiveError {}

// Uint errors

/** Cannot convert to Uint16, as underlying number < 0 or > 2^16 */
export class Uint16ConversionError extends PrimitiveError {}
/** Cannot convert to Uint53, as underlying number < 0 or > Number.MAX_SAFE_INTEGER OR is not an integer */
export class Uint53ConversionError extends PrimitiveError {}
/** Cannot convert to Uint64, as underlying bigint < 0 or > 2^64 */
export class Uint64ConversionError extends PrimitiveError {}
